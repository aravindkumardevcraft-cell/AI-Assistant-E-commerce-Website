import os
from pymongo import MongoClient
from django.utils import timezone

class AnalyticsService:
  @staticmethod
  def get_mongo_db():
    # Fetch MongoDB URI from environment settings
    mongo_uri = os.environ.get('MONGO_URI', 'mongodb://localhost:27017/')
    try:
      client = MongoClient(mongo_uri, serverSelectionTimeoutMS=2000)
      # Force connection validation check
      client.server_info()
      return client['smartstore_analytics']
    except Exception:
      # Return None if MongoDB is offline, allowing safe database fallback degradation
      return None

  @staticmethod
  def log_unfulfilled_search(search_term, user=None):
    # Log the search in local backend logs
    print(f"\n[DEMAND INTELLIGENCE] Unfulfilled Search Query logged: '{search_term}' by User: {user or 'Guest'}\n")
    
    # Save to MongoDB document collection if active
    db = AnalyticsService.get_mongo_db()
    if db is not None:
      try:
        db['unfulfilled_queries'].insert_one({
          'query': search_term,
          'user_id': user.id if user and user.is_authenticated else None,
          'email': user.email if user and user.is_authenticated else 'anonymous',
          'created_at': timezone.now().isoformat()
        })
      except Exception as e:
        print(f"[ANALYTICS WARNING] Failed to write search query to MongoDB: {e}")
