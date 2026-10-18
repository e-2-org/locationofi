#!/usr/bin/env python3
"""
Convert dump.xml (the final export of the location database) into
docs/data/locations.csv, which the archive site reads.

The date and time strings in the dump are treated as UTC, which is what the
project spec asked for. The stored timestamps are not used: the first server
made them with mktime() in UK time, so in summer they are an hour off from
the later server's, which ran on UTC. Six points recorded twice when the site
changed servers (30-31 March 2008) are dropped.

Usage: python3 tools/build-data.py [dump.xml] [docs/data/locations.csv]
"""
import csv
import sys
import xml.etree.ElementTree as ET
from datetime import datetime

src = sys.argv[1] if len(sys.argv) > 1 else "dump.xml"
dest = sys.argv[2] if len(sys.argv) > 2 else "docs/data/locations.csv"

rows = []
seen = set()
for loc in ET.parse(src).getroot().iter("location"):
    when = datetime.strptime(loc.get("date") + " " + loc.get("time"), "%d/%m/%Y %H:%M:%S")
    lat, lng = float(loc.get("lat")), float(loc.get("lng"))
    key = (when, lat, lng)
    if key in seen:
        continue
    seen.add(key)
    rows.append((when, int(loc.get("id")), lat, lng))

rows.sort()
with open(dest, "w", newline="") as f:
    out = csv.writer(f, lineterminator="\n")
    out.writerow(["id", "utc", "lat", "lng"])
    for when, id_, lat, lng in rows:
        out.writerow([id_, when.strftime("%Y-%m-%dT%H:%M:%SZ"), f"{lat:.6f}".rstrip("0").rstrip("."), f"{lng:.6f}".rstrip("0").rstrip(".")])

print(f"{len(rows)} locations written to {dest} ({rows[0][0]} to {rows[-1][0]})")
