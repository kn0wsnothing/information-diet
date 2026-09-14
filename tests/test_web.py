import tempfile
import unittest
from pathlib import Path

from fastapi import HTTPException

import app.main as web
from app.store import Store

BOOK = {
    "nonfiction_title": "Synthetic nonfiction",
    "reported_page": 10,
    "daily_pace": 3,
    "fiction_title": "Synthetic fiction",
}
CANDIDATE = {
    "kind": "video",
    "summary": "Inspected content summary.",
    "why": "A useful reason.",
    "url": "https://www.youtube.com/watch?v=fixture",
    "reader_url": "https://read.readwise.io/read/video-fixture",
    "source_url": "https://www.youtube.com/watch?v=fixture",
    "duration_minutes": 20,
    "inspection_method": "synthetic transcript",
    "inspected_at": "2026-09-14T00:00:00+08:00",
    "provenance": "synthetic fixture",
}
CATALOG = {
    "book": BOOK,
    "candidates": [
        {**CANDIDATE, "id": "video-1", "title": "First video"},
        {
            **CANDIDATE,
            "id": "video-2",
            "title": "Second video",
            "url": "https://www.youtube.com/watch?v=fixture-2",
            "reader_url": "https://read.readwise.io/read/video-fixture-2",
            "source_url": "https://www.youtube.com/watch?v=fixture-2",
        },
    ],
}


class WebTests(unittest.TestCase):
    def setUp(self):
        self.directory = tempfile.TemporaryDirectory()
        self.old_db = web.DB_PATH
        self.old_csrf = web.CSRF_TOKEN
        self.old_hkt_date = web.hkt_date
        web.DB_PATH = str(Path(self.directory.name) / "state.sqlite3")
        web.CSRF_TOKEN = "test-token"
        web.hkt_date = lambda: "2026-09-14"
        self.store = Store(web.DB_PATH)
        self.store.setup()
        self.store.seed_books(BOOK)
        self.store.generate("2026-09-14", CATALOG, "now")

    def tearDown(self):
        web.DB_PATH = self.old_db
        web.CSRF_TOKEN = self.old_csrf
        web.hkt_date = self.old_hkt_date
        self.directory.cleanup()

    def test_stale_form_is_rejected_before_mutation(self):
        template = (Path(web.ROOT) / "templates" / "home.html").read_text()
        self.assertIn('name="candidate_id" value="{{ pick.candidate_id }}"', template)

        self.store.feedback(1, "not_started", now="one", expected_candidate_id="video-1")
        self.store.generate("2026-09-14", CATALOG, "two", refresh=True)
        with self.assertRaises(HTTPException) as raised:
            web.submit_feedback(
                pick_id=1,
                disposition="completed",
                reason="",
                video_timestamp="",
                book_page="",
                candidate_id="video-1",
                csrf_token="test-token",
            )

        self.assertEqual(raised.exception.status_code, 400)
        pick = self.store.get_list("2026-09-14")["picks"][0]
        self.assertEqual(pick["candidate_id"], "video-2")
        self.assertEqual(pick["state"], "active")

    def test_video_template_has_youtube_note_and_snipd_states(self):
        template = web.templates.get_template("home.html")
        base_pick = {
            **CANDIDATE,
            "id": 1,
            "candidate_id": "video-1",
            "slot": "lunch",
            "title": "Video",
            "state": "active",
        }
        context = {
            "daily": {"date": "2026-09-14", "book_target": 13, "picks": [base_pick]},
            "failed_today": None,
            "book": BOOK,
            "today": "2026-09-14",
            "csrf": "test-token",
            "note_saved_pick_id": 1,
        }

        base_pick["snipd_url"] = "https://share.snipd.com/show/synthetic"
        base_pick["snipd_direct"] = False
        base_pick["podcast_url"] = "https://podcasts.example.test/episode"
        base_pick["podcast_verified"] = True
        base_pick["note_history"] = [{"note": "Earlier idea", "created_at": "2026-09-14T10:00:00+08:00"}]
        rendered = template.render(**context)
        self.assertIn(f'href="{CANDIDATE["source_url"]}"', rendered)
        self.assertIn("Watch on YouTube", rendered)
        self.assertIn("Started / keep this", rendered)
        self.assertIn("Video notes or ideas", rendered)
        self.assertIn("Find this episode in Snipd", rendered)
        self.assertIn("Verified podcast listing", rendered)
        self.assertIn('role="status">Note saved.</span>', rendered)
        self.assertIn("Earlier idea", rendered)
        self.assertIn("Saved notes", rendered)
        self.assertIn('datetime="2026-09-14T10:00:00+08:00">2026-09-14 10:00</time>', rendered)
        self.assertIn('textarea name="note" rows="3" required></textarea>', rendered)
        self.assertNotIn('textarea name="note" rows="3">Earlier idea', rendered)
        self.assertEqual(rendered.count('target="_blank" rel="noopener noreferrer"'), 3)
        direct = {**base_pick, "snipd_direct": True}
        direct_html = template.render(**{**context, "daily": {**context["daily"], "picks": [direct]}})
        self.assertIn("Listen in Snipd", direct_html)

    def test_video_note_save_redirects_to_visible_confirmation(self):
        response = web.save_video_note(
            pick_id=1,
            note="A saved idea",
            candidate_id="video-1",
            csrf_token="test-token",
        )
        self.assertEqual(response.status_code, 303)
        self.assertEqual(response.headers["location"], "/?note_saved=1#video-note-1")
        self.assertEqual(self.store.get_list("2026-09-14")["picks"][0]["note_history"][0]["note"], "A saved idea")
