from django import forms
from django.contrib import admin, messages
from django.db.models import Count, OuterRef, Subquery
from django.shortcuts import redirect, render
from django.urls import path

from .importer import GuestListError, import_guests
from .models import Guest, Party, Rsvp


class GuestInline(admin.TabularInline):
    model = Guest
    extra = 0
    fields = ['name', 'role', 'sponsor', 'searchable', 'aka']


class RsvpInline(admin.TabularInline):
    model = Rsvp
    extra = 0
    fields = ['created_at', 'name', 'attending', 'guests', 'message']
    readonly_fields = fields
    can_delete = False
    show_change_link = True

    def has_add_permission(self, request, obj=None):
        return False


class RepliedFilter(admin.SimpleListFilter):
    title = 'reply'
    parameter_name = 'reply'

    def lookups(self, request, model_admin):
        return [('yes', 'Coming'), ('no', 'Declined'), ('none', 'No reply yet')]

    def queryset(self, request, qs):
        if self.value() == 'none':
            return qs.filter(rsvps__isnull=True)
        if self.value() in ('yes', 'no'):
            return qs.filter(latest_attending=self.value() == 'yes')
        return qs


class ImportForm(forms.Form):
    csv = forms.FileField(label='Guest list CSV', help_text='Columns: party, side, seats, name, role, searchable.')


@admin.register(Party)
class PartyAdmin(admin.ModelAdmin):
    list_display = ['code', 'members', 'side', 'seats', 'reply']
    list_filter = ['side', RepliedFilter]
    search_fields = ['code', 'guests__name', 'guests__aka']
    inlines = [GuestInline, RsvpInline]
    change_list_template = 'admin/rsvp/party/change_list.html'

    def get_queryset(self, request):
        latest = Rsvp.objects.filter(party=OuterRef('pk')).order_by('-created_at')
        return super().get_queryset(request).prefetch_related('guests').annotate(
            latest_attending=Subquery(latest.values('attending')[:1]),
            latest_guests=Subquery(latest.values('guests')[:1]),
            replies=Count('rsvps', distinct=True),
        )

    @admin.display(description='Guests')
    def members(self, obj):
        return ', '.join(g.name for g in obj.guests.all())

    @admin.display(description='Latest reply', ordering='latest_attending')
    def reply(self, obj):
        if obj.latest_attending is None:
            return '—'
        return f'Coming ({obj.latest_guests})' if obj.latest_attending else 'Declined'

    def changelist_view(self, request, extra_context=None):
        parties = self.get_queryset(request)
        coming = sum(p.latest_guests or 0 for p in parties if p.latest_attending)
        waiting = sum(p.seats for p in parties if p.latest_attending is None)
        extra_context = {**(extra_context or {}), 'title': (
            f'{sum(p.seats for p in parties)} seats reserved · {coming} coming · '
            f'{sum(1 for p in parties if p.latest_attending is False)} parties declined · {waiting} seats awaiting a reply'
        )}
        return super().changelist_view(request, extra_context)

    def get_urls(self):
        return [path('import/', self.admin_site.admin_view(self.import_view), name='rsvp_party_import'), *super().get_urls()]

    def import_view(self, request):
        form = ImportForm(request.POST or None, request.FILES or None)
        if request.method == 'POST' and form.is_valid():
            try:
                result = import_guests(form.cleaned_data['csv'].read().decode('utf-8-sig'))
            except (GuestListError, UnicodeDecodeError) as e:
                messages.error(request, f'Nothing was imported. {e}')
            else:
                messages.success(request, f"Imported {result['guests']} guests in {result['parties']} parties ({result['new_parties']} new).")
                return redirect('admin:rsvp_party_changelist')
        return render(request, 'admin/rsvp/party/import.html', {
            **self.admin_site.each_context(request), 'form': form, 'opts': self.model._meta, 'title': 'Import guest list',
        })


@admin.register(Guest)
class GuestAdmin(admin.ModelAdmin):
    list_display = ['name', 'party', 'role', 'sponsor', 'searchable']
    list_filter = ['party__side', 'sponsor', 'searchable']
    search_fields = ['name', 'aka', 'party__code']
    autocomplete_fields = ['party']


@admin.register(Rsvp)
class RsvpAdmin(admin.ModelAdmin):
    list_display = ['name', 'party', 'attending', 'guests', 'email', 'created_at']
    list_filter = ['attending']
    search_fields = ['name', 'email', 'message']
    readonly_fields = ['created_at']
    autocomplete_fields = ['party']

    def changelist_view(self, request, extra_context=None):
        # Show the running headcount above the list.
        yes = Rsvp.objects.filter(attending=True)
        extra_context = {**(extra_context or {}), 'title': (
            f"RSVPs: {sum(r.guests for r in yes)} guests coming, "
            f"{Rsvp.objects.filter(attending=False).count()} declined"
        )}
        return super().changelist_view(request, extra_context)
