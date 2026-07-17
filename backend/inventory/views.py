from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from django.db import transaction
from .models import InventoryRecord, InventoryTransaction
from .serializers import InventoryRecordSerializer, InventoryTransactionSerializer
from products.models import ProductVariant

class InventoryRecordViewSet(viewsets.ModelViewSet):
  queryset = InventoryRecord.objects.all().order_by('variant__product__name')
  serializer_class = InventoryRecordSerializer
  permission_classes = [permissions.IsAdminUser]

  @action(detail=False, methods=['post'], url_path='adjust')
  def adjust_stock(self, request):
    variant_id = request.data.get('variant_id')
    try:
      quantity_change = int(request.data.get('quantity_change', 0))
    except (ValueError, TypeError):
      return Response({'detail': 'quantity_change must be an integer'}, status=status.HTTP_400_BAD_REQUEST)
      
    transaction_type = request.data.get('transaction_type', 'CORRECTION')
    notes = request.data.get('notes', '')

    if not variant_id:
      return Response({'detail': 'variant_id is required'}, status=status.HTTP_400_BAD_REQUEST)

    if transaction_type not in ['RECEIVED', 'SOLD', 'CORRECTION']:
      return Response({'detail': 'Invalid transaction_type'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      with transaction.atomic():
        # Lock the row for update to guarantee safety
        record, created = InventoryRecord.objects.select_for_update().get_or_create(
          variant_id=variant_id,
          defaults={'current_stock': 0}
        )

        new_stock = record.current_stock + quantity_change
        if new_stock < 0:
          return Response({'detail': f'Operation rejected. Adjusting by {quantity_change} would result in negative stock ({new_stock}).'}, status=status.HTTP_400_BAD_REQUEST)

        record.current_stock = new_stock
        record.save()

        # Log transaction record
        tx = InventoryTransaction.objects.create(
          inventory_record=record,
          quantity_change=quantity_change,
          transaction_type=transaction_type,
          notes=notes
        )

      return Response({
        'status': 'success',
        'current_stock': record.current_stock,
        'transaction_id': tx.id,
        'detail': f"Successfully logged stock transaction for SKU {record.variant.sku}."
      }, status=status.HTTP_200_OK)

    except ProductVariant.DoesNotExist:
      return Response({'detail': 'Product variant not found'}, status=status.HTTP_404_NOT_FOUND)
    except Exception as e:
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class InventoryTransactionViewSet(viewsets.ModelViewSet):
  serializer_class = InventoryTransactionSerializer
  permission_classes = [permissions.IsAdminUser]

  def get_queryset(self):
    queryset = InventoryTransaction.objects.all().order_by('-created_at')
    variant_id = self.request.query_params.get('variant_id')
    if variant_id:
      queryset = queryset.filter(inventory_record__variant_id=variant_id)
    return queryset
