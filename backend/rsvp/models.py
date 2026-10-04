from django.db import models


class Rsvp(models.Model):
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
