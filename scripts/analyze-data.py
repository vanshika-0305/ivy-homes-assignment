"""Reproduce submission metrics from data/raw/*.json.

This script intentionally keeps the anomaly rules explicit so the README can distinguish
observations from assumptions that require the assignment reference files.
"""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

ROOT = Path(__file__).parents[1]
REFERENCE = datetime.fromisoformat("2026-09-10T00:00:00+05:30")
IST = timezone(timedelta(hours=5, minutes=30))


def load(name: str) -> list[dict]:
    return json.loads((ROOT / "data" / "raw" / f"{name}.json").read_text(encoding="utf-8-sig"))["results"]


def corrupt_ids(listings: list[dict]) -> list[str]:
    ids = {
        listing["listing_id"]
        for listing in listings
        if listing["price"] < 0
        or listing["floor"] > listing["total_floors"]
        or listing["carpet_area"] > listing["super_built_up_area"]
        or not (18.3 <= listing["latitude"] <= 18.8 and 73.6 <= listing["longitude"] <= 74.1)
    }
    return sorted(ids)


def fake_ids(listings: list[dict]) -> list[str]:
    ids = {
        listing["listing_id"]
        for listing in listings
        if "token amount" in listing["description"].lower()
        or "booking amount" in listing["description"].lower()
    }
    return sorted(ids)


def posted_at_in_window(value: str) -> bool:
    parsed = datetime.fromisoformat(value.replace("Z", "+00:00"))
    if parsed.tzinfo is None:
        parsed = parsed.replace(tzinfo=IST)
    return REFERENCE - timedelta(days=7) <= parsed.astimezone(IST) < REFERENCE


def main() -> None:
    listings, rentals, projects = load("listings"), load("rentals"), load("projects")
    corrupt = corrupt_ids(listings)
    fake = fake_ids(listings)
    excluded = set(corrupt) | set(fake)
    eligible = [
        listing
        for listing in listings
        if listing["is_live"] and listing["bedroom"] == 2 and listing["listing_id"] not in excluded
    ]
    property_keys = {
        (listing["apartment_name"].strip().lower(), listing["locality"].strip().lower(), listing["latitude"], listing["longitude"])
        for listing in listings
    }
    wrong_project_counts = sum(
        sum(listing.get("project_id") == project["project_id"] for listing in listings) != project["total_listings"]
        for project in projects
    )
    result = {
        "total_listing_records": len(listings),
        "unique_properties": len(property_keys),
        "active_listings": sum(listing["is_live"] for listing in listings),
        "corrupt_listing_ids": corrupt,
        "total_monthly_rent": sum(rental["price"] for rental in rentals if rental["locality"].lower() == "balewadi"),
        "avg_price_per_sqft_2bhk": round(sum(item["price"] / item["carpet_area"] for item in eligible) / len(eligible), 2),
        "costliest_project": {
            "project_id": max(projects, key=lambda project: project["price_max"])["project_id"],
            "price_max_inr": int(max(projects, key=lambda project: project["price_max"])["price_max"] * 10_000_000),
        },
        "listings_last_7_days": sum(posted_at_in_window(listing["posted_at"]) for listing in listings),
        "fake_listing_ids": fake,
        "projects_with_wrong_listing_count": wrong_project_counts,
    }
    print(json.dumps(result, indent=2))


if __name__ == "__main__":
    main()