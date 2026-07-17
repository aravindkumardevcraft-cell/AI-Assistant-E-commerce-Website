from django.core.management.base import BaseCommand
from django.db import transaction
from products.models import Category, Product, ProductVariant
from inventory.models import InventoryRecord, InventoryTransaction

class Command(BaseCommand):
  help = 'Seeds categories, products, variants, and initial stock data for development'

  def handle(self, *args, **options):
    self.stdout.write('Seeding database with development data...')
    
    try:
      with transaction.atomic():
        # 1. Create Categories
        categories = {}
        category_data = [
          ('Personal Care', 'Skin care, soaps, shampoos, and personal hygiene'),
          ('Home Cleaning', 'Floor cleaners, glass cleaners, and disinfectants'),
          ('Laundry Care', 'Detergent powders, bars, and liquid fabric softeners'),
          ('Kitchen Care', 'Dishwash liquids, gels, scrubs, and surface cleansers'),
          ('Groceries', 'Daily cooking essentials, flour, rice, and spices')
        ]
        
        for name, desc in category_data:
          cat, created = Category.objects.get_or_create(name=name, defaults={'description': desc})
          categories[name] = cat
          if created:
            self.stdout.write(f'  Created Category: {name}')

        # 2. Define Products & Variants
        products_data = [
          # Personal Care
          {
            'category': 'Personal Care',
            'name': 'Cream Beauty Bar Soap',
            'brand': 'Dove',
            'description': 'Dove Cream Beauty Bar combines a gentle cleansing formula with signature 1/4 moisturizing cream to give you softer, smoother, healthier-looking skin.',
            'image_url': 'https://images.unsplash.com/photo-1607006342411-92fc4a4b8f52?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            'variants': [
              {'name': '100 g', 'sku': 'DOVE-SOAP-100G', 'price': 65.00, 'stock': 40},
              {'name': '3 x 100 g', 'sku': 'DOVE-SOAP-3X100G', 'price': 180.00, 'stock': 25}
            ]
          },
          {
            'category': 'Personal Care',
            'name': 'Anti-Dandruff Shampoo',
            'brand': 'Head & Shoulders',
            'description': 'Clinically proven up to 100% dandruff protection. Formulated with antioxidants to keep hair and scalp healthy.',
            'image_url': 'https://images.unsplash.com/photo-1535585209827-a15fcdbc4c2d?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            'variants': [
              {'name': '180 ml', 'sku': 'HS-SHAMP-180ML', 'price': 160.00, 'stock': 30},
              {'name': '340 ml', 'sku': 'HS-SHAMP-340ML', 'price': 299.00, 'stock': 15}
            ]
          },
          # Laundry Care
          {
            'category': 'Laundry Care',
            'name': 'Easy Wash Detergent Powder',
            'brand': 'Surf Excel',
            'description': 'Surf Excel Easy Wash removes tough stains easily. Works effectively in bucket wash or semi-automatic washing machines.',
            'image_url': 'https://images.unsplash.com/photo-1610557892470-76d74ae6221a?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            'variants': [
              {'name': '500 g', 'sku': 'SURF-DET-500G', 'price': 110.00, 'stock': 50},
              {'name': '1 kg', 'sku': 'SURF-DET-1KG', 'price': 210.00, 'stock': 45},
              {'name': '5 kg', 'sku': 'SURF-DET-5KG', 'price': 980.00, 'stock': 10}
            ]
          },
          # Kitchen Care
          {
            'category': 'Kitchen Care',
            'name': 'Dishwash Liquid Gel Lemon',
            'brand': 'Vim',
            'description': 'Vim Gel contains the power of 100 lemons, helping to clean tough grease from utensils easily without leaving scratches.',
            'image_url': 'https://images.unsplash.com/photo-1607613009820-a29f7bb81c04?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            'variants': [
              {'name': '250 ml', 'sku': 'VIM-GEL-250ML', 'price': 60.00, 'stock': 60},
              {'name': '500 ml', 'sku': 'VIM-GEL-500ML', 'price': 115.00, 'stock': 40}
            ]
          },
          # Home Cleaning
          {
            'category': 'Home Cleaning',
            'name': 'Disinfectant Floor Cleaner Citrus',
            'brand': 'Lizol',
            'description': 'Lizol kills 99.9% of germs, removes tough stains, and leaves a pleasant citrus fragrance, suitable for all types of floors.',
            'image_url': 'https://images.unsplash.com/photo-1581578731548-c64695cc6952?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            'variants': [
              {'name': '500 ml', 'sku': 'LIZOL-FL-500ML', 'price': 99.00, 'stock': 55},
              {'name': '1 L', 'sku': 'LIZOL-FL-1L', 'price': 189.00, 'stock': 35}
            ]
          },
          # Groceries
          {
            'category': 'Groceries',
            'name': 'Shudh Chakki Atta (Wheat Flour)',
            'brand': 'Aashirvaad',
            'description': '100% pure whole wheat flour processed with traditional chakki grind for soft, fluffy rotis.',
            'image_url': 'https://images.unsplash.com/photo-1509440159596-0249088772ff?w=500&auto=format&fit=crop&q=60&ixlib=rb-4.0.3',
            'variants': [
              {'name': '1 kg', 'sku': 'ASH-ATTA-1KG', 'price': 70.00, 'stock': 80},
              {'name': '5 kg', 'sku': 'ASH-ATTA-5KG', 'price': 320.00, 'stock': 50},
              {'name': '10 kg', 'sku': 'ASH-ATTA-10KG', 'price': 610.00, 'stock': 20}
            ]
          }
        ]

        # 3. Create Products and link variants + stock
        for prod_info in products_data:
          cat = categories[prod_info['category']]
          prod, p_created = Product.objects.get_or_create(
            name=prod_info['name'],
            brand=prod_info['brand'],
            defaults={
              'category': cat,
              'description': prod_info['description'],
              'image_url': prod_info['image_url'],
              'is_active': True
            }
          )
          
          if p_created:
            self.stdout.write(f'  Created Product: {prod.brand} {prod.name}')

          for var_info in prod_info['variants']:
            var, v_created = ProductVariant.objects.get_or_create(
              product=prod,
              sku=var_info['sku'],
              defaults={
                'name': var_info['name'],
                'price': var_info['price']
              }
            )

            # Link/Set stock in inventory app
            record, r_created = InventoryRecord.objects.get_or_create(
              variant=var,
              defaults={'current_stock': 0}
            )

            # If newly created variant or if stock is zero, let's receive new stock
            if r_created or record.current_stock == 0:
              initial_qty = var_info['stock']
              record.current_stock = initial_qty
              record.save()
              
              InventoryTransaction.objects.create(
                inventory_record=record,
                quantity_change=initial_qty,
                transaction_type='RECEIVED',
                notes='Initial development database seed'
              )
              
              self.stdout.write(f'    Linked SKU {var.sku} - Stock set to {initial_qty}')

      self.stdout.write(self.style.SUCCESS('Successfully seeded development database with categories, products, and variants!'))
    except Exception as e:
      self.stdout.write(self.style.ERROR(f'Error seeding database: {e}'))
