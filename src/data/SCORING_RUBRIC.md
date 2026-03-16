# Real-World Event Scoring Rubric

Use this rubric when converting real-world artifacts into `NarrativeEvent` rows for NWM Console. The goal is consistency and auditability, not pseudo-precision.

## Event inclusion rule

Only include artifacts that clearly belong inside the bounded world definition. If the event is materially outside the world boundary, omit it.

## Structural effect

- `reinforce`
  - The event stabilizes or affirms the current narrative structure.
- `destabilize`
  - The event increases pressure, uncertainty, or structural strain without formally changing classification logic.
- `reclassify`
  - The event changes how the system should classify the world, typically by adding formal policy, legal, market, or infrastructure structure.

## Metric scoring

All scores are `0-100`.

### Velocity

How quickly the event injects pressure into the bounded world.

- `0-25`
  - Slow-moving or low-salience event with limited immediate carry-through.
- `26-50`
  - Moderate event likely to affect discussion or monitoring in the near term.
- `51-75`
  - Fast-moving event that meaningfully changes operator attention within one adjudication window.
- `76-100`
  - Immediate and high-salience event that materially changes near-term operating posture.

### Density

How much structural weight the event adds to the world. Density rises when the event connects to existing pressure rather than standing alone.

- `0-25`
  - Isolated, weakly connected event.
- `26-50`
  - Event reinforces a known topic cluster but does not create heavy structural accumulation.
- `51-75`
  - Event clearly adds to an already-developing structure and should be treated as cumulative evidence.
- `76-100`
  - Event materially thickens an existing regime narrative and strongly supports reclassification.

### Coherence

How strongly the event aligns with an already-legible structural story inside the world boundary.

- `0-25`
  - Confused or weakly aligned signal.
- `26-50`
  - Partial fit with the emerging world story.
- `51-75`
  - Strong alignment with an already-legible structural direction.
- `76-100`
  - Very strong alignment with a formalized or hardened world narrative.

### Reversibility

How easy it is for the system to revert after this event.

- `76-100`
  - Easily reversible; soft signal, rumor, or non-binding position.
- `51-75`
  - Reversible but not frictionless; moderate institutional stickiness.
- `26-50`
  - Hard to reverse; administrative or market structure consequences likely.
- `0-25`
  - Deeply sticky; legal, sovereign, contractual, or infrastructure-level lock-in.

## Practical heuristics

- Policy speech alone often raises `velocity` more than `density`.
- Formal law or enforcement often raises `density` and lowers `reversibility`.
- Market repricing often raises `density` because it embeds the narrative into operational constraints.
- Infrastructure restrictions often lower `reversibility` sharply.
- Sovereign doctrine or bloc language often increases `coherence` if it confirms an existing phase path.

## Recommended operating process

1. Confirm the event belongs inside the bounded world.
2. Assign `structuralEffect`.
3. Score the four metrics using this rubric.
4. Document why the event received those scores.
5. Load into the scenario dataset and inspect whether the resulting phase path is defensible.

## Governance note

These scores should be treated as documented analytic judgments inside a bounded model. They are not truth claims, belief inference, or automated decisions.
