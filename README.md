# shane-and-zessa

Phone-only wedding invitation and RSVP page for Shane & Zessa. React (Vite) for the page; Django for storing replies and serving photos, paintings and music from S3.

## Deploy (Railway)

Deploy with `Dockerfile.django` (set the `RAILWAY_DOCKERFILE_PATH` variable), add `DJANGO_SECRET_KEY` and the S3 settings, and attach a volume so replies survive redeploys. The root `Dockerfile` is the old static-only build: it has no `/media` or `/api`, so images, music and replies won't work there.

## Work on the page

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173/?preview on a laptop. The site is phone-only: laptops get a "use your phone" screen with a QR code and sideways tablets get a "rotate" screen; `?preview` skips that. The dev server forwards `/api` and `/media` to Django on port 8000, so run the backend too or images and replies won't load.

## Run the backend locally

```bash
cd frontend && VITE_BASE=/static/ VITE_RSVP=on npm run build
cd ../backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate && .venv/bin/python manage.py runserver 8000
```

Open http://localhost:8000/?preview. Replies are at http://localhost:8000/admin after `.venv/bin/python manage.py createsuperuser`.

## Edit the details

Everything you'd change lives in `frontend/src/wedding.js`:

- `WEDDING`: date, place, reply-by date, the day's timeline, dress code and colours
- `GUESTS`: the guest list the "Find your name" search uses. `seats` includes the guest; `sponsor: true` asks for their complete name; `aka` adds other names they might type
- `MUSIC_URL`: the Air on the G String recording. It plays on load, or on the guest's first tap where the phone blocks autoplay. Empty hides the music button
- `CONTACT_URL`: where "Message Shane & Zessa" goes

## Replies

The reply flow posts to `POST /api/rsvp/`. Guest names, a sponsor's complete name and the note go in the reply's message. A changed reply is saved as a new entry marked "Updated reply".

## Images and music

All photos, paintings, cut-outs and the music live in a private S3 bucket and are served by Django at `/media/<key>`, which redirects to a short-lived signed link. Front-end code uses `asset('<key>')` from `frontend/src/wedding.js`; never put S3 URLs or credentials in it. The cover cut-out (`generated/cover-cutout.png`) is pixel-aligned to `photos/cover-guitar.jpg` so "Our wedding day" sits between them. The paintings are public-domain works by Corot, Monet and Fantin-Latour.
