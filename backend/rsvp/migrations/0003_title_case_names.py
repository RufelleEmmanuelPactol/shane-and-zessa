from django.db import migrations

from rsvp.importer import title_name


def title_case(apps, schema_editor):
    Guest = apps.get_model('rsvp', 'Guest')
    for guest in Guest.objects.all():
        name = title_name(guest.name)
        if name != guest.name:
            guest.name = name
            guest.save(update_fields=['name'])


class Migration(migrations.Migration):

    dependencies = [
        ('rsvp', '0002_guest_list'),
    ]

    operations = [
        migrations.RunPython(title_case, migrations.RunPython.noop),
    ]
