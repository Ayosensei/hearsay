import { z } from "zod";
import { GraphNode, GraphEdge } from "@hearsay/contract";
import type { Row } from "./db";

const propsSchema = z.record(z.string(), z.unknown());
const nodeSchema = z.object({
  labels: z.array(z.string()),
  properties: propsSchema,
});
const edgeSchema = z.object({
  relationshipType: GraphEdge.shape.type,
  properties: propsSchema,
});

function kind(labels: string[]) {
  return GraphNode.shape.kind.parse(
    labels.find((label) => GraphNode.shape.kind.safeParse(label).success),
  );
}
function nodeId(labels: string[], id: unknown) {
  return `${kind(labels)}:${z.string().min(1).parse(id)}`;
}

// Application properties survive GRAPH.COPY; internal FalkorDB entity IDs do not define our API.
export function mapSnapshot(nodeRows: Row[], edgeRows: Row[]) {
  const nodes = nodeRows.map(({ n }) => {
    const { labels, properties: props } = nodeSchema.parse(n);
    return GraphNode.parse({
      id: nodeId(labels, props.id),
      kind: kind(labels),
      label: props.name ?? props.text ?? props.type ?? props.id,
      props,
    });
  });
  const edges = edgeRows.map((row) => {
    const { relationshipType: type, properties: props } = edgeSchema.parse(
      row.r,
    );
    const from = nodeId(z.array(z.string()).parse(row.fromLabels), row.fromId);
    const to = nodeId(z.array(z.string()).parse(row.toLabels), row.toId);
    const event =
      type === "KNOWS" ? row.toId : type === "TOLD" ? props.event : undefined;
    const suffix =
      type === "KNOWS" || type === "TOLD"
        ? `:${z.string().min(1).parse(event)}`
        : "";
    return GraphEdge.parse({
      id: `${type}:${from}->${to}${suffix}`,
      from,
      to,
      type,
      props,
    });
  });
  return { nodes, edges };
}
