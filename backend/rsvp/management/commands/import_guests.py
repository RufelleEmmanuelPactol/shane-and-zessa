import sys
from pathlib import Path

from django.core.management.base import BaseCommand, CommandError

from rsvp.importer import GuestListError, import_guests


class Command(BaseCommand):
    help = 'Load the guest list from a CSV (party, side, seats, name, role, searchable).'

    def add_arguments(self, parser):
        parser.add_argument('csv', help='Path to the CSV, or - to read stdin.')

    def handle(self, *args, **options):

        text = sys.stdin.read() if options['csv'] == '-' else Path(options['csv']).read_text(encoding='utf-8')
        try:
            result = import_guests(text)
        except GuestListError as e:
            raise CommandError(str(e)) from e
        self.stdout.write(self.style.SUCCESS(
            f"Imported {result['guests']} guests in {result['parties']} parties ({result['new_parties']} new)."
        ))
