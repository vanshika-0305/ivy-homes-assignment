# Ivy Homes Pune Property Workspace

This repository contains a React + Vite + TypeScript property workspace for the Ivy Homes internship assignment. It uses the live Pune API contract discovered during investigation rather than assuming the supplied documentation is accurate.

## Run locally

1. Set the API key for the Vite development proxy without committing it:

   ```powershell
   $env:IVY_API_KEY = "your-key"
   npm install
   npm run dev
   ```

2. Open the local URL printed by Vite and sign in with one of the supplied demo accounts.

The API key is injected by the development proxy and is not placed in browser code. The raw downloaded dataset is ignored by Git.

## Architecture

- `src/api.ts` centralizes authentication, refresh, pagination, and API requests.
- `src/types.ts` describes the observed listing, rental, project, and pagination shapes.
- `src/App.tsx` provides login, listings, filters, per-user favourites, rentals, projects, and insights.
- `src/styles.css` contains the responsive visual system.
- `scripts/download-data.ps1` retrieves complete datasets by following the server's returned `has_more` flag.
- `docs/investigation.md` records reproducible API observations and analysis status.

## Confirmed API behavior

- Health is available at `/health` and reports IST plus the assignment reference date.
- Login is `/auth/login`; `/v1/auth/login` returns 404.
- Refresh is `/auth/refresh`; access tokens report a 900-second lifetime.
- Listings, rentals, and projects use `limit` and `offset`, returning `count`, `total`, `has_more`, and `results`.
- A requested limit of 1000 is capped to 50.
- Following `has_more` retrieves 3,800 listings, 1,450 rentals, and 440 projects, despite first-page totals of 3,485, 1,330, and 404.
- `/v1/analytics/summary` and `/analytics/summary` both returned 404 during investigation.

## Data investigation

The local retrieval found 28 disjoint impossible-value candidates: seven negative prices, seven floors above total floors, seven carpet areas above super-built-up areas, and seven listings with latitude/longitude swapped. Their IDs and the testing methodology are recorded in `docs/investigation.md`.

The following hypotheses were tested and not accepted as fraud rules:

- Zero bedrooms and bathrooms: mostly valid plot records.
- Seller/contact reuse: common throughout the generated multi-source dataset.
- Listing/project name mismatch: widespread and not contradicted by locality or city.
- Exact listing URL duplication: none found.

## Submission analysis

`submission.json` is generated from the downloaded records with `python scripts/analyze-data.py`. The current values are:

- 3,800 retrievable listings and 2,998 live listings.
- 3,515 properties using normalized apartment name, locality, latitude, and longitude as the physical-property key.
- Balewadi monthly rental total: INR 5,184,200.
- Live 2BHK average price per carpet square foot: INR 18,557.42, excluding the corrupt and fake candidate IDs.
- Highest project maximum: `P30394`, INR 999,000,000 after converting the API's crore-valued project price to rupees.
- 128 listings posted in the seven-day interval before the reference moment.
- 317 projects whose reported listing count differs from the listing dataset.

The fake-listing hypothesis is explicit and reproducible: 74 records contain either `token amount` or `booking amount` payment-pressure language. This is recorded as a candidate fraud rule, not as a claim that arbitrary seller/contact reuse is fraudulent. The latter was tested and rejected because it is widespread across the multi-source dataset.

The confirmed documentation findings are recorded in `submission.json` and `docs/investigation.md`. They cover authentication headers, pagination and completeness, inactive records, project price units, timestamp formats, missing detail/similar/favourites/analytics routes, refresh-token behavior, duplicate physical-property groups, and project count contradictions. Locality, BHK, and price sorting probes worked and were deliberately not reported as discrepancies. Candidate name and email are populated from the supplied registration email; the public repository and deployed app URLs remain placeholders until they exist.

## With another two days

- Finish the documented-versus-observed comparison from the actual reference file.
- Validate the fraud hypothesis against any assignment-specific data clues and add evidence IDs.
- Add URL-addressable listing/project detail routes and server-backed favourites if the live API exposes them.
- Add automated API-contract and browser workflow tests, then deploy behind a server-side proxy.

## Tools used

This work used GitHub Copilot, PowerShell, Python for local dataset analysis, React, Vite, TypeScript, and Lucide icons. All conclusions in the investigation log are based on live API requests or local downloaded data.