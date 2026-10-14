"""Load the guest list from a CSV with columns: party, side, seats, name, role, searchable.

Each party in the file is created or updated and its guests replaced; parties
not in the file are left alone, so RSVPs never lose their party.
"""
import csv
import io
import re

from django.db import transaction

from .models import Guest, Party

SPONSOR_ROLES = {'principal sponsor'}
# Ranks, degrees and suffixes that stay in capitals.
CAPITALS = {'FSINSP', 'FCINSP', 'FSUPT', 'SFO1', 'RN', 'J.D.', 'II', 'III', 'IV'}
# Particles left lowercase when typed that way ("Husband ni Lita", "de la Cruz").
PARTICLES = {'ni', 'de', 'del', 'la', 'y'}


def title_name(name):
    """Title-case words typed in all capitals or all lowercase ("FSUPT RICHARD
    TIMOSA", "pactol"); mixed-case words like "Bulay-og" or "Ma.Rhiza" are kept."""
    def fix(word):
        core = word.strip(',')
        if core.upper() in CAPITALS:
            return word.upper()
        if core in PARTICLES:
            return word
        if core.isupper() or core.islower():
            return re.sub(r'[^\W\d_]+', lambda m: m[0].capitalize(), word)
        return word
    return ' '.join(fix(w) for w in name.split())


class GuestListError(ValueError):
    pass


def _rows(text):
    reader = csv.DictReader(io.StringIO(text.lstrip('\ufeff')))
    missing = {'party', 'side', 'seats', 'name'} - set(reader.fieldnames or [])
    if missing:
        raise GuestListError(f"Missing column(s): {', '.join(sorted(missing))}")
    for line, row in enumerate(reader, start=2):
        row = {k: (v or '').strip() for k, v in row.items() if k}
        if not row['name']:
            continue
        if row['side'] not in dict(Party.SIDES):
            raise GuestListError(f'Line {line}: side must be "bride" or "groom", not "{row["side"]}"')
        try:
            row['seats'] = int(float(row['seats']))
        except ValueError:
            raise GuestListError(f'Line {line}: seats must be a number') from None
        yield row


@transaction.atomic
def import_guests(text):
    parties = {}
    for row in _rows(text):
        parties.setdefault(row['party'], []).append(row)

    created = guests = 0
    for code, rows in parties.items():
        party, new = Party.objects.update_or_create(
            code=code, defaults={'side': rows[0]['side'], 'seats': max(r['seats'] for r in rows)},
        )
        created += new
        party.guests.all().delete()
        Guest.objects.bulk_create(
            Guest(
                party=party,
                name=title_name(r['name']),
                role=r.get('role', ''),
                sponsor=r.get('role', '').lower() in SPONSOR_ROLES,
                searchable=r.get('searchable', 'yes').lower() not in ('no', 'false', '0'),
            )
            for r in rows
        )
        guests += len(rows)
    return {'parties': len(parties), 'new_parties': created, 'guests': guests}
