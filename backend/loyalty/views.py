from rest_framework import views, permissions, status
from rest_framework.response import Response
from .models import LoyaltyAccount
from .serializers import LoyaltyAccountSerializer

class LoyaltyAccountView(views.APIView):
  permission_classes = [permissions.IsAuthenticated]

  def get(self, request):
    account, created = LoyaltyAccount.objects.get_or_create(user=request.user)
    serializer = LoyaltyAccountSerializer(account)
    return Response(serializer.data, status=status.HTTP_200_OK)
