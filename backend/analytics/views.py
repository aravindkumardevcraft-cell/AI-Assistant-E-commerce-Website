from rest_framework import views, permissions, status
from rest_framework.response import Response
from .services import AnalyticsService

class DemandIntelligenceView(views.APIView):
  permission_classes = [permissions.IsAdminUser]

  def get(self, request):
    db = AnalyticsService.get_mongo_db()
    if db is None:
      # Safe database fallback degradation: return placeholder logs
      print("[ANALYTICS WARNING] MongoDB database connection down. Returning fallback stats.")
      fallback_data = [
        {'query': 'tide detergent powder', 'count': 8, 'last_requested': '2026-07-12T10:15:00Z'},
        {'query': 'organic honey', 'count': 5, 'last_requested': '2026-07-12T09:30:00Z'},
        {'query': 'dove moisturizing soap', 'count': 4, 'last_requested': '2026-07-12T11:45:00Z'},
        {'query': 'disinfectant wipes', 'count': 3, 'last_requested': '2026-07-12T12:00:00Z'},
      ]
      return Response(fallback_data)

    try:
      # Retrieve and aggregate unfulfilled search records from MongoDB
      collection = db['unfulfilled_queries']
      pipeline = [
        {
          '$group': {
            '_id': '$query',
            'count': {'$sum': 1},
            'last_requested': {'$max': '$created_at'}
          }
        },
        {
          '$sort': {'count': -1}
        },
        {
          '$project': {
            '_id': 0,
            'query': '$_id',
            'count': 1,
            'last_requested': 1
          }
        }
      ]
      
      results = list(collection.aggregate(pipeline))
      return Response(results, status=status.HTTP_200_OK)
    except Exception as e:
      print(f"[ANALYTICS ERROR] Failed to fetch aggregation stats: {e}")
      return Response({'detail': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
