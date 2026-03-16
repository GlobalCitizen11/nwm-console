import type { GraphLink, GraphNode, NarrativeEvent } from "../types";

const WIDTH = 820;
const HEIGHT = 420;

export const buildGraphLinks = (events: NarrativeEvent[]): GraphLink[] => {
  // Demo topology heuristic. A future relationship engine can replace this with provenance-aware structural link generation.
  const links: GraphLink[] = [];

  for (let leftIndex = 0; leftIndex < events.length; leftIndex += 1) {
    for (let rightIndex = leftIndex + 1; rightIndex < events.length; rightIndex += 1) {
      const left = events[leftIndex];
      const right = events[rightIndex];
      const sharedTags = left.domainTags.filter((tag) => right.domainTags.includes(tag));
      const monthDistance = Math.abs(left.month - right.month);
      if (sharedTags.length === 0 && monthDistance > 3) {
        continue;
      }

      links.push({
        source: left.id,
        target: right.id,
        strength: sharedTags.length * 2 + Math.max(0, 4 - monthDistance),
        rationale:
          sharedTags.length > 0
            ? `Shared domains: ${sharedTags.join(", ")}`
            : `Temporal proximity: ${monthDistance} months`,
      });
    }
  }

  return links;
};

export const buildNarrativeTopology = (events: NarrativeEvent[]): { nodes: GraphNode[]; links: GraphLink[] } => {
  const links = buildGraphLinks(events);
  const nodes: GraphNode[] = events.map((event, index) => ({
    id: event.id,
    x: 120 + ((index * 97) % 580),
    y: 70 + ((index * 67) % 260),
    event,
  }));
  const nodeMap = new Map(nodes.map((node) => [node.id, node]));

  for (let iteration = 0; iteration < 120; iteration += 1) {
    for (const node of nodes) {
      let forceX = 0;
      let forceY = 0;

      for (const other of nodes) {
        if (node.id === other.id) {
          continue;
        }
        const dx = node.x - other.x;
        const dy = node.y - other.y;
        const distanceSquared = Math.max(40, dx * dx + dy * dy);
        forceX += (dx / distanceSquared) * 520;
        forceY += (dy / distanceSquared) * 520;
      }

      for (const link of links) {
        if (link.source !== node.id && link.target !== node.id) {
          continue;
        }
        const otherId = link.source === node.id ? link.target : link.source;
        const other = nodeMap.get(otherId);
        if (!other) {
          continue;
        }
        const dx = other.x - node.x;
        const dy = other.y - node.y;
        forceX += dx * 0.0022 * link.strength;
        forceY += dy * 0.0022 * link.strength;
      }

      node.x = Math.max(40, Math.min(WIDTH - 40, Number((node.x + forceX).toFixed(3))));
      node.y = Math.max(40, Math.min(HEIGHT - 40, Number((node.y + forceY).toFixed(3))));
    }
  }

  return { nodes, links };
};
