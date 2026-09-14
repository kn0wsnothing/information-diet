import sqlite3
from contextlib import contextmanager
from pathlib import Path

SCHEMA = """
PRAGMA foreign_keys = ON;
CREATE TABLE IF NOT EXISTS daily_lists (
  date TEXT PRIMARY KEY, created_at TEXT NOT NULL, status TEXT NOT NULL DEFAULT 'ready', source_status TEXT NOT NULL DEFAULT 'ok', source_message TEXT, book_target INTEGER
);
CREATE TABLE IF NOT EXISTS picks (
  id INTEGER PRIMARY KEY, list_date TEXT NOT NULL REFERENCES daily_lists(date), slot TEXT NOT NULL,
  candidate_id TEXT, title TEXT NOT NULL, kind TEXT NOT NULL, summary TEXT, why TEXT, url TEXT,
  duration_minutes INTEGER, podcast_url TEXT, podcast_verified INTEGER NOT NULL DEFAULT 0, snipd_url TEXT, snipd_direct INTEGER NOT NULL DEFAULT 0,
  stopping_point TEXT, provenance TEXT, inspection_method TEXT, inspected_at TEXT,
  state TEXT NOT NULL DEFAULT 'active', last_video_timestamp TEXT, UNIQUE(list_date, slot)
);
CREATE TABLE IF NOT EXISTS feedback (
  id INTEGER PRIMARY KEY, pick_id INTEGER NOT NULL REFERENCES picks(id), disposition TEXT NOT NULL,
  candidate_id TEXT, reason TEXT, video_timestamp TEXT, book_page INTEGER, created_at TEXT NOT NULL
);
CREATE TABLE IF NOT EXISTS books (
  id INTEGER PRIMARY KEY CHECK(id=1), nonfiction_title TEXT NOT NULL, author TEXT, total_pages INTEGER,
  reported_page INTEGER NOT NULL, daily_pace INTEGER NOT NULL, fiction_title TEXT
);
CREATE TABLE IF NOT EXISTS video_notes (
  id INTEGER PRIMARY KEY, pick_id INTEGER NOT NULL REFERENCES picks(id), candidate_id TEXT NOT NULL,
  note TEXT NOT NULL, created_at TEXT NOT NULL
);
"""


