# shane-and-zessa

Phone-only wedding invitation and RSVP page for Shane & Zessa. React (Vite) for the page; Django for storing replies and serving photos, paintings and music from S3.

## Deploy (Railway)

Deploy with `Dockerfile.django` (set the `RAILWAY_DOCKERFILE_PATH` variable), add `DJANGO_SECRET_KEY` and the S3 settings, and set `DATABASE_URL=${{Postgres.DATABASE_URL}}` so guests and replies live in the project's Postgres database (without it Django falls back to a SQLite file inside the container, which every deploy wipes). The root `Dockerfile` is the old static-only build: it has no `/media` or `/api`, so images, music and replies won't work there.

Photos, paintings and music live in a private S3 bucket under `shaneandzessa/` and are only served by the Django build: `/media/<key>` redirects to a signed link for `shaneandzessa/<key>` (e.g. `/media/audio/air-on-the-g-string.mp3`). Set `AWS_S3_ENDPOINT_URL`, `AWS_STORAGE_BUCKET_NAME`, `AWS_S3_REGION_NAME`, `AWS_ACCESS_KEY_ID` and `AWS_SECRET_ACCESS_KEY` on Railway (and `ASSET_PREFIX` to use a different folder). Without them `/media/` returns 404.

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
- `MUSIC_URL`: "Kay Tagal Kitang Hinintay" (Spongecola, harmonica band cover), trimmed so it starts on the first note. It plays on load, or on the guest's first tap where the phone blocks autoplay. Empty hides the music button
- `CONTACT_URL`: where "Message Shane & Zessa" goes

## Guest list

The guest list is **not** in the repo (it's public). It lives in the backend database, and the "Find your name" step searches it through `GET /api/guests/?q=`, which returns only the names that match what the guest typed.

It's loaded from a CSV with columns `party, side, seats, name, role, searchable`. Each `party` is one invitation (a household sharing `seats`, which includes the guests themselves). Anyone whose `role` is "Principal Sponsor" is asked for their complete name. `searchable` = `no` hides placeholders like "Bryan Wife". Keep the CSV in `private/`, which is gitignored.

- Locally: `.venv/bin/python manage.py import_guests ../private/guests.csv`
- On Railway: Admin → Parties → **Import guest list**, and upload the CSV
- To try the reply flow, load the test list: `.venv/bin/python manage.py import_guests rsvp/fixtures/test_guests.csv`, then type "test". It covers one seat (Ana), two (Ben), a family of four (Cora), a principal sponsor (Dante), a hidden plus-one (Ella) and an accent (José). Their parties are `TEST01`–`TEST06`; delete them in Admin → Parties before sending invitations.

The couple's dashboard is at `/dashboard/` and is open to anyone with the link. It shows every invitation with its reply, totals for each side, search and filters, and an **Export CSV** button. The export uses the same columns the import reads, plus `status`, `coming`, `replied_at` and `reply`, so it can be edited and uploaded again; the import ignores the status columns.

Re-importing updates each party in the file and replaces its names. Parties not in the file are left alone, and replies are never deleted. Small fixes (a spelling, a nickname in `aka`) are easiest in Admin → Parties.

## Replies

The reply flow posts to `POST /api/rsvp/` with the guest's id, so each reply is linked to its party and capped at that party's seats. Admin → Parties shows each party's latest reply, and the filter lists parties that haven't replied yet. Guest names, a sponsor's complete name and the note go in the reply's message. A changed reply is saved as a new entry marked "Updated reply".

## Images and music

All photos, paintings, cut-outs and the music live in a private S3 bucket and are served by Django at `/media/<key>`, which redirects to a short-lived signed link. Front-end code uses `asset('<key>')` from `frontend/src/wedding.js`; never put S3 URLs or credentials in it. The cover cut-out (`generated/cover-cutout.png`) is pixel-aligned to `photos/cover-guitar.jpg` so "Our wedding day" sits between them. The paintings are public-domain works by Corot, Monet, Fantin-Latour and Hassam. The three small dress code drawings are bundled with the page instead (`frontend/src/assets/`).
