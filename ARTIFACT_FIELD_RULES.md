# ARTIFACT_FIELD_RULES.md

## Purpose
This repo uses artifact-specific field packs to prevent generic summary content from leaking across outputs.

Each artifact must declare:
- what fields belong in it
- where each field renders
- how long each field can be
- what tone the field should use
- what render style the field should use
- what happens if the field is missing or too long

The system supports three artifact families:
- Board One-Pager
- Executive Brief
- Presentation Brief

## Shared Field Metadata
Every artifact field uses `FieldRule<T>` metadata with:
- `required`
- `maxWords`
- `minWords`
- `minItems`
- `maxItems`
- `tone`
- `renderStyle`
- `placement`
- `fallback`

## Board One-Pager
Optimize for:
- speed
- compression
- decision clarity
- one-page density

Current integration order:
- board one-pager first
- executive brief next
- presentation brief last

Required field groups:
- `header`
- `stateBand`
- `boardRead`
- `decisionBox`
- `dominantPath`
- `primaryPressure`
- `riskConcentration`
- `inflectionPaths`
- `triggers`
- `evidenceSignals`
- `signalGrid`

Board fail conditions:
- decision box is weak or missing
- signal grid is missing
- triggers are observational instead of state-shifting
- evidence reads like labels
- content exceeds one-page budget
- field validation does not identify the failing section path

### Board Field Examples

`boardRead.headline`
- Good: `Fragmentation is now operational.`
- Bad: `The system is currently in a fragmented regime.`
- Why bad fails: too descriptive, too slow, and sounds like system narration instead of a board read.

`boardRead.summary`
- Good: `Plans built on coordination now carry execution risk.`
- Bad: `Visibility is needed on whether coordination begins to change.`
- Why bad fails: vague, delayed, and does not tell leadership what changed in decision terms.

`decisionBox.actions`
- Good: `Strip coordinated-response assumptions from capital plans.`
- Bad: `Maintain awareness of coordination trends.`
- Why bad fails: passive, non-directive, and too generic to change board posture.

`dominantPath.statement`
- Good: `Fragmentation deepens unless coordination reopens.`
- Bad: `The dominant path remains one of fragmentation.`
- Why bad fails: templated construction and weak directional force.

`primaryPressure.statement`
- Good: `Alliance coordination is breaking under constraint. Misalignment now reprices risk.`
- Bad: `Pressure is concentrated in alliance coordination.`
- Why bad fails: names a category but not the mechanism or consequence.

`riskConcentration.items`
- Good: `Infrastructure chokepoints under sovereign leverage.`
- Bad: `Infrastructure remains an area to watch.`
- Why bad fails: observational and non-specific; it does not name where risk actually pools.

`inflectionPaths.continuation`
- Good: `Allocation control widens. Fragmentation grows harder to reverse.`
- Bad: `The current trend likely continues.`
- Why bad fails: generic continuation language with no system consequence.

`inflectionPaths.reversal`
- Good: `Cross-border coordination resumes. Optionality returns first in access.`
- Bad: `Conditions could improve if coordination returns.`
- Why bad fails: hypothetical and soft; it does not define the first visible reversal effect.

`triggers.items`
- Good: `Trigger: Bloc-wide control easing reduces allocation pressure.`
- Bad: `Watch for allocation controls reversing.`
- Why bad fails: observational and vague; it does not define a concrete state shift.

`evidenceSignals.items`
- Good: `M11-0 — Structural reclassification tightened cross-border constraints.`
- Bad: `M11-0 — Structural Reclassification.`
- Why bad fails: label-only evidence with no institutional consequence.

`signalGrid.items[].implication`
- Good: `Plan for failed synchronization in critical windows.`
- Bad: `Coordination is becoming more difficult.`
- Why bad fails: descriptive and low-pressure; it does not convert signal into posture.

## Executive Brief
Optimize for:
- depth
- interpretation
- authored prose
- clear executive pacing

Required field groups:
- `cover`
- `systemState`
- `narrativeProgression`
- `structuralRead`
- `forwardView`
- `decisionPosture`
- `evidenceBase`

Executive fail conditions:
- page has no dominant insight
- sidebar restates body copy
- sections repeat without adding interpretation
- evidence feels appended instead of integrated

### Executive Field Examples

`systemState.summary`
- Good: `Fragmentation now sets the operating baseline for executive decisions.`
- Bad: `The current state is one of fragmentation across the system.`
- Why bad fails: generic, slow, and descriptive rather than directive.

`narrativeProgression.summary`
- Good: `The system moved from signal to behavior faster than institutions could stabilize it.`
- Bad: `Signals accumulated over time and changed the narrative.`
- Why bad fails: too abstract and does not explain why the sequence matters now.

