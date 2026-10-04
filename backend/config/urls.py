from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView

from rsvp.views import create_rsvp

admin.site.site_header = 'Shane & Zessa'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/rsvp/', create_rsvp),
    # The React one-pager (built into ../frontend/dist).
    path('', TemplateView.as_view(template_name='index.html')),
]
