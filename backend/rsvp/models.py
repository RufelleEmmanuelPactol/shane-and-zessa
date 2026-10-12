from django.db import models


class Party(models.Model):
    """One invitation: a household or group sharing a block of reserved seats."""

    SIDES = [('bride', 'Bride'), ('groom', 'Groom')]

    code = models.CharField(max_length=20, unique=True, help_text='From the guest list, e.g. B012 or G004.')
    side = models.CharField(max_length=5, choices=SIDES)
    seats = models.PositiveSmallIntegerField(default=1, help_text='Reserved seats, including the guests themselves.')
    notes = models.TextField(blank=True)

    class Meta:
        ordering = ['code']
        verbose_name_plural = 'parties'

    def __str__(self):
        names = [g.name for g in self.guests.all()[:3]]
        return f"{self.code}: {', '.join(names) or '(empty)'}"


class Guest(models.Model):
    party = models.ForeignKey(Party, on_delete=models.CASCADE, related_name='guests')
    name = models.CharField(max_length=200)
    role = models.CharField(max_length=60, blank=True)
    sponsor = models.BooleanField(default=False, help_text='Asked for their complete name, for the programme.')
    searchable = models.BooleanField(default=True, help_text='Off for placeholders like "Bryan Wife".')
    aka = models.CharField(max_length=200, blank=True, help_text='Other names they might type, comma-separated.')

    class Meta:
        ordering = ['party__code', 'id']

    def __str__(self):
        return self.name


class Rsvp(models.Model):
    party = models.ForeignKey(Party, on_delete=models.SET_NULL, null=True, blank=True, related_name='rsvps')
    name = models.CharField(max_length=200)
    attending = models.BooleanField()
    guests = models.PositiveSmallIntegerField(default=0)
    email = models.EmailField(blank=True)
    message = models.TextField(blank=True)
    created_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ['-created_at']
        verbose_name = 'RSVP'

    def __str__(self):
        return f"{self.name} ({'yes' if self.attending else 'no'})"
