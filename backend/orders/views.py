from rest_framework import views, viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import models
from .models import Order, OrderItem
from .serializers import OrderSerializer
from .services import OrderService

class CheckoutView(views.APIView):
  permission_classes = [permissions.IsAuthenticated]

  def post(self, request):
    address_id = request.data.get('address_id')
    idempotency_key = request.data.get('idempotency_key')
    loyalty_points = int(request.data.get('loyalty_points_to_redeem', 0))

    if not address_id or not idempotency_key:
      return Response({'detail': 'address_id and idempotency_key are required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      response_data, is_cached = OrderService.create_order(
        user=request.user,
        address_id=address_id,
        idempotency_key=idempotency_key,
        loyalty_points_to_redeem=loyalty_points
      )
      
      status_code = status.HTTP_200_OK if is_cached else status.HTTP_201_CREATED
      return Response(response_data, status=status_code)
    except ValueError as e:
      return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class OrderViewSet(viewsets.ReadOnlyModelViewSet):
  serializer_class = OrderSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    return Order.objects.filter(user=self.request.user).order_by('-created_at')

  @action(detail=True, methods=['post'], url_path='cancel')
  def cancel_order(self, request, pk=None):
    order = self.get_object()
    if order.status != 'NEW':
      return Response({'detail': 'Only new orders can be cancelled by the customer.'}, status=status.HTTP_400_BAD_REQUEST)
    
    try:
      updated_order = OrderService.transition_order_status(
        order=order,
        target_status='CANCELLED',
        user=request.user,
        notes="Order cancelled by customer."
      )
      return Response(OrderSerializer(updated_order).data)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)


class AdminOrderViewSet(viewsets.ModelViewSet):
  serializer_class = OrderSerializer
  permission_classes = [permissions.IsAdminUser]

  def get_queryset(self):
    queryset = Order.objects.all().order_by('-created_at')
    
    # Filter by Status
    status_filter = self.request.query_params.get('status')
    if status_filter:
      queryset = queryset.filter(status=status_filter)

    # Search query (Customer name, phone, email, or Order ID)
    search = self.request.query_params.get('search')
    if search:
      if search.isdigit():
        # Try search by ID or exact phone
        queryset = queryset.filter(
          models.Q(id=search) | 
          models.Q(delivery_phone__contains=search)
        )
      else:
        queryset = queryset.filter(
          models.Q(user__email__icontains=search) |
          models.Q(user__first_name__icontains=search) |
          models.Q(user__last_name__icontains=search) |
          models.Q(delivery_address__icontains=search)
        )

    return queryset

  @action(detail=True, methods=['post'], url_path='transition')
  def transition_status(self, request, pk=None):
    order = self.get_object()
    target_status = request.data.get('status')
    notes = request.data.get('notes', '')
    delivery_eta = request.data.get('delivery_eta', '')
    
    # Confirm CoD payment on delivery completion
    if target_status == 'DELIVERED':
      cod_payment_received = request.data.get('cod_received')
      if not cod_payment_received:
        return Response({'detail': 'You must confirm that Cash on Delivery payment has been received before completing delivery.'}, status=status.HTTP_400_BAD_REQUEST)
      notes = notes or "Cash on Delivery payment received. Order delivered."

    if not target_status:
      return Response({'detail': 'status parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      updated_order = OrderService.transition_order_status(
        order=order,
        target_status=target_status,
        user=request.user,
        notes=notes,
        eta=delivery_eta
      )
      return Response(OrderSerializer(updated_order).data)
    except ValueError as e:
      return Response({'detail': str(e)}, status=status.HTTP_400_BAD_REQUEST)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)

  @action(detail=False, methods=['get'], url_path='stats')
  def get_stats(self, request):
    from accounts.models import User
    from inventory.models import InventoryRecord
    
    total_sales = Order.objects.filter(status='DELIVERED').aggregate(total=models.Sum('total_amount'))['total'] or 0.00
    new_orders = Order.objects.filter(status='NEW').count()
    active_operations = Order.objects.filter(status__in=['ACCEPTED', 'PACKING', 'READY_FOR_DELIVERY', 'OUT_FOR_DELIVERY']).count()
    total_customers = User.objects.filter(is_staff=False).count()
    low_stock = InventoryRecord.objects.filter(current_stock__lte=models.F('low_stock_threshold')).count()
    
    return Response({
      'total_sales': float(total_sales),
      'new_orders': new_orders,
      'active_operations': active_operations,
      'total_customers': total_customers,
      'low_stock_warnings': low_stock
    })

