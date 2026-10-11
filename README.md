# shane-and-zessa

Phone-only wedding invitation and RSVP page for Shane & Zessa. React (Vite) for the page; Django for storing replies (not deployed yet).

## Deploy (Railway)

The root `Dockerfile` builds the page and serves it as a static site with Caddy on `$PORT` (8080 if unset). The RSVP section shows "Replies open soon" until the backend is switched on.

To deploy with RSVPs later, point Railway at `Dockerfile.django` (set the `RAILWAY_DOCKERFILE_PATH` variable), add `DJANGO_SECRET_KEY`, and attach a volume so replies survive redeploys.

Photos, paintings and music live in a private S3 bucket under `shaneandzessa/` and are only served by the Django build: `/media/<key>` redirects to a signed link for `shaneandzessa/<key>` (e.g. `/media/audio/air-on-the-g-string.mp3`). Set `AWS_S3_ENDPOINT_URL`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` on Railway (and `ASSET_PREFIX` to use a different folder). Without them `/media/` returns 404.

## Work on the page

```bash
cd frontend && npm install && npm run dev
```

Open http://localhost:5173/?preview on a laptop. The site is phone-only: laptops get a "use your phone" screen with a QR code and sideways tablets get a "rotate" screen; `?preview` skips that. The dev server shows the RSVP form and forwards `/api` to Django on port 8000 if it is running.

## Run the backend locally

```bash
cd frontend && VITE_BASE=/static/ VITE_RSVP=on npm run build
cd ../backend && python3 -m venv .venv && .venv/bin/pip install -r requirements.txt
.venv/bin/python manage.py migrate && .venv/bin/python manage.py runserver 8000
```

Open http://localhost:8000/?preview. Replies are at http://localhost:8000/admin after `.venv/bin/python manage.py createsuperuser`.

## Edit the details

Date, place, reply-by date, the day's timeline and the dress-code colours are in the `WEDDING` object at the top of `frontend/src/App.jsx`.

## Images

`frontend/public/images/`. The guitar cutout was made with macOS subject lifting and hand-repaired around the head. The paper textures, deckled card and wax seal were rendered procedurally.
