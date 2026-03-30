# Executive Brief Spec

## Purpose

`ExecutiveBriefSpec` is the production schema for the NWM Console executive brief. It replaces generic summary-driven section assembly with a deterministic, state-dependent structure that always follows the same five-section narrative architecture.

The governing structure is integrated directly into the schema:

1. Header
2. System State Overview
3. Narrative Development
4. Structural Interpretation
5. Forward Orientation
6. Strategic Positioning
7. Evidence Base

The rendered page model remains three pages:

- Page 1: Header + System State Overview
- Page 2: Narrative Development + Structural Interpretation
- Page 3: Forward Orientation + Strategic Positioning + Evidence Base

## How The Structure Model Was Integrated

The attached Executive Brief Structure model was treated as the narrative contract, not as loose guidance.

- The schema maps each required narrative block to an explicit field group.
- Paragraph counts are fixed by section intent.
- Each paragraph has its own tone, budget, placement, and fallback behavior.
- The builder works from bounded-world state and accumulated developments, not from generic summary paragraphs.
- Validation enforces state-dependence, alternate-path quality, evidence consequence, and non-generic executive tone.

## Section Roles

### Header

Establishes the decision frame.

- `scenarioName`
- `boundedWorld`
- `asOfLabel`
- `currentPhase`
- optional `haloSnapshotVisual`
- `executiveHeadline`
- `executiveSubline`

### System State Overview

Explains where the system is now.

- `currentConditionParagraph`
  - current condition
  - broad environment characterization
- `meaningParagraph`
  - operating meaning
  - broken assumptions
  - pressure build

### Narrative Development

Explains how the system arrived here.

- `earlySignalsParagraph`
- `systemicUptakeParagraph`
- `currentConditionParagraph`

### Structural Interpretation

Explains what the pattern indicates and what transition is underway.

- `interpretationParagraph1`
- optional `interpretationParagraph2`

### Forward Orientation

Explains the primary path and a real alternate path from the current state.

- `primaryPathParagraph`
- `alternatePathParagraph`

### Strategic Positioning

Explains what should be revisited now.

- `positioningParagraph1`
- optional `positioningParagraph2`
- optional support lists:
  - `priorityAreas`
  - `sensitivityPoints`
  - `visibilityNeeds`

### Evidence Base

Anchors the read in consequential signals rather than taxonomy.

- `intro`
- `items[]`
  - `code`
  - `signal`
  - `significance`

## Paragraph Budgets

- `header.executiveHeadline`: max 12 words
- `header.executiveSubline`: max 20 words
- `systemStateOverview.currentConditionParagraph`: 45–85 words
- `systemStateOverview.meaningParagraph`: 45–85 words
- `narrativeDevelopment.earlySignalsParagraph`: 40–75 words
- `narrativeDevelopment.systemicUptakeParagraph`: 40–75 words
- `narrativeDevelopment.currentConditionParagraph`: 40–75 words
- `structuralInterpretation.interpretationParagraph1`: 45–90 words
- `structuralInterpretation.interpretationParagraph2`: 35–80 words when present
- `forwardOrientation.primaryPathParagraph`: 40–75 words
- `forwardOrientation.alternatePathParagraph`: 40–75 words
- `strategicPositioning.positioningParagraph1`: 40–80 words
- `strategicPositioning.positioningParagraph2`: 30–70 words when present
- `evidenceBase.intro`: max 40 words

Support-list budgets:

- `priorityAreas`: 2–4 items, max 10 words each
- `sensitivityPoints`: 2–4 items, max 10 words each
- `visibilityNeeds`: 2–4 items, max 10 words each

Evidence-item budgets:

- `code`: max 2 words
- `signal`: max 14 words
- `significance`: max 12 words

## Tone Expectations

The brief must sound written for executives, partners, and principals.

Required qualities:

- complete and confident
- direct implication
- causal clarity
- concise institutional tone
- state-dependent, not time-dependent

Rejected qualities:

- generic strategy filler
- model jargon
- NWM self-explanation
- consulting language
- descriptive evidence labels without consequence

## Good Vs Bad Examples

### `executiveHeadline`

Good:

`Constraint now governs capital, coordination, and access together.`

Bad:

`The system is now in a place where risks are increasing.`

Why bad fails:

- banned filler structure
- vague subject
- no direct implication

### `currentConditionParagraph`

Good:

`The system now operates under active fragmentation rather than temporary friction. Cross-border coordination still exists, but it no longer clears pressure fast enough to stabilize exposed decisions. The environment now favors control, reversibility, and selective exposure over efficiency assumptions built for broader alignment.`

Bad:

`The environment is changing and organizations are feeling pressure in different ways.`

Why bad fails:

- too short
- generic
- no bounded-world condition
- no executive-grade consequence

### `meaningParagraph`

Good:

`Operating assumptions built on rapid normalization now misprice exposure. Cross-border efficiency can no longer anchor planning, and pressure is pooling first where coordination, allocation, and access depend on one another. Leaders now need to plan through constraint rather than wait for relief.`

Bad:

`This means leaders should think carefully about what comes next.`

Why bad fails:

- banned phrase
- no broken assumptions
- no pressure logic

### `primaryPathParagraph`

Good:

`The primary path remains continued hardening of the current condition. Constraint is likely to spread further through allocation and access before any visible relief changes behavior. That path narrows the low-cost repositioning window and rewards earlier moves toward controlled exposure and reversibility.`

Bad:

`The most likely path is that things will probably keep developing.`

Why bad fails:

- generic
- no state path
- no consequence

### `alternatePathParagraph`

Good:

`An alternate path opens only if coordination resumes in behavior rather than rhetoric. If cross-border flexibility is visibly restored, execution pressure can recede before the wider structure is repriced again. That path would widen decision room, but it is contingent rather than available by default.`

Bad:

`Another possibility is that the system could improve.`

Why bad fails:

- no alternate-state discriminator
- no causal condition
- no consequence

### `positioningParagraph1`

Good:

`Leadership should now revisit exposures that depend on cooperative clearance, low-friction access, or rapid normalization. The current condition rewards reversible commitments, selective concentration, and tighter trigger discipline. Commitments that assume broad coordination now carry avoidable downside.`

Bad:

`What matters most is remaining agile and considering strategic options.`

Why bad fails:

- banned phrase
- generic consulting language
- no concrete exposure logic

### `evidenceBase.items[].signal`

Good:

`Structural reclassification tightened cross-border constraint.`

Bad:

`Policy classification event.`

Why bad fails:

- taxonomy label only
- no system consequence

### `evidenceBase.items[].significance`

Good:

`Constraint moved from friction into enforceable boundary condition.`

Bad:

`This shows the category is important.`

Why bad fails:

- banned phrase
- no operating consequence
- no executive relevance
