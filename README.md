# shaneandzessa.com

One-page RSVP site. React (Vite) for the page, Django for storing replies.

## Run it locally

```bash
cd backend && .venv/bin/python manage.py runserver 8000
```

Open http://localhost:8000/?preview on a laptop. The site is phone-only: laptops get a "use your phone" screen with a QR code and sideways tablets get a "rotate" screen, and `?preview` skips that. Django serves the built page from `frontend/dist`.

While editing the design, run the Vite dev server too (it hot-reloads and forwards `/api` to Django):

```bash
cd frontend && npm run dev
```

After design changes, rebuild with `cd frontend && npm run build`.

## See the replies

Create a login once, then visit http://localhost:8000/admin:

```bash
cd backend && .venv/bin/python manage.py createsuperuser
```

## Edit the details

Date, place, reply-by date, and the ceremony/reception/attire cards are in the `WEDDING` object at the top of `frontend/src/App.jsx`.

## Photos

`frontend/public/images/`. The two couple cutouts were made from the original photos with macOS's subject-lifting (Vision).
# shane-and-zessa
