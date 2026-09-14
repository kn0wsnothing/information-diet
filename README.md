# Information Diet

Private, loopback-only daily reading, watching, and listening page. It is a small FastAPI application with SQLite state in `var/`, which is intentionally ignored by Git.

## First version

- A prepared HKT daily list persists through reloads and restarts.
- Feedback is independent from generation. It never replaces other same-day picks.
- An unfinished lunch video carries forward. `Didn't start` defers it once without rejecting it. Completion does not fill the slot again that day.
- The short read is optional. It can be omitted when feedback leaves no suitable inspected candidate.
- Nonfiction targets are saved when a day is prepared. They use reported pages and no catch-up debt.
- Fiction is displayed as optional and untracked.
- Each candidate requires an inspected content summary, rationale, direct link, inspection method/date, and provenance. Podcast links require explicit verification.
- If source input fails, the page serves the last usable dated list and reports the failure.

## Private runtime setup

Create a virtual environment and install dependencies:

```bash
python3 -m venv .venv
.venv/bin/pip install -r requirements.txt
```

Create `var/runtime.env`, `var/source-manifest.json`, and `var/catalog.json` locally. Do not commit any of them. The manifest adds an `inspection` object to each candidate with a private local `source_path`, `minimum_words`, and `evidence_terms`. Refresh verifies that source text and each direct URL before atomically writing the catalog. The resulting `catalog.json` has this shape:

```json
{"book":{"nonfiction_title":"…","reported_page":0,"daily_pace":7,"fiction_title":"…"},"candidates":[{"id":"…","kind":"video","title":"…","summary":"content-based summary","why":"why it matters","url":"https://www.youtube.com/watch?v=…","source_url":"https://www.youtube.com/watch?v=…","reader_url":"https://read.readwise.io/read/…","snipd_url":"https://share.snipd.com/show/…","snipd_direct":false,"duration_minutes":60,"inspection_method":"full transcript","inspected_at":"2026-09-14T00:00:00Z","provenance":"private source note"}]}
```

Use the canonical reading records to create the private catalog. Only use sources whose content has been inspected. The application does not store the source text, credentials, or personal inventory in Git.

Video `url` and `source_url` are the native YouTube watch destination. `reader_url` is optional private provenance. The page does not call Readwise. A video has a standalone notes-and-ideas field that saves without changing the recommendation or feedback. A verified Snipd URL may be supplied: use `snipd_direct: true` only for an exact episode link. A verified show page uses `false` and is labelled “Find this episode in Snipd”.

Prepare a list explicitly:

```bash
.venv/bin/python -m scripts.prepare_daily --db var/information-diet.sqlite3 --catalog var/catalog.json --manifest var/source-manifest.json
```

Run locally on the VPS loopback interface:

```bash
INFORMATION_DIET_DB=$PWD/var/information-diet.sqlite3 INFORMATION_DIET_CATALOG=$PWD/var/catalog.json .venv/bin/uvicorn app.main:app --host 127.0.0.1 --port 8412
```

`/healthz` reports database availability. `/status` reports HKT list and catalog state. Install the user service and daily preparation timer with `deploy/install-user-service.sh`. The timer starts preparation every day at 05:55 Asia/Hong_Kong so the list is ready by 06:00. It runs a missed preparation after the user service manager returns:

```bash
systemctl --user enable --now information-diet-prepare.timer
```

## Checks

```bash
python -m unittest discover -s tests -v
```

The tests use only synthetic fixtures. Roll back the deployed code by checking out the prior Git reference, then run `systemctl --user restart information-diet.service`. Runtime SQLite state remains untouched unless an operator explicitly replaces it.
