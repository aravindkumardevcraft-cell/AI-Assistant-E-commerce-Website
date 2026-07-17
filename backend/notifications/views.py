from rest_framework import viewsets, permissions, status
from rest_framework.decorators import action
from rest_framework.response import Response
from .models import Notification
from .serializers import NotificationSerializer

class NotificationViewSet(viewsets.ModelViewSet):
  serializer_class = NotificationSerializer
  permission_classes = [permissions.IsAuthenticated]

  def get_queryset(self):
    # Returns only notifications directed to the currently logged in user
    return Notification.objects.filter(user=self.request.user).order_by('-created_at')

  @action(detail=True, methods=['post'], url_path='read')
  def mark_as_read(self, request, pk=None):
    notification = self.get_object()
    notification.is_read = True
    notification.save()
    return Response({'status': 'success', 'detail': 'Notification marked as read.'}, status=status.HTTP_200_OK)

  @action(detail=False, methods=['post'], url_path='read-all')
  def mark_all_as_read(self, request):
    Notification.objects.filter(user=request.user, is_read=False).update(is_read=True)
    return Response({'status': 'success', 'detail': 'All notifications marked as read.'}, status=status.HTTP_200_OK)
