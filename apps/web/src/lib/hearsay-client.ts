import {
  TownState,
  ToolEnvelope,
  ProvenanceChain,
  DialogueMessage,
} from "./types";
import { getInitialTownState } from "./mock-data";
import { advanceSimulationTick, recordPlayerAction, sendMockDialogue } from "./mock-engine";

export interface IHearsayClient {
  getTownState(): Promise<ToolEnvelope<TownState>>;
  advanceTime(currentState: TownState): Promise<ToolEnvelope<TownState>>;
  sendMessage(
    npcId: string,
    message: string,
    currentState: TownState
  ): Promise<ToolEnvelope<{ message: DialogueMessage; updatedState: TownState }>>;
  explainProvenance(
    npcId: string,
    eventId: string,
    currentState: TownState
  ): Promise<ToolEnvelope<ProvenanceChain | undefined>>;
  recordAction(
    actionTitle: string,
    actionType: "harm" | "help",
    witnessNpcId: string,
    placeName: string,
    currentState: TownState
  ): Promise<ToolEnvelope<TownState>>;
}

/**
 * MockHearsayClient:
 * Simulates FalkorDB graph traversal and LLM dialogue locally using synthetic fixtures.
 * Adheres strictly to the AGENTS.md envelope: { ok: true, data, trace } or { ok: false, error }
 */
export class MockHearsayClient implements IHearsayClient {
  async getTownState(): Promise<ToolEnvelope<TownState>> {
    const state = getInitialTownState();
    return {
      ok: true,
      data: state,
      trace: state.recentTraces,
    };
  }

  async advanceTime(currentState: TownState): Promise<ToolEnvelope<TownState>> {
    // Artificial small delay to simulate network/query execution
    await new Promise((resolve) => setTimeout(resolve, 80));
    return advanceSimulationTick(currentState);
  }

  async sendMessage(
    npcId: string,
    message: string,
    currentState: TownState
  ): Promise<ToolEnvelope<{ message: DialogueMessage; updatedState: TownState }>> {
    await new Promise((resolve) => setTimeout(resolve, 120));
    return sendMockDialogue(npcId, message, currentState);
  }

  async explainProvenance(
    npcId: string,
    eventId: string,
    currentState: TownState
  ): Promise<ToolEnvelope<ProvenanceChain | undefined>> {
    const npc = currentState.npcs.find((n) => n.id === npcId);
    if (!npc) {
      return {
        ok: false,
        error: { code: "UNKNOWN_NPC", message: `NPC "${npcId}" does not exist in graph.` },
      };
    }

    const provenance = currentState.activeProvenance;
    return {
      ok: true,
      data: provenance,
      trace: [
        {
          agent: "scribe",
          tool: "explain_path",
          queryId: "Q12_explain_provenance",
          args: { npc_id: npcId, event_id: eventId },
          rows: provenance?.hopCount || 1,
          ms: 1.8,
        },
      ],
    };
  }

  async recordAction(
    actionTitle: string,
    actionType: "harm" | "help",
    witnessNpcId: string,
    placeName: string,
    currentState: TownState
  ): Promise<ToolEnvelope<TownState>> {
    await new Promise((resolve) => setTimeout(resolve, 100));
    return recordPlayerAction(actionTitle, actionType, witnessNpcId, placeName, currentState);
  }
}

// Singleton export based on env (mock mode by default)
export const hearsayClient: IHearsayClient = new MockHearsayClient();
