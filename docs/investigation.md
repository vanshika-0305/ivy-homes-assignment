# Ivy Homes API Investigation

This log records behavior reproduced against the live API. Credentials and bearer tokens are intentionally omitted.

## Run context

- Base URL: `https://solve.ivy.homes`
- API key: supplied at runtime, not stored in this repository
- City: Pune
- Assigned locality: Balewadi
- Reference moment: `2026-09-10T00:00:00+05:30`
- Documentation comparison: pending because `API_REFERENCE.md` is not yet present in the workspace

## Verified observations

| Endpoint | Test | Actual behavior | Evidence |
| --- | --- | --- | --- |
| `/health` | `GET` with API key | HTTP 200; returns `status`, `server_time`, `timezone`, and `reference_date` | `server_time=2026-09-14T21:55:42.186008+05:30`; `timezone=Asia/Kolkata`; `reference_date=2026-09-10T00:00:00+05:30` |
| `/v1/auth/login` | `POST` with `demo1@ivy.homes` credentials and API key | HTTP 404 with an empty body | Versioned login hypothesis disproved |
| `/auth/login` | `POST` with `demo1@ivy.homes` credentials and API key | HTTP 200; returns `access_token`, `refresh_token`, `token_type`, `expires_in`, `refresh_url`, and `user.email` | `token_type=Bearer`; `expires_in=900`; `refresh_url=/auth/refresh` |
| `/auth/login` and `/auth/refresh` | Login and refresh tested for all three supplied demo accounts | All three logins returned HTTP 200 and refresh tokens produced new access tokens | `demo1@ivy.homes`, `demo2@ivy.homes`, and `demo3@ivy.homes`; access lifetime `900` seconds |
| `/v1/listings` | Authenticated `GET` with `limit=1&offset=0` | HTTP 200; returns `limit`, `offset`, `count`, `total`, `has_more`, and `results` | `limit=1`; `offset=0`; `count=1`; `total=3485`; `has_more=true` |
| `/v1/rentals` | Authenticated `GET` with `limit=1&offset=0` | HTTP 200; same pagination envelope as listings | `total=1330`; first record `listing_id=R3000001` |
| `/v1/projects` | Authenticated `GET` with `limit=1&offset=0` | HTTP 200; same pagination envelope as listings | `total=404`; first record `project_id=P30001` |
| `/v1/analytics/summary` | Authenticated `GET` | HTTP 404 Not Found | The unversioned `/analytics/summary` neighbor also returned HTTP 404; documentation comparison is pending |

### Pagination consistency check

Requesting `limit=1000` is capped to an effective `limit=50`. The reported totals are stable at 3,485 listings, 1,330 rentals, and 404 projects, but `has_more` remains true beyond each reported total. Following `has_more` to false retrieved 3,800 listings, 1,450 rentals, and 440 projects. The retrieved IDs were unique within each dataset. For example, listings at offset 3,750 returned 50 records and `has_more=false`; projects at offset 400 returned 40 records and `has_more=false`. These are observed API facts; comparison to the documentation is pending `API_REFERENCE.md`.

## Listings response sample

The first observed record was `listing_id=DWE-3002501`. Fields observed include `price`, `carpet_area`, `super_built_up_area`, `bedroom`, `bathroom`, `floor`, `total_floors`, `latitude`, `longitude`, `project_id`, `is_verified`, `posted_at`, and `is_live`. The observed `posted_at` value was `2026-04-30T14:57:00` with no offset in the record.

The first rental record was `listing_id=R3000001`; it includes monthly `price`, `deposit`, `maintenance`, `carpet_area`, and `super_builtup_area`, and its `posted_at` value included a `Z` suffix. The first project record was `project_id=P30001`; it includes `total_units`, `total_towers`, `total_floors`, area bounds, `total_listings`, and `price_min`/`price_max`.

## Pending work

- Add and read `statement.md`, `API_REFERENCE.md`, and `submission.template.json` from the workspace.
- Test all documented endpoints and compare claims against reproduced behavior.
- Download complete listings, rentals, and projects datasets using observed pagination.
- Analyze the ten answers and corruption/fraud hypotheses from the local dataset.

## Provisional local metrics

These values are calculated from the downloaded records and are not yet the final submission until the documentation contract and fake-listing rule are verified:

- Retrieved records: 3,800 listings, 1,450 rentals, 440 projects.
- Active listings: 2,998.
- Balewadi rental price sum: 5,184,200.
- Costliest observed project: `P30394`, `price_max=99.9`, `Brigade Park`.
- Listings posted in `[2026-09-03T00:00:00+05:30, 2026-09-10T00:00:00+05:30)`: 128.
- Projects whose reported `total_listings` differs from the downloaded listing count: 317.
- Four disjoint impossible-value rules identify 28 candidate corrupt listing IDs: negative price, floor above total floors, carpet area above super-built-up area, and swapped latitude/longitude. The complete candidate ID list is preserved in the analysis command output and must be rechecked in the final analysis artifact.
- A normalized `(apartment_name, locality, latitude, longitude)` grouping yields 3,515 candidate physical properties, but this identity rule is provisional because same coordinates can represent multiple units.
- Fake listing IDs are not yet identified; contact reuse, project-name mismatch, and zero bedroom/bathroom values were tested and rejected as standalone rules.

## Confirmed documentation discrepancies

These findings compare the supplied API reference with reproduced behavior:

- **Auth:** The reference says to append `api_key` as a query parameter. An authenticated `GET /v1/listings?api_key=...` without the `X-API-Key` header returned 401. The live requests require the API-key header.
- **Pagination:** The reference says collections use 1-indexed `page` and `limit`, maximum 200, with `page_size` responses. The live API ignores `page`, returns `offset`, `count`, `total`, and `has_more`, caps a requested limit of 1000 to 50, and continues past the reported total.
- **Completeness:** The live endpoints yielded 3,800 listings, 1,450 rentals, and 440 projects while their first-page totals were 3,485, 1,330, and 404.
- **Data quality/active status:** The reference says `/v1/listings` returns only active listings. The downloaded response contained 802 records with `is_live=false`.
- **Units:** The reference describes project `price_min` and `price_max` as rupees. The observed project values are crore-scale decimals; the costliest value is `price_max=99.9` for `P30394`, not an integer rupee amount.
- **Timestamps:** The reference says timestamps universally use UTC `Z`. Listing records include values such as `2026-04-30T14:57:00` without an offset, while rental records include values such as `2026-09-04T00:21:00Z`.
- **Missing endpoint:** `/v1/listing/{listing_id}` returned 404; `/v1/listings/{listing_id}` returned the listing successfully.
- **Missing endpoints:** `/v1/listings/{listing_id}/similar`, `/v1/favourites`, and `/v1/analytics/summary` returned 404.
- **Undocumented endpoint:** `/auth/refresh` exists and returns a renewed access token, despite the reference saying there is no refresh flow.
- **Duplicates:** The reference says each listing maps to one physical property. 247 exact coordinate groups contain 532 records, and normalized apartment/locality/coordinate grouping yields 3,515 groups from 3,800 records.
- **Consistency:** 317 projects have a `total_listings` value different from the number of downloaded listing records carrying that `project_id`.