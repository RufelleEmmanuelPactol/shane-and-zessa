"""The couple's dashboard: every invitation with its reply, and a CSV export.

The export has the same first columns the importer reads, so it can be edited
and uploaded again (the status columns are ignored on import).
"""
import csv
import functools
import os
import secrets

from django.contrib.admin.views.decorators import staff_member_required
from django.db.models import OuterRef, Subquery
from django.http import Http404, HttpResponse
from django.shortcuts import render
from django.urls import reverse
from django.utils import timezone

from .models import Guest, Party, Rsvp

COLUMNS = ['party', 'side', 'seats', 'name', 'role', 'searchable', 'aka', 'status', 'coming', 'replied_at', 'reply']


def invitations():
    latest = Rsvp.objects.filter(party=OuterRef('party')).order_by('-created_at')
    guests = Guest.objects.select_related('party').annotate(
        reply_attending=Subquery(latest.values('attending')[:1]),
        reply_guests=Subquery(latest.values('guests')[:1]),
        reply_at=Subquery(latest.values('created_at')[:1]),
        reply_message=Subquery(latest.values('message')[:1]),
    ).order_by('party__code', 'id')
    for g in guests:
        g.status = 'none' if g.reply_attending is None else ('yes' if g.reply_attending else 'no')
        yield g


STATUS_LABELS = {'yes': 'Coming', 'no': 'Declined', 'none': 'No reply'}


def _totals(rows):
    # one reply per party, however many names it has
    parties = {g.party_id: g for g in rows}.values()
    seats = sum(g.party.seats for g in parties)
    coming = sum(g.reply_guests or 0 for g in parties if g.status == 'yes')
    waiting = sum(g.party.seats for g in parties if g.status == 'none')
    # declined parties, plus seats an accepting party didn't fill
    declined = seats - coming - waiting
    return {
        'invitations': len(parties),
        'seats': seats,
        'coming': coming,
        'declined': declined,
        'waiting': waiting,
        'replied': sum(1 for g in parties if g.status != 'none'),
        # shares of the reserved seats, for the bar
        'pct_coming': round(100 * coming / seats, 1) if seats else 0,
        'pct_declined': round(100 * declined / seats, 1) if seats else 0,
    }


def staff_or_key(view):
    """Staff sign in as before; anyone else needs the secret link /dashboard/<DASHBOARD_KEY>/."""
    @functools.wraps(view)
    def wrapper(request, key=None):
        if key is None:
            return staff_member_required(view)(request)
        expected = os.environ.get('DASHBOARD_KEY', '')
        if not expected or not secrets.compare_digest(key, expected):
            raise Http404
        response = view(request, key)
        response['X-Robots-Tag'] = 'noindex, nofollow'
        response['Referrer-Policy'] = 'no-referrer'
        return response
    return wrapper


@staff_or_key
def dashboard(request, key=None):
    rows = list(invitations())
    for g in rows:
        g.status_label = STATUS_LABELS[g.status]
    sides = {side: _totals([g for g in rows if g.party.side == side]) for side, _ in Party.SIDES}
    return render(request, 'rsvp/dashboard.html', {
        'rows': rows,
        'total': _totals(rows),
        'bride': sides['bride'],
        'groom': sides['groom'],
        'export_url': reverse('guest_export_key', args=[key]) if key else reverse('guest_export'),
    })


@staff_or_key
def export_csv(request, key=None):
    response = HttpResponse(content_type='text/csv; charset=utf-8')
    response['Content-Disposition'] = f'attachment; filename="guest-list-{timezone.localdate():%Y-%m-%d}.csv"'
    response.write('﻿')  # so Excel reads the names' accents correctly
    writer = csv.writer(response)
    writer.writerow(COLUMNS)
    for g in invitations():
        writer.writerow([
            g.party.code, g.party.side, g.party.seats, g.name, g.role,
            'yes' if g.searchable else 'no', g.aka,
            STATUS_LABELS[g.status],
            g.reply_guests if g.status == 'yes' else '',
            timezone.localtime(g.reply_at).strftime('%Y-%m-%d %H:%M') if g.reply_at else '',
            g.reply_message or '',
        ])
    return response
