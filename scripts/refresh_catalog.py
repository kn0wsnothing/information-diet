#!/usr/bin/env python3
import argparse

from app.catalog_refresh import refresh_catalog

parser = argparse.ArgumentParser(description="Refresh a private inspected catalog atomically.")
parser.add_argument("--manifest", required=True)
parser.add_argument("--catalog", required=True)
args = parser.parse_args()
try:
    refresh_catalog(args.manifest, args.catalog)
except (OSError, ValueError) as error:
    print(f"catalog refresh failed: {error}")
    raise SystemExit(1)
print("catalog refreshed")
