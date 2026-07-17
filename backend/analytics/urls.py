from django.urls import path
from .views import DemandIntelligenceView

urlpatterns = [
    path('demand/', DemandIntelligenceView.as_view(), name='demand_intelligence'),
]
