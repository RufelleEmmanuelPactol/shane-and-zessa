from django.contrib import admin

from .models import Rsvp


@admin.register(Rsvp)
class RsvpAdmin(admin.ModelAdmin):
    list_display = ['name', 'attending', 'guests', 'email', 'created_at']
    list_filter = ['attending']
    search_fields = ['name', 'email', 'message']
    readonly_fields = ['created_at']

    def changelist_view(self, request, extra_context=None):
        # Show the running headcount above the list.
        yes = Rsvp.objects.filter(attending=True)
        extra_context = {**(extra_context or {}), 'title': (
            f"RSVPs: {sum(r.guests for r in yes)} guests coming, "
            f"{Rsvp.objects.filter(attending=False).count()} declined"
        )}
        return super().changelist_view(request, extra_context)
