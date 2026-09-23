# qb1

Local image jobs: drop in stills, process them to cut out the background, or download the originals untouched.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Local Ingest is the working screen. PhotoShelter, Associated Press, and the dashboard are not connected. Headshots and adobe-v2 are not available. There is no NFL login.

Jobs are stored under `.data/` (or `QB1_DATA_DIR`). A finished job downloads one image, or a zip when the job has several.

```bash
npm test
npm run build
```

The April 2026 walkthrough notes are the product outline. This repo also keeps an earlier reconstruction spec at [docs/QB1-RECONSTRUCTION-SPEC.md](docs/QB1-RECONSTRUCTION-SPEC.md). That spec guessed a gold-and-red shell and seeded analytics; the running app does not use that shell.
