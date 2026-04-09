# NWM Console

NWM Console is a deterministic MVP for Narrative World Modeling. It is a governance-grade demonstrator for bounded narrative environment observability, not a sentiment dashboard and not an automated decision system.

## Product focus

- Bound a Narrative World with explicit geography, domain, horizon, and governance posture.
- Replay seeded artifacts across an 18-month geopolitical capital fragmentation scenario.
- Show structural metric evolution through the Interpretation Layer, the Adjudication Layer, and the Simulation Engine.
- Support bounded counterfactual simulation without making predictive or prescriptive claims.

## Run

```bash
npm install
npm run dev
```

The console is available from both `http://localhost:5173/` and `http://localhost:5173/nwm-console` when you use the default Vite dev port. The `/nwm-console` path also keeps export preview routes under the same alias.

Brief URL ingest now supports direct webpages as well as documents. For HTML pages, the server first normalizes static page text and can fall back to a headless browser render for JS-heavy sites before handing the extracted text to the scenario import flow.

Optional AI-enhanced narration:

```bash
cp .env.example .env.local
```

Then set `OPENAI_API_KEY` in `.env.local` for server-side proxying, or `VITE_OPENAI_API_KEY` if you are only testing the local dev server path. You can also paste an API key into the top-bar OpenAI narration field at runtime for local development. The current implementation keeps the browser speech engine for playback and uses the OpenAI Responses API only to generate more nuanced section scripts. For production, keep the key server-side.

## Shareable deployment

If you want a real URL that someone else can open, deploy the app instead of sharing your local `127.0.0.1` address.

### Recommended: Vercel

This repo now includes:

- `vercel.json` for SPA routing
- `api/openai/narration.ts`
- `api/openai/speech.ts`

Those serverless routes preserve the OpenAI voice path in production.

Steps:

1. Push the repo to GitHub.
2. Import the repo into Vercel.
3. In Vercel project settings, add:
   - `OPENAI_API_KEY=your_openai_key`
4. Deploy.

After that, you can send the Vercel URL directly to someone else.

### Netlify

This repo also includes `netlify.toml` for SPA routing. That is enough for static hosting and shared URLs, but the OpenAI voice path is not wired through Netlify functions in this repo yet. On Netlify, local browser voice still works, and the app shell will load normally.

### Local build preview

You can verify the production build locally with:

```bash
npm run build
npm run preview
```

That gives you a local production-style preview before deployment.

## Included showcase scenarios

- `Capital Fragmentation`
- `Supply Chain Realignment`
- `Institutional Disclosure Stress`
- `Digital Asset Fragmentation`
- `AI Sovereignty and Compute Access`

The `AI Sovereignty and Compute Access` world is the strongest flagship scenario for institutional demos because it spans policy, legal, market, infrastructure, and sovereign artifacts inside a board-relevant operating environment.

For that scenario, the repo now contains both:

- raw source inputs:
  - `src/data/aiSovereigntyWorldSource.json`
  - `src/data/aiSovereigntyInitialEvents.json`
- transformed scenario used by the app:
  - `src/data/aiSovereigntyScenario.ts`

The transformed scenario preserves your provided world definition and early event set, then continues with seeded deterministic events so the console still demonstrates replay, transitions, proof objects, and phase movement.

## Real-world import path

You can start converting real-world bounded events into the console without changing the replay or adjudication engines.

- CSV template: `src/data/aiSovereigntyImportTemplate.csv`
- Scoring rubric: `src/data/SCORING_RUBRIC.md`
- CSV utility: `src/utils/scenarioCsv.ts`
- In-app uploader: `src/components/ScenarioImportPanel.tsx`

Recommended workflow:

1. Define the bounded world.
2. Fill the CSV with only in-boundary artifacts.
3. Score `velocity`, `density`, `coherence`, and `reversibility` using the rubric.
4. Convert the CSV rows into the existing scenario shape with `scenarioDatasetFromCsvRows`.
5. Load the resulting dataset through `loadScenarioDataset`.

You can also skip manual conversion and use the in-app importer to upload either:

- a ready `ScenarioDataset` JSON
- or a raw world JSON plus raw event-set JSON in the richer source format

## Architecture

- `src/data`: Swappable seeded scenario JSON.
- `src/rules/phaseRules.ts`: Versioned adjudication thresholds and hysteresis policy.
- `src/engine/stateEngine.ts`: Deterministic world-state replay engine.
- `src/engine/phaseAdjudicator.ts`: Transition evaluation and proof object generation.
- `src/engine/counterfactualEngine.ts`: Deterministic scenario mutation for sandbox mode.
- `src/utils/openaiNarration.ts`: Optional AI-enhanced narration prompt builder and OpenAI Responses API client.
- `src/components`: Institutional UI panels.
- `src/views`: Role-based compositions for executive, analyst, and oversight workflows.

## Extension points

- Replace the seeded dataset by swapping the JSON schema-compatible file in `src/data`.
- Replace the CSV import utility in `src/utils/scenarioCsv.ts` with a production ingestion pipeline or validation service.
- Replace the phase rules engine by editing `src/rules/phaseRules.ts` and keeping the exported interface stable.
- Replace Interpretation Layer computation in `src/engine/stateEngine.ts` without touching the UI contracts.
- Replace proof generation in `src/engine/phaseAdjudicator.ts` as long as `ProofObject` remains stable.
- Replace replay logic by changing `runWorldSimulation`.
- Replace topology generation in `NarrativeWorldMap.tsx` with a future graph library or backend-fed layout.
- Replace the browser-side AI narration call in `src/utils/openaiNarration.ts` with a server route that handles key management, prompt logging, and response caching.

## Deployment notes

- The Vite dev server already proxies `/api/openai/*` in local development.
- Vercel handles those same routes in production via `api/openai/*`.
- For a serious production deployment, use `OPENAI_API_KEY` as a server-side secret. `VITE_OPENAI_API_KEY` is only appropriate for local MVP testing.

## Governance non-claims

This MVP does not:

- determine truth
- infer beliefs
- profile actors
- predict behavior
- recommend interventions
- automate decisions
