import json
import os
import secrets
from datetime import datetime
from pathlib import Path

from fastapi import FastAPI, Form, HTTPException
from fastapi.requests import Request
from fastapi.responses import HTMLResponse, JSONResponse, RedirectResponse
from fastapi.staticfiles import StaticFiles
from fastapi.templating import Jinja2Templates

from .service import load_private_seed
from .store import Store
from .time import HKT, hkt_date

ROOT = Path(__file__).resolve().parent
DB_PATH = os.environ.get("INFORMATION_DIET_DB", str(ROOT.parent / "var" / "information-diet.sqlite3"))
CATALOG_PATH = os.environ.get("INFORMATION_DIET_CATALOG", str(ROOT.parent / "var" / "catalog.json"))
CSRF_TOKEN = os.environ.get("INFORMATION_DIET_CSRF_TOKEN", secrets.token_urlsafe(32))
app = FastAPI(title="Information Diet", docs_url=None, redoc_url=None)
templates = Jinja2Templates(directory=str(ROOT / "templates"))
app.mount("/static", StaticFiles(directory=str(ROOT / "static")), name="static")


def store():
    result = Store(DB_PATH)
    result.setup()
    return result


@app.get("/healthz")
def healthz():
    try:
        Store(DB_PATH).setup()
        return {"ok": True, "database": "available"}
    except Exception as error:
        return JSONResponse({"ok": False, "database": "unavailable", "detail": str(error)}, status_code=503)


@app.get("/status")
def status():
    today = store().get_list(hkt_date())
    latest = store().latest_list()
    return {
        "timezone": "Asia/Hong_Kong",
        "today": today and today["date"],
        "latest_usable": latest and latest["date"],
        "catalog_configured": Path(CATALOG_PATH).exists(),
    }


@app.get("/", response_class=HTMLResponse)
def home(request: Request):
    current = store().get_list(hkt_date())
    fallback = None if current and current["status"] == "ready" else store().latest_list()
    return templates.TemplateResponse(
        request,
        "home.html",
        {
            "daily": current if current and current["status"] == "ready" else fallback,
            "failed_today": current if current and current["source_status"] == "failed" else None,
            "book": store().book(),
            "today": hkt_date(),
            "csrf": CSRF_TOKEN,
        },
    )


def csrf(token: str):
    if not secrets.compare_digest(token, CSRF_TOKEN):
        raise HTTPException(403, "Invalid form token")


@app.post("/feedback/{pick_id}")
def submit_feedback(
    pick_id: int,
    disposition: str = Form(...),
    reason: str = Form(""),
    video_timestamp: str = Form(""),
    book_page: str = Form(""),
    candidate_id: str = Form(...),
    csrf_token: str = Form(...),
):
    csrf(csrf_token)
    try:
        store().feedback(
            pick_id,
            disposition,
            reason,
            video_timestamp,
            int(book_page) if book_page else None,
            datetime.now(HKT).isoformat(),
            candidate_id,
        )
    except (KeyError, ValueError) as error:
        raise HTTPException(400, str(error))
    return RedirectResponse("/", status_code=303)


@app.post("/video-note/{pick_id}")
def save_video_note(
    pick_id: int,
    note: str = Form(...),
    candidate_id: str = Form(...),
    csrf_token: str = Form(...),
):
    csrf(csrf_token)
    try:
        store().save_video_note(pick_id, candidate_id, note, datetime.now(HKT).isoformat())
    except (KeyError, ValueError) as error:
        raise HTTPException(400, str(error))
    return RedirectResponse("/", status_code=303)


@app.post("/book-position")
def book_position(book_page: int = Form(...), csrf_token: str = Form(...)):
    csrf(csrf_token)
    try:
        store().report_book_page(book_page)
    except (RuntimeError, ValueError) as error:
        raise HTTPException(400, str(error))
    return RedirectResponse("/", status_code=303)


@app.post("/prepare")
def update_recommendations(csrf_token: str = Form(...)):
    csrf(csrf_token)
    try:
        seed = load_private_seed(CATALOG_PATH)
        target = store()
        target.seed_books(seed["book"])
        target.generate(hkt_date(), seed, datetime.now(HKT).isoformat(), refresh=True)
    except (OSError, ValueError, KeyError, TypeError, json.JSONDecodeError) as error:
        store().record_source_failure(hkt_date(), datetime.now(HKT).isoformat(), f"source load failed: {error}")
        return RedirectResponse("/", status_code=303)
    return RedirectResponse("/", status_code=303)
