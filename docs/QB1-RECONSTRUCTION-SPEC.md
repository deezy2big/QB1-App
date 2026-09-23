# QB1 Reconstruction Spec

This file is the earlier reconstruction guess (gold-and-red shell, NFL email gate, seeded analytics, simulated PhotoShelter and AP libraries). The running app no longer follows that shell. Local Ingest is the working path. PhotoShelter, Associated Press, Adobe, AWS, and the dashboard are not connected here.

Source: NFL GFX Specialized Platform Sync, 29 April 2026 (Shawn Baden walkthrough).  
Scope: QB1 web image-processing app only. Adobe After Effects panel is out of scope.

## Video extraction status

Attempted to decode `GFX Specialized Platform Sync-20260429_103319-Meeting Recording.mp4` (329 MB) from Google Drive folder [QB1 APP](https://drive.google.com/drive/folders/1XrNCMNLy2PjcIb8hfkYKPMpbQ4Zroa8G).

| Path | Result |
| --- | --- |
| Google Drive MCP `download_file_content` | Rejected: file exceeds 10 MB tool limit |
| `gdown` / public Drive URLs | File is owner-only; not link-shared |
| Browser Drive preview | Redirects to Google Sign-in (no browser Google session in this environment) |
| Transcript `.docx` embedded media | 253 PNGs, 6 unique, all 100×100 speaker avatars — no QB1 screenshots |

Shawn screen-shared the live app from ~4:48–18:00. This spec reconstructs that product from his spoken tour, not from pixels. Gaps that only the video (or NFL GitHub) could fill are listed at the end.

## Product

QB1 is a league-wide web app for centralized still and motion image processing. It started as a headshot cutter and is used daily for portraits, action stills, and rotoscope-style player cutouts.

- Auth: Okta. Any `@nfl.com` email can sign in.
- Original host: NFL GitHub + NFL AWS (Jason Omar / Tim Davidson). Lucas Flora built the backend with Shawn.
- This reconstruction stubs those integrations.

## Information architecture

```
Login (Okta)
 └── App shell
      ├── Photo Shelter   Finder-like DAM browser (default)
      ├── AP Images       Centralized AP search + persistent queue
      ├── Local upload    Desktop / movie drag-and-drop
      ├── Jobs            Live pipeline status (WebSocket)
      └── Analytics       Usage, cost, errors, people, offices
```

Right-hand inspector is always present on ingest views: selection summary, Process vs Download, Go.

## Screens

### 1. Login

Okta-style SSO. Demo reconstruction accepts any `@nfl.com` address or a one-click demo session.

### 2. Photo Shelter (Finder)

Shawn: “sort of like a Mac OS Finder” over Ben Lieppman’s Photo Shelter account (AP Images uploads land there).

- Left: folder / gallery / collection tree.
- Filters: Headshots, year (e.g. 2025), drill-down by team.
- Headshot badge on folders that participate in the headshot workflow; user can hide the badge.
- Main pane: thumbnail grid. Single-select shows image metadata; multi-select shows group summary.
- Select a team folder to process the whole roster, or pick individual players.
- Right rail: Process (cutout + pipeline) or Download (passthrough). Go submits a job.

### 3. AP Images

Same login, AP search from one place.

- Query + refiners (example from the call: a broad search returned ~13,500 hits; “Seattle” reduced it to ~180 across 4 pages).
- Paginated grid. Selections accumulate in the right-hand queue and survive page changes.
- Same Process / Download / Go actions.

### 4. Local upload

Drag from the desktop, or browse. Stills and movie files. Movies enter the rotoscope path (frame sequence → cutout → sequence out).

### 5. Jobs / live status

Spoken pipeline:

1. Asset copied from Photo Shelter (or AP / local) into NFL AWS.
2. Database record created, status `queued`.
3. Workers (Lambda + Step Functions) pick up the job.
4. Adobe APIs: background cutout.
5. AWS image recognition on headshots: locate eyes/pupils, measure inter-pupil distance, scale so pupils sit on a common registration point.
6. Status streamed to the client over WebSockets.

Statuses used in this rebuild: `queued` → `transferring` → `cutting_out` → `aligning` (headshots only) → `complete` | `failed`.

### 6. Analytics

Live ~6 months at the time of the call. Widgets Shawn actually pointed at:

| Widget | Call numbers |
| --- | --- |
| Jobs | 3,000+ |
| Images processed | 29,000+ |
| Success rate | shown (use 98.4% as a reconstruction stand-in) |
| Average job time | shown |
| Usage over the year | heaviest periods charted |
| Breakouts | image type, office, person |
| Errors / failed images / trends | spike called out on one day |
| Cost vs savings | $181 spend, $267,000 saved |
| Manual baseline (Cari) | 32 teams / ~3,900 headshots: 3 designers, 360 hours → 1 person, 2 hours |

## Processing modes

| Mode | Behavior |
| --- | --- |
| Headshot | Cutout + pupil registration / uniform scale |
| Portrait / action still | Cutout only |
| Rotoscope (movie) | Transcode to image sequence, per-frame cutout, emit cutout sequence |
| Download | No processing; fetch original |

## Architecture (stubbed)

```
User (Okta mock)
  → QB1 web app
      → Photo Shelter mock tree
      → AP Images mock search
      → Local FileReader / object URLs
      → Job store (client) simulating:
            queue + Lambda/Step Functions + Adobe cutout + Rekognition align
      → Interval “WebSocket” status ticks
      → Analytics store seeded with call stats
```

Production reconnect points (not in this repo): NFL Okta app, Photo Shelter API, AP Images API, Adobe Firefly/PS cutout APIs, AWS Lambda/Step Functions/Rekognition, WebSocket API, job database.

## Visual language (reconstructed, not traced)

No screenshots were recoverable. The rebuild uses a dark broadcast-ops shell:

- Near-black chrome, Finder-style folder tree, dense thumbnail grid, persistent right inspector.
- Gold/red accents (league production, not a consumer DAM).
- Headshot folders marked with a person badge.

## Remaining gaps (video or NFL source required)

- Exact nav labels, typography, and color tokens
- Exact Photo Shelter tree chrome and filter control layout
- Exact Process vs Download control widgets
- Job status copy and progress UI
- Analytics chart types (bar vs line vs pie) and filter chrome
- Output file naming, formats, and delivery destination (`.com` feed mentioned but not specified)
- Data model, API contracts, Adobe/AWS service names beyond “Adobe APIs” and “image recognition”
- Empty, permission, and error screens
