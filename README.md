# QB1

Reconstruction of the NFL Media Design image-processing web app walked through on 29 April 2026.

The job engine processes real image bytes: copy into storage, cut out background, lock headshot pupils to a registration line, and explode movies to a frame sequence. Status streams to the UI over SSE.

Vendor systems (Okta, Photo Shelter, AP Images, Adobe, AWS S3/Rekognition) are typed adapters. They stay on local implementations until you fill in `.env.local` — see `.env.example`.

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000). Sign in with any `@nfl.com` email, or use **Demo as Shawn Baden**.

```bash
npm test
npm run build
```

Spec: [docs/QB1-RECONSTRUCTION-SPEC.md](docs/QB1-RECONSTRUCTION-SPEC.md).
