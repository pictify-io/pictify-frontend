#!/usr/bin/env python3
"""
Weekly SEO check-in: pulls the last 7 days of Google Search Console data
(via Composio) for every page tracked in the "Pages" tab of the SEO Tracker
spreadsheet, diffs it against last week's snapshot, appends a new row per
page to "Weekly Data", and appends any notable changes to "This Weeks Flags".

Runs standalone via `composio` CLI + the Google Sheets/Search Console REST
APIs it wraps — no Claude session required. Intended to run on a schedule
(cron/launchd), not interactively.

Usage: python3 weekly-check.py
Requires: `composio` CLI on PATH, authenticated (see `composio whoami`).
"""

import json
import subprocess
import sys
from datetime import date, timedelta

SPREADSHEET_ID = "1nWkACAbTfxQJqYV5quh2hstTytnK1_S8NX2U5y0vdA4"
SITE_URL = "sc-domain:pictify.io"
COMPOSIO = "/Users/suyashthakur/.local/bin/composio"

# GSC data typically lags ~3 days; pull the most recent complete 7-day window.
END_DATE = date.today() - timedelta(days=3)
START_DATE = END_DATE - timedelta(days=6)
WEEK_LABEL = START_DATE.isoformat()


def composio_execute(slug, data):
    proc = subprocess.run(
        [COMPOSIO, "execute", slug, "-d", json.dumps(data)],
        capture_output=True, text=True, timeout=120
    )
    if proc.returncode != 0:
        print(f"ERROR calling {slug}: {proc.stderr}", file=sys.stderr)
        sys.exit(1)
    return json.loads(proc.stdout)


def get_tracked_urls():
    result = composio_execute("GOOGLESHEETS_VALUES_GET", {
        "spreadsheet_id": SPREADSHEET_ID,
        "range": "Pages!A2:A1000",
    })
    values = (result.get("data") or {}).get("values", [])
    urls = [row[0] for row in values if row and row[0].startswith("/")]
    return urls


def get_gsc_page_data():
    result = composio_execute("GOOGLE_SEARCH_CONSOLE_SEARCH_ANALYTICS_QUERY", {
        "site_url": SITE_URL,
        "start_date": START_DATE.isoformat(),
        "end_date": END_DATE.isoformat(),
        "dimensions": ["page"],
        "search_type": "web",
        "row_limit": 1000,
        "start_row": 0,
        "data_state": "final",
        "aggregation_type": "auto",
        "dimension_filter_groups": [],
    })
    rows = (result.get("data") or {}).get("rows", [])
    by_url = {}
    for r in rows:
        path = r["keys"][0].replace("https://pictify.io", "")
        by_url[path] = {
            "clicks": r["clicks"],
            "impressions": r["impressions"],
            "ctr": round(r["ctr"], 4),
            "position": round(r["position"], 1),
        }
    return by_url


def get_last_snapshot():
    """Most recent prior-week row per URL from the Weekly Data tab, keyed by URL."""
    result = composio_execute("GOOGLESHEETS_VALUES_GET", {
        "spreadsheet_id": SPREADSHEET_ID,
        "range": "Weekly Data!A2:G100000",
    })
    values = (result.get("data") or {}).get("values", [])
    latest_by_url = {}
    for row in values:
        if len(row) < 7:
            continue
        week, url = row[0], row[1]
        if week == WEEK_LABEL:
            continue  # don't diff against a row from this same run (reruns)
        prev = latest_by_url.get(url)
        if prev is None or week > prev["week"]:
            latest_by_url[url] = {
                "week": week,
                "clicks": float(row[3] or 0),
                "impressions": float(row[4] or 0),
                "position": float(row[6] or 0),
            }
    return latest_by_url


def compute_flags(url, current, previous):
    flags = []
    clicks, impr, pos = current["clicks"], current["impressions"], current["position"]

    if previous is None and impr > 0:
        flags.append(("New in Search Console", f"{impr} impressions, no prior data", "Check indexing/build a first content review"))
        return flags

    if previous is None:
        return flags

    prev_clicks, prev_impr, prev_pos = previous["clicks"], previous["impressions"], previous["position"]

    if prev_clicks >= 3 and clicks <= prev_clicks * 0.5:
        flags.append(("Clicks dropped", f"{prev_clicks:.0f} → {clicks:.0f}", "Check for cannibalization, content staleness, or a ranking drop"))

    if prev_pos > 0 and pos > 0 and pos - prev_pos >= 5:
        flags.append(("Position dropped", f"{prev_pos:.1f} → {pos:.1f}", "Compare against the current top-ranking competitor for this query"))

    if prev_pos > 0 and pos > 0 and prev_pos - pos >= 5:
        flags.append(("Position improved", f"{prev_pos:.1f} → {pos:.1f}", "Reinforce with an internal link from a stronger page"))

    if impr >= 10 and clicks == 0 and prev_impr >= 10 and prev_clicks == 0:
        flags.append(("Impressions but zero clicks, 2+ weeks", f"{impr:.0f} impressions, 0 clicks", "Likely a title/meta-description problem, not a ranking problem"))

    return flags


def sheets_append(range_, rows):
    if not rows:
        return
    composio_execute("GOOGLESHEETS_SPREADSHEETS_VALUES_APPEND", {
        "spreadsheetId": SPREADSHEET_ID,
        "range": range_,
        "values": rows,
        "valueInputOption": "USER_ENTERED",
    })


def main():
    print(f"Weekly SEO check — window {START_DATE} to {END_DATE}")

    tracked_urls = set(get_tracked_urls())
    print(f"Tracking {len(tracked_urls)} pages from the registry")

    gsc_data = get_gsc_page_data()
    previous = get_last_snapshot()

    weekly_rows = []
    flag_rows = []

    for url in sorted(tracked_urls):
        current = gsc_data.get(url, {"clicks": 0, "impressions": 0, "ctr": 0, "position": 0})
        weekly_rows.append([
            WEEK_LABEL, url, "", current["clicks"], current["impressions"],
            current["ctr"], current["position"],
        ])
        for flag_type, detail, action in compute_flags(url, current, previous.get(url)):
            flag_rows.append([WEEK_LABEL, url, flag_type, detail, action])

    sheets_append("Weekly Data!A1", weekly_rows)
    sheets_append("This Weeks Flags!A1", flag_rows)

    print(f"Wrote {len(weekly_rows)} weekly rows, {len(flag_rows)} flags.")
    if flag_rows:
        print("\nFlags this week:")
        for row in flag_rows:
            print(f"  [{row[2]}] {row[1]} — {row[3]}")


if __name__ == "__main__":
    main()
