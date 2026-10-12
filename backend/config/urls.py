from django.contrib import admin
from django.urls import path
from django.views.generic import TemplateView

from bucket.views import media
from rsvp.dashboard import dashboard, export_csv
from rsvp.views import create_rsvp, search_guests

admin.site.site_header = 'Shane & Zessa'

urlpatterns = [
    path('admin/', admin.site.urls),
    path('dashboard/', dashboard, name='guest_dashboard'),
    path('dashboard/guest-list.csv', export_csv, name='guest_export'),
    path('api/guests/', search_guests),
    path('api/rsvp/', create_rsvp),
    path('media/<path:key>', media),
    # The React one-pager (built into ../frontend/dist).
    path('', TemplateView.as_view(template_name='index.html')),
]
