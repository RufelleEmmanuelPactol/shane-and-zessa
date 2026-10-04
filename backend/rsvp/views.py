import json

from django.core.exceptions import ValidationError
from django.core.validators import validate_email
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from django.views.decorators.http import require_POST

from .models import Rsvp

MAX_GUESTS = 4


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

    guests = 0
    if attending == 'yes':
        try:
            guests = min(max(int(data.get('guests', 1)), 1), MAX_GUESTS)
        except (TypeError, ValueError):
            guests = 1

    Rsvp.objects.create(name=name, attending=attending == 'yes', guests=guests, email=email, message=message)
    return JsonResponse({'ok': True}, status=201)
