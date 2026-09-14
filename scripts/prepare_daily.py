#!/usr/bin/env python3
"""Prepare once per HKT day, optionally refreshing inspected private sources first."""

import argparse
from datetime import datetime

from app.catalog_refresh import refresh_catalog
from app.service import prepare
from app.store import Store
from app.time import HKT, hkt_date


def run(args):
    day, now = args.date or hkt_date(), datetime.now(HKT).isoformat()
    if args.manifest:
        try:
            refresh_catalog(args.manifest, args.catalog)
        except (OSError, ValueError) as error:
            failed = Store(args.db)
            failed.setup()
            failed.record_source_failure(day, now, f"catalog refresh failed: {error}")
            print(f"failure: catalog refresh failed: {error}")
            return 1
    outcome = prepare(args.db, args.catalog, day, now)
    if outcome == "failure":
        print("failure: source load or schema validation failed")
        return 1
    print(outcome)
    return 0


parser = argparse.ArgumentParser()
parser.add_argument("--db", required=True)
parser.add_argument("--catalog", required=True)
parser.add_argument("--manifest")
parser.add_argument("--date")
if __name__ == "__main__":
    raise SystemExit(run(parser.parse_args()))
