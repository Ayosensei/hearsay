import { z } from "zod";
import { NpcId, Unit } from "@hearsay/contract";
import type { ToolOutput } from "@hearsay/contract";
import { WorldFailure } from "./world-operation";
import type { WorldScope } from "./world-operation";
import * as q from "./queries/opinion";

const Knowledge = z.object({
  npcId: NpcId,
  name: z.string(),
  via: z.string(),
  root: NpcId,
  hop: z.number().int().min(0),
  confidence: Unit,
});
type Knowledge = z.infer<typeof Knowledge>;
const Path = z.object({
  ids: z.array(NpcId),
  names: z.array(z.string()),
  confidences: z.array(Unit),
});
type Path = z.infer<typeof Path>;
function inconsistent(): never {
  throw new WorldFailure({
    code: "INTERNAL",
    message: "Knowledge provenance is incomplete or inconsistent.",
  });
}
async function readKnowledge(
  scope: WorldScope,
  graph: string,
  nid: string,
  eid: string,
) {
  const rows = await scope.ro(graph, "Q60_explain_knows", q.Q60_explain_knows, {
    nid,
    eid,
  });
  if (rows.length > 1) inconsistent();
  return rows.length ? Knowledge.parse(rows[0]) : undefined;
}

async function walkVia(
  scope: WorldScope,
  graph: string,
  eid: string,
  known: Knowledge,
): Promise<Path> {
  const reversed = [known];
  const visited = new Set([known.npcId]);
  let current = known;
  while (current.hop > 0) {
    const parent = await readKnowledge(scope, graph, current.via, eid);
    if (
      !parent ||
      visited.has(parent.npcId) ||
      parent.root !== known.root ||
      parent.hop !== current.hop - 1
    )
      inconsistent();
    const links = await scope.ro(
      graph,
      "Q62_explain_link",
      q.Q62_explain_link,
      { from: parent.npcId, to: current.npcId, eid, root: known.root },
    );
    if (
      links.length !== 1 ||
      Math.abs(Unit.parse(links[0]?.confidence) - current.confidence) > 1e-9
    )
      inconsistent();
    visited.add(parent.npcId);
    reversed.push(parent);
    current = parent;
  }
  if (current.npcId !== known.root || current.via !== "witness") inconsistent();
  const chain = reversed.reverse();
  return {
    ids: chain.map((n) => n.npcId),
    names: chain.map((n) => n.name),
    confidences: chain.slice(1).map((n) => n.confidence),
  };
}

export async function explainKnowledge(
  scope: WorldScope,
  graph: string,
  nid: string,
  eid: string,
): Promise<ToolOutput<"explain">> {
  const known = await readKnowledge(scope, graph, nid, eid);
  if (!known)
    return {
      status: "not_in_graph",
      learnedFrom: null,
      chain: [],
      hopConfidences: [],
      edgeIds: [],
    };
  let path: Path;
  if (known.hop === 0) {
    if (known.root !== nid || known.via !== "witness") inconsistent();
    path = { ids: [nid], names: [known.name], confidences: [] };
  } else {
    const rows = await scope.ro(
      graph,
      "Q61_explain_chain",
      q.Q61_explain_chain,
      { root: known.root, nid, eid },
    );
    // advanceTime can produce paths deeper than Q61's four-hop bound.
    path = rows.length
      ? Path.parse(rows[0])
      : await walkVia(scope, graph, eid, known);
    if (
      path.ids.length !== known.hop + 1 ||
      path.names.length !== path.ids.length ||
      path.confidences.length !== known.hop ||
      path.ids[0] !== known.root ||
      path.ids.at(-1) !== nid ||
      path.ids.at(-2) !== known.via ||
      Math.abs((path.confidences.at(-1) ?? -1) - known.confidence) > 1e-9
    )
      inconsistent();
  }
  const edgeIds = path.ids
    .slice(1)
    .map((to, index) => `TOLD:NPC:${path.ids[index]}->NPC:${to}:${eid}`);
  edgeIds.push(`KNOWS:NPC:${nid}->Event:${eid}:${eid}`);
  return {
    status: "known",
    learnedFrom: known.via,
    chain: path.ids.map((npcId, index) => ({
      npcId,
      name: path.names[index] ?? "",
    })),
    hopConfidences: path.confidences,
    edgeIds,
  };
}