class Store:
    def __init__(self, path: str | Path):
        self.path = str(path)

    @contextmanager
    def tx(self):
        conn = sqlite3.connect(self.path, timeout=20, isolation_level=None)
        conn.row_factory = sqlite3.Row
        conn.execute("PRAGMA journal_mode=WAL")
        conn.execute("PRAGMA foreign_keys=ON")
        conn.execute("BEGIN IMMEDIATE")
        try:
            yield conn
            conn.commit()
        except Exception:
            conn.rollback()
            raise
        finally:
            conn.close()

    def setup(self):
        Path(self.path).parent.mkdir(parents=True, exist_ok=True)
        with sqlite3.connect(self.path) as conn:
            conn.executescript(SCHEMA)
            columns = {r[1] for r in conn.execute("PRAGMA table_info(daily_lists)")}
            if "book_target" not in columns:
                conn.execute("ALTER TABLE daily_lists ADD COLUMN book_target INTEGER")
            pick_columns = {r[1] for r in conn.execute("PRAGMA table_info(picks)")}
            if "last_video_timestamp" not in pick_columns:
                conn.execute("ALTER TABLE picks ADD COLUMN last_video_timestamp TEXT")
            if "snipd_url" not in pick_columns:
                conn.execute("ALTER TABLE picks ADD COLUMN snipd_url TEXT")
            if "snipd_direct" not in pick_columns:
                conn.execute("ALTER TABLE picks ADD COLUMN snipd_direct INTEGER NOT NULL DEFAULT 0")
            feedback_columns = {r[1] for r in conn.execute("PRAGMA table_info(feedback)")}
            if "candidate_id" not in feedback_columns:
                conn.execute("ALTER TABLE feedback ADD COLUMN candidate_id TEXT")
                conn.execute(
                    "UPDATE feedback SET candidate_id=(SELECT candidate_id FROM picks WHERE picks.id=feedback.pick_id)"
                )
            conn.execute("PRAGMA journal_mode=WAL")

    def seed_books(self, book: dict):
        reported, pace, total = (
            int(book.get("reported_page", 0)),
            int(book.get("daily_pace", 7)),
            book.get("total_pages"),
        )
        total = int(total) if total is not None else None
        if reported < 0 or pace < 0 or (total is not None and (total < 0 or reported > total)):
            raise ValueError("invalid nonfiction page state")
        with self.tx() as c:
            c.execute(
                "INSERT OR IGNORE INTO books VALUES (1,?,?,?,?,?,?)",
                (book["nonfiction_title"], book.get("author"), total, reported, pace, book.get("fiction_title")),
            )

    def book(self):
        with sqlite3.connect(self.path) as c:
            c.row_factory = sqlite3.Row
            row = c.execute("SELECT * FROM books WHERE id=1").fetchone()
            return dict(row) if row else None

    def get_list(self, day):
        with sqlite3.connect(self.path) as c:
            c.row_factory = sqlite3.Row
            daily = c.execute("SELECT * FROM daily_lists WHERE date=?", (day,)).fetchone()
            if not daily:
                return None
            picks = c.execute(
                """SELECT p.*, (SELECT note FROM video_notes n WHERE n.candidate_id=p.candidate_id ORDER BY n.id DESC LIMIT 1) AS latest_note
                FROM picks p WHERE list_date=? ORDER BY id""",
                (day,),
            ).fetchall()
            result = dict(daily)
            result["picks"] = [dict(x) for x in picks]
            return result

    def latest_list(self):
        with sqlite3.connect(self.path) as c:
            row = c.execute("SELECT date FROM daily_lists WHERE status='ready' ORDER BY date DESC LIMIT 1").fetchone()
        return self.get_list(row[0]) if row else None

    def feedback(
        self,
        pick_id,
        disposition,
        reason="",
        video_timestamp="",
        book_page=None,
        now="",
        expected_candidate_id=None,
    ):
        if disposition not in {"completed", "continue", "not_started", "not_interesting"}:
            raise ValueError("bad disposition")
        with self.tx() as c:
            pick = c.execute("SELECT * FROM picks WHERE id=?", (pick_id,)).fetchone()
            if not pick:
                raise KeyError("pick not found")
            if expected_candidate_id is not None and pick["candidate_id"] != expected_candidate_id:
                raise ValueError("This recommendation changed. Reload the page before saving feedback.")
            state = {
                "completed": "completed",
                "continue": "continue",
                "not_started": "active",
                "not_interesting": "dropped",
            }[disposition]
            c.execute(
                "UPDATE picks SET state=?, last_video_timestamp=CASE WHEN ? <> '' THEN ? ELSE last_video_timestamp END WHERE id=?",
                (state, video_timestamp, video_timestamp, pick_id),
            )
            c.execute(
                "INSERT INTO feedback(pick_id,disposition,candidate_id,reason,video_timestamp,book_page,created_at) VALUES (?,?,?,?,?,?,?)",
                (pick_id, disposition, pick["candidate_id"], reason, video_timestamp, book_page, now),
            )
            if book_page is not None:
                book = c.execute("SELECT total_pages FROM books WHERE id=1").fetchone()
                if int(book_page) < 0 or (
                    book and book["total_pages"] is not None and int(book_page) > book["total_pages"]
                ):
                    raise ValueError("invalid book page")
                c.execute("UPDATE books SET reported_page=? WHERE id=1", (int(book_page),))

    def save_video_note(self, pick_id, candidate_id, note, now):
        if not isinstance(note, str):
            raise ValueError("A note must be text")
        with self.tx() as c:
            pick = c.execute("SELECT candidate_id, kind FROM picks WHERE id=?", (pick_id,)).fetchone()
            if not pick:
                raise KeyError("pick not found")
            if pick["candidate_id"] != candidate_id:
                raise ValueError("This recommendation changed. Reload before saving a note.")
            if pick["kind"] != "video":
                raise ValueError("Notes are available for videos only")
            c.execute(
                "INSERT INTO video_notes(pick_id,candidate_id,note,created_at) VALUES (?,?,?,?)",
                (pick_id, candidate_id, note.strip(), now),
            )

    def rejected_ids(self):
        with sqlite3.connect(self.path) as c:
            return {
                r[0]
                for r in c.execute(
                    "SELECT DISTINCT candidate_id FROM feedback "
                    "WHERE disposition='not_interesting' AND candidate_id IS NOT NULL"
                )
            }

    def report_book_page(self, page):
        page = int(page)
        with self.tx() as c:
            book = c.execute("SELECT total_pages FROM books WHERE id=1").fetchone()
            if not book:
                raise RuntimeError("Book state is not seeded")
            if page < 0 or (book["total_pages"] is not None and page > book["total_pages"]):
                raise ValueError("invalid book page")
            c.execute("UPDATE books SET reported_page=? WHERE id=1", (page,))

    def record_source_failure(self, day, now, message):
        """Keep ready picks readable; a failure is status, never fabricated content."""
        with self.tx() as c:
            row = c.execute("SELECT status FROM daily_lists WHERE date=?", (day,)).fetchone()
            if row:
                c.execute(
                    "UPDATE daily_lists SET source_status='failed', source_message=? WHERE date=?", (message, day)
                )
            else:
                c.execute(
                    "INSERT INTO daily_lists(date,created_at,status,source_status,source_message) VALUES (?,?,'failed','failed',?)",
                    (day, now, message),
                )

    def generate(self, day, catalog, now, source_failure=None, refresh=False):
        """Create once; explicit refresh only replaces reconsiderable picks."""
        with self.tx() as c:
            existing = c.execute("SELECT status FROM daily_lists WHERE date=?", (day,)).fetchone()
            if existing:
                if existing["status"] == "failed":
                    # A later good source recovers the marker and creates today's list.
                    c.execute("DELETE FROM daily_lists WHERE date=?", (day,))
                    existing = None
                else:
                    c.execute("UPDATE daily_lists SET source_status='ok', source_message=NULL WHERE date=?", (day,))
                # Explicit refresh changes only candidates the user dropped. It never
                # overwrites a completed, active, or continuing item.
                if existing and not refresh:
                    return False
                if existing:
                    return self._refresh(c, day, catalog)
            if source_failure:
                last = c.execute(
                    "SELECT date FROM daily_lists WHERE status='ready' ORDER BY date DESC LIMIT 1"
                ).fetchone()
                c.execute(
                    "INSERT INTO daily_lists(date,created_at,status,source_status,source_message) VALUES (?,?, 'failed','failed',?)",
                    (day, now, source_failure),
                )
                return bool(last)
            book = c.execute("SELECT * FROM books WHERE id=1").fetchone()
            if not book:
                raise RuntimeError("book state is not seeded")
            target = book["reported_page"] + book["daily_pace"]
            if book["total_pages"] is not None:
                target = min(target, book["total_pages"])
            c.execute(
                "INSERT INTO daily_lists(date,created_at,status,book_target) VALUES (?,?, 'ready',?)",
                (day, now, target),
            )
            # An unanswered or explicitly continued video carries forward. A plain
            # "didn't start" response does not become backlog or imply dislike.
            carry = c.execute("""SELECT p.* FROM picks p WHERE p.slot='lunch' AND p.state IN ('active','continue')
                AND COALESCE((SELECT f.disposition FROM feedback f
                    WHERE f.pick_id=p.id AND f.candidate_id=p.candidate_id
                    ORDER BY f.id DESC LIMIT 1), '') IN ('','continue')
                AND NOT EXISTS (SELECT 1 FROM picks later WHERE later.slot='lunch' AND later.candidate_id=p.candidate_id AND later.list_date>p.list_date)
                ORDER BY p.list_date DESC LIMIT 1""").fetchone()
            if carry:
                self._insert_pick(c, day, "lunch", dict(carry), "active")
            else:
                excluded = self._excluded_ids(c)
                deferred = self._temporarily_deferred_ids(c, day)
                videos = [
                    x
                    for x in catalog["candidates"]
                    if x["kind"] == "video" and x["id"] not in excluded and x["id"] not in deferred
                ]
                if videos:
                    self._insert_pick(c, day, "lunch", videos[0], "active")
            excluded = self._excluded_ids(c)
            deferred = self._temporarily_deferred_ids(c, day)
            reads = [
                x
                for x in catalog["candidates"]
                if x["kind"] == "read" and x["id"] not in excluded and x["id"] not in deferred
            ]
            if reads:
                self._insert_pick(c, day, "gap_read", reads[0], "active")
            return True

    def _excluded_ids(self, c):
        return {
            r[0]
            for r in c.execute(
                "SELECT DISTINCT candidate_id FROM feedback WHERE disposition IN ('completed','not_interesting')"
            )
        }

    def _latest_disposition(self, c, pick):
        row = c.execute(
            "SELECT disposition FROM feedback WHERE pick_id=? AND candidate_id=? ORDER BY id DESC LIMIT 1",
            (pick["id"], pick["candidate_id"]),
        ).fetchone()
        return row["disposition"] if row else None

    def _temporarily_deferred_ids(self, c, day):
        """Skip yesterday's not-started candidates once without rejecting them."""
        rows = c.execute(
            """SELECT p.* FROM picks p
            WHERE p.list_date=(
                SELECT MAX(date) FROM daily_lists WHERE status='ready' AND date < ?
            )""",
            (day,),
        ).fetchall()
        return {pick["candidate_id"] for pick in rows if self._latest_disposition(c, pick) == "not_started"}

    def _refresh(self, c, day, catalog):
        # Explicit refresh can reconsider a not-started slot. It does not make it
        # a rejection or create an overdue item.
        excluded = self._excluded_ids(c)
        present = {r[0] for r in c.execute("SELECT candidate_id FROM picks WHERE list_date=?", (day,))}
        changed = False
        picks = c.execute("SELECT * FROM picks WHERE list_date=?", (day,)).fetchall()
        for pick in picks:
            current = next((x for x in catalog["candidates"] if x["id"] == pick["candidate_id"]), None)
            if current and self._update_pick_metadata(c, pick, current):
                changed = True
            if self._latest_disposition(c, pick) not in {"not_started", "not_interesting"}:
                continue
            candidate = next(
                (
                    x
                    for x in catalog["candidates"]
                    if x["kind"] == pick["kind"] and x["id"] not in excluded and x["id"] not in present
                ),
                None,
            )
            if candidate:
                self._replace_pick(c, pick["id"], candidate)
                present.add(candidate["id"])
                changed = True
        return changed

    def _update_pick_metadata(self, c, pick, item):
        """Hydrate delivery details without changing selection or progress."""
        fields = (
            "title",
            "summary",
            "why",
            "url",
            "duration_minutes",
            "podcast_url",
            "podcast_verified",
            "snipd_url",
            "snipd_direct",
            "stopping_point",
            "provenance",
            "inspection_method",
            "inspected_at",
        )
        values = [item.get(field, 0 if field in {"podcast_verified", "snipd_direct"} else None) for field in fields]
        if all(pick[field] == value for field, value in zip(fields, values, strict=True)):
            return False
        assignments = ",".join(f"{field}=?" for field in fields)
        c.execute(f"UPDATE picks SET {assignments} WHERE id=?", (*values, pick["id"]))
        return True

    def _insert_pick(self, c, day, slot, item, state):
        c.execute(
            """INSERT INTO picks(list_date,slot,candidate_id,title,kind,summary,why,url,duration_minutes,podcast_url,podcast_verified,snipd_url,snipd_direct,stopping_point,provenance,inspection_method,inspected_at,state,last_video_timestamp)
        VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)""",
            (
                day,
                slot,
                item.get("candidate_id", item.get("id")),
                item["title"],
                item["kind"],
                item.get("summary"),
                item.get("why"),
                item.get("url"),
                item.get("duration_minutes"),
                item.get("podcast_url"),
                item.get("podcast_verified", 0),
                item.get("snipd_url"),
                item.get("snipd_direct", 0),
                item.get("stopping_point"),
                item.get("provenance"),
                item.get("inspection_method"),
                item.get("inspected_at"),
                state,
                item.get("last_video_timestamp"),
            ),
        )

    def _replace_pick(self, c, pick_id, item):
        c.execute(
            """UPDATE picks SET candidate_id=?,title=?,summary=?,why=?,url=?,duration_minutes=?,podcast_url=?,podcast_verified=?,snipd_url=?,snipd_direct=?,stopping_point=?,provenance=?,inspection_method=?,inspected_at=?,state='active',last_video_timestamp=NULL WHERE id=?""",
            (
                item["id"],
                item["title"],
                item.get("summary"),
                item.get("why"),
                item.get("url"),
                item.get("duration_minutes"),
                item.get("podcast_url"),
                item.get("podcast_verified", 0),
                item.get("snipd_url"),
                item.get("snipd_direct", 0),
                item.get("stopping_point"),
                item.get("provenance"),
                item.get("inspection_method"),
                item.get("inspected_at"),
                pick_id,
            ),
        )
