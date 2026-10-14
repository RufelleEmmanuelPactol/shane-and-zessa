import csv
import io
import json

from django.contrib.auth.models import User
from django.test import TestCase

from .importer import GuestListError, import_guests, title_name
from .models import Guest, Party, Rsvp

CSV = """party,side,seats,name,role,searchable,check
B001,bride,3,Maria A Santos,Mother of the Bride,yes,
B001,bride,3,Jose C Santos,Father of the Bride,yes,
B002,bride,2,Lita Reyes,,yes,
B002,bride,2,Husband ni Lita,,no,
G001,groom,2,Pedro Dela Cruz,Principal Sponsor,yes,
G002,groom,1,Zoë Ñiño,,yes,
"""


class ImportTests(TestCase):
    def test_creates_parties_and_guests(self):
        result = import_guests(CSV)
        self.assertEqual(result, {'parties': 4, 'new_parties': 4, 'guests': 6})
        self.assertEqual(Party.objects.get(code='B001').seats, 3)
        self.assertTrue(Guest.objects.get(name='Pedro Dela Cruz').sponsor)
        self.assertFalse(Guest.objects.get(name='Husband ni Lita').searchable)

    def test_reimport_replaces_names_and_keeps_replies(self):
        import_guests(CSV)
        party = Party.objects.get(code='B002')
        Rsvp.objects.create(party=party, name='Lita Reyes', attending=True, guests=2)
        import_guests('party,side,seats,name\nB002,bride,3,Lita C Reyes\n')
        party.refresh_from_db()
        self.assertEqual(party.seats, 3)
        self.assertEqual([g.name for g in party.guests.all()], ['Lita C Reyes'])
        self.assertEqual(party.rsvps.count(), 1)
        self.assertTrue(Party.objects.filter(code='B001').exists())

    def test_title_cases_names(self):
        import_guests('party,side,seats,name\nB003,bride,1,FSUPT RICHARD TIMOSA\nB004,bride,1,nornalyn pactol\n')
        self.assertEqual(sorted(Guest.objects.values_list('name', flat=True)), ['FSUPT Richard Timosa', 'Nornalyn Pactol'])
        self.assertEqual(title_name('CECILLE D CARINO-ANGELES'), 'Cecille D Carino-Angeles')
        self.assertEqual(title_name('Michelle T Bulat-ag'), 'Michelle T Bulat-ag')
        self.assertEqual(title_name('Ma.Rhiza Monteclaro'), 'Ma.Rhiza Monteclaro')
        self.assertEqual(title_name('Husband ni Lita'), 'Husband ni Lita')
        self.assertEqual(title_name('JUAN CRUZ II, J.D., RN'), 'Juan Cruz II, J.D., RN')

    def test_rejects_bad_rows_without_saving(self):
        with self.assertRaises(GuestListError):
            import_guests('party,side,seats,name\nB001,bride,1,A\nB002,aunt,1,B\n')
        self.assertFalse(Party.objects.exists())


class SearchTests(TestCase):
    def setUp(self):
        import_guests(CSV)

    def search(self, q):
        return self.client.get('/api/guests/', {'q': q}).json()['results']

    def test_needs_two_letters(self):
        self.assertEqual(self.search('c'), [])

    def test_matches_part_of_name_with_party_seats(self):
        results = self.search('santo')
        self.assertEqual([r['name'] for r in results], ['Jose C Santos', 'Maria A Santos'])
        self.assertEqual(results[0]['seats'], 3)

    def test_ignores_accents_and_hides_placeholders(self):
        self.assertEqual([r['name'] for r in self.search('nino')], ['Zoë Ñiño'])
        self.assertEqual([r['name'] for r in self.search('lita')], ['Lita Reyes'])

    def test_names_starting_with_query_come_first(self):
        Guest.objects.filter(name='Lita Reyes').update(aka='Bena')
        import_guests('party,side,seats,name\nB009,bride,1,Ben Cruz\n')
        self.assertEqual([r['name'] for r in self.search('ben')][0], 'Ben Cruz')

    def test_shows_family_on_other_invitations(self):
        import_guests(
            'party,side,seats,name\n'
            'M001,bride,1,Ahriz Monteclaro\n'
            'M002,bride,2,Lorna Monteclaro\n'
            'M002,bride,2,Rey Monteclaro\n'
            'M003,groom,1,Ana Montero\n'
        )
        data = self.client.get('/api/guests/', {'q': 'ahr'}).json()
        self.assertEqual([r['name'] for r in data['results']], ['Ahriz Monteclaro'])
        self.assertEqual([r['name'] for r in data['family']], ['Lorna Monteclaro', 'Rey Monteclaro'])


class RsvpTests(TestCase):
    def setUp(self):
        import_guests(CSV)
        self.maria = Guest.objects.get(name='Maria A Santos')

    def post(self, **data):
        return self.client.post('/api/rsvp/', json.dumps(data), content_type='application/json')

    def test_links_reply_to_party_and_caps_at_its_seats(self):
        self.assertEqual(self.post(name='Maria', attending='yes', guests=9, guest=self.maria.id).status_code, 201)
        rsvp = Rsvp.objects.get()
        self.assertEqual((rsvp.party.code, rsvp.guests), ('B001', 3))

    def test_unknown_guest_is_rejected(self):
        self.assertEqual(self.post(name='X', attending='yes', guest=99999).status_code, 400)
        self.assertFalse(Rsvp.objects.exists())

    def test_reply_without_guest_still_works(self):
        self.assertEqual(self.post(name='Walk-in', attending='no').status_code, 201)
        self.assertIsNone(Rsvp.objects.get().party)


class DashboardTests(TestCase):
    def setUp(self):
        import_guests(CSV)
        self.admin = User.objects.create_superuser('couple', password='x')
        party = Party.objects.get(code='B001')
        Rsvp.objects.create(party=party, name='Maria', attending=False, guests=0)
        Rsvp.objects.create(party=party, name='Maria', attending=True, guests=2, message='Updated reply')

    def test_open_without_login(self):
        self.assertEqual(self.client.get('/dashboard/').status_code, 200)
        self.assertEqual(self.client.get('/dashboard/guest-list.csv').status_code, 200)

    def test_totals_use_latest_reply_once_per_party(self):
        self.client.force_login(self.admin)
        total = self.client.get('/dashboard/').context['total']
        self.assertEqual((total['seats'], total['coming'], total['replied'], total['waiting']), (8, 2, 1, 5))

    def test_export_round_trips_through_import(self):
        self.client.force_login(self.admin)
        text = self.client.get('/dashboard/guest-list.csv').content.decode('utf-8-sig')
        rows = list(csv.DictReader(io.StringIO(text)))
        maria = next(r for r in rows if r['name'] == 'Maria A Santos')
        self.assertEqual((maria['status'], maria['coming'], maria['reply']), ('Coming', '2', 'Updated reply'))
        self.assertEqual(next(r for r in rows if r['name'] == 'Lita Reyes')['status'], 'No reply')
        self.assertEqual(import_guests(text)['guests'], 6)