`structuralRead.summary`
- Good: `The structural read now matters more than the narrative read because coordination failure transmits risk directly.`
- Bad: `This sequence has structural meaning for the system.`
- Why bad fails: empty analytic framing with no mechanism or consequence.

`forwardView.summary`
- Good: `Continuation remains the planning case until a visible interruption changes behavior.`
- Bad: `Looking ahead, the pattern may continue if current dynamics persist.`
- Why bad fails: templated and hypothetical; it does not define the operating base case.

`decisionPosture.summary`
- Good: `Decision posture should now optimize for resilience, timing discipline, and reversibility.`
- Bad: `Leadership should remain disciplined as the situation evolves.`
- Why bad fails: generic strategy filler with no concrete posture shift.

`sidebarInsight`
- Good: `Delay now raises switching costs across capital, access, and coordination.`
- Bad: `Fragmentation is now priced into operating decisions.`
- Why bad fails: too close to common body language and too broad to add a new angle.

`evidenceBase.items[].signal`
- Good: `Structural reclassification tightened cross-border constraints.`
- Bad: `Structural Reclassification.`
- Why bad fails: label-only evidence with no operational consequence.

`evidenceBase.items[].significance`
- Good: `This shifted the boundary condition from friction to active cross-border constraint.`
- Bad: `This is an important development for the system.`
- Why bad fails: generic significance language that does not explain what changed operationally.

## Presentation Brief
Optimize for:
- spoken delivery
- slide clarity
- one idea per slide
- fast scan speed

Required field groups:
- `slides[]`
- unique `title`
- `2–4` bullets
- optional `presenterNote`

Presentation fail conditions:
- slide feels report-native
- bullets exceed budget
- title repeats
- bullets are not speakable

### Presentation Field Examples

`slides[].title`
- Good: `What Leadership Changes Now`
- Bad: `Decision impact`
- Why bad fails: generic section-label language; it does not tell the presenter or audience what the slide actually resolves.

`slides[].bullets` for a key-signals slide
- Good:
  - `Narrative density remains high. Adjustment windows stay crowded.`
  - `Reversibility remains low. Early moves retain more optionality.`
- Bad:
  - `Narrative density is high.`
  - `Reversibility is low.`
- Why bad fails: descriptive only; it names state but does not convert state into consequence.

`slides[].bullets` for a dominant-path slide
- Good:
  - `Fragmentation is now the priced-in operating baseline.`
  - `Plans built on rapid normalization now misprice exposure.`
- Bad:
  - `The dominant path remains fragmentation.`
  - `Normalization may not return quickly.`
- Why bad fails: generic and low-pressure; it does not tell leadership what becomes misaligned now.

`slides[].bullets` for a pressure-stack slide
- Good:
  - `Systemic uptake spread response costs across domains.`
  - `Recent developments forced planning through the condition.`
- Bad:
  - `Signals accumulated over time.`
  - `Things became more difficult.`
- Why bad fails: vague sequence language with no operational consequence.

`slides[].bullets` for a risk-concentration slide
- Good:
  - `Cross-border dependencies absorb the first operational shock.`
  - `Infrastructure bottlenecks compound risk before markets fully adjust.`
- Bad:
  - `Risk appears in several areas.`
  - `Infrastructure remains important.`
- Why bad fails: non-specific and too broad to support a decision conversation.

`slides[].bullets` for an inflection-paths slide
- Good:
  - `Continuation hardens if allocation controls widen further.`
  - `Reversal starts only when coordination reopens in behavior.`
- Bad:
  - `The situation could continue or reverse.`
  - `We need to watch for changes.`
- Why bad fails: it describes possibilities without defining the state shifts that matter.

`slides[].bullets` for a decision slide
- Good:
  - `Remove coordination-dependent assumptions from active plans.`
  - `Prioritize control over timing where exposure is hard to reverse.`
- Bad:
  - `Leaders should remain aware and flexible.`
  - `Decision-makers may need to adapt.`
- Why bad fails: generic strategy filler with no direct posture change.

## Deterministic Rendering Rule
Artifact renderers must consume artifact-specific field packs, not generic shared summaries.

That means:
- board renderers consume `BoardOnePagerSpec`-driven field packs
- executive renderers consume `ExecutiveBriefSpec`-driven field packs
- presentation renderers consume `PresentationBriefSpec`-driven field packs

## Validation Rule
Validation must check:
- required fields
- word budgets
- item counts
- artifact-specific fail conditions
- render suitability for the target artifact

If a field pack fails its artifact rules, the artifact is not ready for export.
