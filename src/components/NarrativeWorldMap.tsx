import { useMemo, useState } from "react";
import type { NarrativeEvent } from "../types";
import { buildNarrativeTopology } from "../engine/topologyEngine";
import { SectionAudioControl } from "./SectionAudioControl";

interface NarrativeWorldMapProps {
  events: NarrativeEvent[];
  selectedEventId: string | null;
  onSelectEvent: (eventId: string) => void;
  worldBoundaryContext: string;
}

export function NarrativeWorldMap({
  events,
  selectedEventId,
  onSelectEvent,
  worldBoundaryContext,
}: NarrativeWorldMapProps) {
  const [phaseFilter, setPhaseFilter] = useState("all");
  const [domainFilter, setDomainFilter] = useState("all");
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [zoom, setZoom] = useState(1);
  const [offset, setOffset] = useState({ x: 0, y: 0 });
  const [dragOrigin, setDragOrigin] = useState<{ x: number; y: number } | null>(null);

  const domains = useMemo(
    () => Array.from(new Set(events.flatMap((event) => event.domainTags))).sort(),
    [events],
  );
  const filteredEvents = useMemo(
    () =>
      events.filter(
        (event) =>
          (phaseFilter === "all" || event.phase === phaseFilter) &&
          (domainFilter === "all" || event.domainTags.includes(domainFilter)),
      ),
    [events, phaseFilter, domainFilter],
  );
  const { nodes, links } = useMemo(() => buildNarrativeTopology(filteredEvents), [filteredEvents]);
  const hovered = nodes.find((node) => node.id === hoveredNodeId) ?? null;
  const selectedNode = nodes.find((node) => node.id === selectedEventId) ?? null;
  const strongestDomains = Array.from(
    filteredEvents.reduce((accumulator, event) => {
      event.domainTags.forEach((tag) => {
        accumulator.set(tag, (accumulator.get(tag) ?? 0) + 1);
      });
      return accumulator;
    }, new Map<string, number>()),
  )
    .sort((left, right) => right[1] - left[1])
    .slice(0, 3);

  return (
    <section className="surface-panel">
      <div className="mb-4 flex flex-col gap-3 xl:flex-row xl:items-center xl:justify-between">
        <div>
          <p className="section-kicker">Narrative World Map</p>
          <h3 className="section-title">Structural event topology</h3>
          <p className="mt-2 text-sm text-muted">
            Clustered events, influence links, and filter-aware topology for the bounded narrative world.
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <SectionAudioControl
            sectionTitle="Narrative World Map"
            worldBoundaryContext={worldBoundaryContext}
            summary="The narrative world map shows how events cluster and influence one another structurally."
            currentState={`The map is currently showing ${filteredEvents.length} nodes and ${links.length} structural links. The active phase filter is ${phaseFilter} and the active domain filter is ${domainFilter}. The selected node is ${selectedNode?.event.title ?? "none"}. ${hovered ? `The hovered node is ${hovered.event.title}.` : "No node is currently being hovered."}`}
            businessUse="A firm can use this section to identify concentration points, recurring domains, and where pressure is spreading through the environment."
            decisionGuidance="This supports better decisions about which issue clusters deserve earlier review, targeted monitoring, or governance attention."
            rawContext={[
              `Node count: ${filteredEvents.length}`,
              `Link count: ${links.length}`,
              `Phase filter: ${phaseFilter}`,
              `Domain filter: ${domainFilter}`,
              `Selected node: ${selectedNode?.event.title ?? "none"}`,
              `Hovered node: ${hovered?.event.title ?? "none"}`,
              `Visible node labels: ${nodes.map((node) => node.event.label).join(", ")}`,
            ]}
          />
          <select
            className="control-input"
            value={phaseFilter}
            onChange={(event) => setPhaseFilter(event.target.value)}
          >
            <option value="all">All phases</option>
            {Array.from(new Set(events.map((event) => event.phase))).map((phase) => (
              <option key={phase} value={phase}>
                {phase}
              </option>
            ))}
          </select>
          <select
            className="control-input"
            value={domainFilter}
            onChange={(event) => setDomainFilter(event.target.value)}
          >
            <option value="all">All domains</option>
            {domains.map((domain) => (
              <option key={domain} value={domain}>
                {domain}
              </option>
            ))}
          </select>
          <button className="action-button" onClick={() => setZoom((value) => Math.min(1.8, value + 0.1))}>
            Zoom In
          </button>
          <button className="action-button" onClick={() => setZoom((value) => Math.max(0.75, value - 0.1))}>
            Zoom Out
          </button>
          <button
            className="action-button"
            onClick={() => {
              setZoom(1);
              setOffset({ x: 0, y: 0 });
              setHoveredNodeId(null);
            }}
          >
            Reset View
          </button>
        </div>
      </div>

      <div className="grid gap-4 xl:grid-cols-[minmax(0,1fr)_300px]">
        <div className="overflow-hidden rounded-md border border-edge bg-shell/60">
        <svg
          viewBox="0 0 820 420"
          className="h-[26rem] w-full cursor-grab"
          onWheel={(event) => {
            event.preventDefault();
            setZoom((value) => Math.min(1.8, Math.max(0.75, value + (event.deltaY > 0 ? -0.06 : 0.06))));
          }}
          onMouseDown={(event) => setDragOrigin({ x: event.clientX - offset.x, y: event.clientY - offset.y })}
          onMouseMove={(event) => {
            if (!dragOrigin) {
              return;
            }
            setOffset({
              x: event.clientX - dragOrigin.x,
              y: event.clientY - dragOrigin.y,
            });
          }}
          onMouseUp={() => setDragOrigin(null)}
          onMouseLeave={() => setDragOrigin(null)}
        >
          <g transform={`translate(${offset.x} ${offset.y}) scale(${zoom})`}>
            {links.map((link) => {
              const source = nodes.find((node) => node.id === link.source);
              const target = nodes.find((node) => node.id === link.target);
              if (!source || !target) {
                return null;
              }
              return (
                <line
                  key={`${link.source}-${link.target}`}
                  x1={source.x}
                  y1={source.y}
                  x2={target.x}
                  y2={target.y}
                  stroke="#2a3646"
                  strokeWidth={Math.max(1, link.strength / 2.6)}
                  opacity={0.8}
                />
              );
            })}
            {nodes.map((node) => (
              <g
                key={node.id}
                transform={`translate(${node.x} ${node.y})`}
                onMouseEnter={() => setHoveredNodeId(node.id)}
                onMouseLeave={() => setHoveredNodeId(null)}
                onClick={() => onSelectEvent(node.id)}
                className="cursor-pointer"
              >
                <circle
                  r={selectedEventId === node.id ? 17 : hoveredNodeId === node.id ? 15 : 13}
                  fill={node.event.haloColor}
                  stroke={selectedEventId === node.id ? "#d7e0ea" : hoveredNodeId === node.id ? "#7f90a4" : "#0c1117"}
                  strokeWidth={selectedEventId === node.id ? 2.5 : hoveredNodeId === node.id ? 2 : 1.4}
                />
                <text
                  y={30}
                  textAnchor="middle"
                  fill="#d7e0ea"
                  fontSize="11"
                  style={{ textTransform: "uppercase", letterSpacing: "0.14em" }}
                >
                  {node.event.label}
                </text>
              </g>
            ))}
          </g>
        </svg>
        </div>
        <div className="space-y-4">
          <div className="surface-panel-subtle p-4 text-sm text-muted">
            <p className="section-kicker">Map guide</p>
            <p className="mt-3">Zoom with scroll or controls. Pan by dragging. Click a node to route to artifact detail.</p>
            <p className="mt-2">Selected nodes are bright-bordered. Hovered nodes lift slightly to show inspection focus.</p>
          </div>

          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Legend</p>
            <div className="mt-3 space-y-3 text-sm text-muted">
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-phaseYellow" />
                <span>Escalating contribution</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-phaseOrange" />
                <span>Escalation edge contribution</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-phaseRed" />
                <span>Structural reclassification contribution</span>
              </div>
              <div className="flex items-center gap-3">
                <span className="h-3 w-3 rounded-full bg-phaseViolet" />
                <span>Fragmented regime contribution</span>
              </div>
            </div>
          </div>

          <div className="surface-panel-subtle p-4">
            <p className="section-kicker">Pressure concentration</p>
            <div className="mt-3 space-y-2 text-sm text-muted">
              {strongestDomains.length > 0 ? (
                strongestDomains.map(([domain, count]) => (
                  <p key={domain}>
                    <span className="text-ink">{domain}</span> appears on {count} visible node{count === 1 ? "" : "s"}.
                  </p>
                ))
              ) : (
                <p>No concentrated domain cluster is visible under the current filters.</p>
              )}
            </div>
          </div>

          <div className="surface-panel-subtle p-4">
            {hovered || selectedNode ? (
              <div>
                <p className="section-kicker">{hovered ? "Hovered node" : "Selected node"}</p>
                <p className="mt-2 text-sm font-medium text-ink">{(hovered ?? selectedNode)?.event.title}</p>
                <p className="mt-2 text-sm leading-6 text-muted">{(hovered ?? selectedNode)?.event.description}</p>
                <p className="mt-3 text-sm text-ink">
                  {(hovered ?? selectedNode)?.event.sourceType} | Month {(hovered ?? selectedNode)?.event.month} | {(hovered ?? selectedNode)?.event.domainTags.join(", ")}
                </p>
              </div>
            ) : (
              <p className="text-sm text-muted">Hover or select a node to inspect its contribution and metadata.</p>
            )}
          </div>
        </div>
      </div>
    </section>
  );
}
