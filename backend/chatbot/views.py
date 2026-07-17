from rest_framework import views, permissions, status
from rest_framework.response import Response
from .services import ChatOrchestrator

class ChatbotQueryView(views.APIView):
  # Set AllowAny so that public questions can be processed without tokens,
  # but check authentication internally inside ChatOrchestrator
  permission_classes = [permissions.AllowAny]

  def post(self, request):
    query_text = request.data.get('query')
    if not query_text:
      return Response({'detail': 'query parameter is required.'}, status=status.HTTP_400_BAD_REQUEST)

    try:
      # Retrieve user if authenticated
      user = request.user if request.user and request.user.is_authenticated else None
      result = ChatOrchestrator.process_query(query_text, user=user)

      if result.get("requires_auth"):
        return Response({'detail': result["text"]}, status=status.HTTP_401_UNAUTHORIZED)

      return Response(result, status=status.HTTP_200_OK)
    except Exception as e:
      print(f"[CHATBOT ERROR] Internal exception: {e}")
      return Response({
        'text': 'The shopping assistant is temporarily unavailable. Please try again.',
        'products': [],
        'orders': [],
        'requires_auth': False,
        'intent': 'ERROR'
      }, status=status.HTTP_200_OK) # Return user-friendly text instead of crash
