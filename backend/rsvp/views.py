import json
import unicodedata

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_GET, require_POST

from .models import Guest, Rsvp

# Cap for replies that don't name a party (shouldn't happen from the page).
MAX_GUESTS = 4
MAX_RESULTS = 8
MAX_FAMILY = 8


def fold(s):
    return ''.join(c for c in unicodedata.normalize('NFD', s) if not unicodedata.combining(c)).lower().strip()


def surname(name):
    parts = fold(name).split()
    return parts[-1] if len(parts) > 1 else ''


def _guest_json(g):
    return {'id': g.id, 'name': g.name, 'seats': g.party.seats, 'sponsor': g.sponsor}


@require_GET
def search_guests(request):
    # The list is public-repo-sensitive, so the page only ever sees matches,
    # never the whole list, and only once two letters are typed.
    q = fold(request.GET.get('q', ''))
    if len(q) < 2:
        return JsonResponse({'results': []})
    guests = list(Guest.objects.filter(searchable=True).select_related('party'))
    matches = [
        g for g in guests
        if any(q in fold(n) for n in [g.name, *g.aka.split(',')] if n.strip())
    ]
    # names that start with what was typed come first
    matches.sort(key=lambda g: (not fold(g.name).startswith(q), g.name))
    matches = matches[:MAX_RESULTS]

    # Others who share a matched surname but are on a different invitation, so
    # "Ahriz Monteclaro" also shows the other Monteclaros: each replies for
    # their own invitation.
    shown = {g.id for g in matches}
    parties = {g.party_id for g in matches}
    # only from names with a word starting with what was typed, so "ah" brings
    # in Ahriz's family but not the family of everyone with "ah" mid-name
    names = {surname(g.name) for g in matches if any(w.startswith(q) for w in fold(g.name).split())} - {''}
    family = sorted(
        (g for g in guests
         if g.id not in shown and g.party_id not in parties and surname(g.name) in names),
        key=lambda g: g.name,
    )[:MAX_FAMILY]
    return JsonResponse({
        'results': [_guest_json(g) for g in matches],
        'family': [_guest_json(g) for g in family],
    })


@csrf_exempt  # public form with no logins; the honeypot below handles bots
@require_POST
def create_rsvp(request):
    try:
        data = json.loads(request.body)
    except (json.JSONDecodeError, UnicodeDecodeError):
        return JsonResponse({'error': 'Invalid request.'}, status=400)

    # Bots fill the hidden "website" field; pretend it worked.
    if data.get('website'):
        return JsonResponse({'ok': True}, status=201)

    name = str(data.get('name', '')).strip()[:200]
    attending = data.get('attending')
    email = str(data.get('email', '')).strip()
    message = str(data.get('message', '')).strip()[:2000]

    if not name:
        return JsonResponse({'error': 'Please tell us your name.'}, status=400)
    if attending not in ('yes', 'no'):
        return JsonResponse({'error': 'Please let us know if you can make it.'}, status=400)
    if email:
        try:
            validate_email(email)
        except ValidationError:
            return JsonResponse({'error': 'That email doesn’t look quite right.'}, status=400)

    party = None
    if data.get('guest') is not None:
        try:
            party = Guest.objects.select_related('party').get(pk=int(data['guest'])).party
        except (Guest.DoesNotExist, TypeError, ValueError):
            return JsonResponse({'error': 'We couldn’t find that invitation. Please search for your name again.'}, status=400)

    guests = 0
    if attending == 'yes':
        try:
            guests = min(max(int(data.get('guests', 1)), 1), party.seats if party else MAX_GUESTS)
        except (TypeError, ValueError):
            guests = 1

    Rsvp.objects.create(party=party, name=name, attending=attending == 'yes', guests=guests, email=email, message=message)
    return JsonResponse({'ok': True}, status=201)
