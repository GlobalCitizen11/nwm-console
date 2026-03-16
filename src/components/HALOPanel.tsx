import type { HaloOrientation } from "../types";
import { SectionAudioControl } from "./SectionAudioControl";

interface HALOPanelProps {
  halo: HaloOrientation;
  phase: string;
  ringCount: number;
  worldBoundaryContext: string;
}

const meter = (value: number) => `${Math.min(100, Math.max(0, value))}%`;

export function HALOPanel({ halo, phase, ringCount, worldBoundaryContext }: HALOPanelProps) {
  const pulseDuration = `${Math.max(4.8, 9.2 - halo.momentum / 18)}s`;
  const ringDuration = `${Math.max(3.6, 7.4 - halo.instability / 20)}s`;
  const ambientOpacity = 0.18 + halo.instability / 180;
  const ringOpacity = 0.24 + halo.instability / 160;
  const glowStrength = 14 + halo.instability / 4;
  const panelLift = halo.instability >= 70 ? 1.03 : halo.instability >= 50 ? 1.02 : 1.01;
  const dotScale = halo.instability >= 70 ? 1.08 : halo.instability >= 50 ? 1.05 : 1.03;

  const instabilityInterpretation =
    halo.instability >= 70
      ? "The section is currently signaling elevated instability and potential need for near-term review."
      : halo.instability >= 50
        ? "The section is currently signaling moderate instability with growing structural pressure."
        : "The section is currently signaling a comparatively contained instability profile.";

  const momentumInterpretation =
    halo.momentum >= 70
      ? "Momentum is high, which suggests the current narrative structure is still actively moving."
      : halo.momentum >= 45
        ? "Momentum is moderate, which suggests the structure is still changing but not at maximum speed."
        : "Momentum is relatively low, which suggests less immediate directional movement.";

  return (
    <section className="surface-panel relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-x-0 top-0 h-20"
        style={{
          background: `radial-gradient(circle at 16% 26%, ${halo.dominantOrientationColor}${Math.round(
            ambientOpacity * 255,
          )
            .toString(16)
            .padStart(2, "0")}, transparent 56%)`,
          animation: `halo-breathe ${pulseDuration} ease-in-out infinite`,
          transform: `scale(${panelLift})`,
        }}
      />
      <div className="mb-4 flex items-start justify-between">
        <div>
          <p className="section-kicker">HALO Orientation</p>
          <h3 className="section-title">{phase}</h3>
          <p className="mt-2 max-w-2xl text-sm leading-6 text-muted">
            Orientation layer for state, pressure, motion, and structural support. The motion is intentionally slow and ambient.
          </p>
        </div>
        <div className="flex items-center gap-3">
          <SectionAudioControl
            sectionTitle="HALO Orientation"
            worldBoundaryContext={worldBoundaryContext}
            summary="This HALO section summarizes state, pressure, motion, and structural support for the current narrative world."
            currentState={`The section is currently representing the ${phase} phase. Momentum is ${halo.momentum}, emergence ratio is ${halo.emergenceRatio}, evidentiary mass is ${halo.evidentiaryMass}, ring count is ${ringCount}, and instability is ${halo.instability}. ${momentumInterpretation} ${instabilityInterpretation}`}
            businessUse="A firm can use this section as an orientation signal to judge whether monitoring can remain routine or whether leadership review should become more active."
            decisionGuidance="If instability stays elevated while momentum remains high, this panel supports bringing forward human review, escalation discussion, or a request for more supporting evidence."
            rawContext={[
              `Phase: ${phase}`,
              `Dominant orientation color: ${halo.dominantOrientationColor}`,
              `Momentum: ${halo.momentum}`,
              `Emergence ratio: ${halo.emergenceRatio}`,
              `Evidentiary mass: ${halo.evidentiaryMass}`,
              `Ring count: ${ringCount}`,
              `Instability: ${halo.instability}`,
            ]}
          />
          <span className="relative inline-flex h-8 w-8 items-center justify-center">
            <span
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: `${halo.dominantOrientationColor}${Math.round(ringOpacity * 255)
                  .toString(16)
                  .padStart(2, "0")}`,
                animation: `halo-ring ${ringDuration} ease-out infinite`,
              }}
            />
            <span
              className="absolute inset-0 rounded-full border"
              style={{
                borderColor: `${halo.dominantOrientationColor}${Math.round((ringOpacity * 0.7) * 255)
                  .toString(16)
                  .padStart(2, "0")}`,
                animation: `halo-ring ${ringDuration} ease-out infinite`,
                animationDelay: `${Number.parseFloat(ringDuration) / 2}s`,
              }}
            />
            <span
              className="relative h-3 w-3 rounded-full border border-white/15"
              style={{
                backgroundColor: halo.dominantOrientationColor,
                boxShadow: `0 0 ${glowStrength}px ${halo.dominantOrientationColor}${Math.round(
                  (0.22 + halo.instability / 220) * 255,
                )
                  .toString(16)
                  .padStart(2, "0")}`,
                animation: `halo-breathe ${pulseDuration} ease-in-out infinite`,
                transform: `scale(${dotScale})`,
              }}
            />
          </span>
          <p className="text-xs uppercase tracking-[0.18em] text-muted">Orientation only</p>
        </div>
      </div>

      <div className="grid gap-3 md:grid-cols-2">
        {[
          ["Momentum", halo.momentum],
          ["Emergence ratio", halo.emergenceRatio],
          ["Evidentiary mass", halo.evidentiaryMass],
          ["Ring count", ringCount],
          ["Instability", halo.instability],
        ].map(([label, value]) => (
          <div key={label} className="rounded-sm border border-edge/80 bg-shell/60 p-3">
            <div className="mb-2 flex items-center justify-between">
              <p className="text-xs uppercase tracking-[0.18em] text-muted">{label}</p>
              <p className="text-sm font-medium text-ink">{value}</p>
            </div>
            <div className="h-2 rounded-full bg-edge/80">
              <div
                className="h-full rounded-full"
                style={{
                  width: meter(Number(value)),
                  backgroundColor: halo.dominantOrientationColor,
                  animation: `halo-bar ${pulseDuration} ease-in-out infinite`,
                }}
              />
            </div>
          </div>
        ))}
      </div>

      <p className="mt-4 text-sm leading-6 text-muted">
        HALO exposes state, pressure, motion, and structural support. It does not classify truth,
        infer belief, or authorize action.
      </p>
    </section>
  );
}
