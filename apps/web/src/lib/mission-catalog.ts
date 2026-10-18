import { medicineMission, watchMission, redemptionMission } from "./missions-rescue";
import { coverupMission, allianceMission, detectiveMission } from "./missions-politics";
import type { MissionDefinition, MissionId } from "./missions";
import { complicateMission } from "./mission-complications";

export const missions: Record<MissionId, MissionDefinition> = {
  medicine: complicateMission(medicineMission), watch: complicateMission(watchMission), coverup: complicateMission(coverupMission),
  redemption: complicateMission(redemptionMission), alliance: complicateMission(allianceMission), detective: complicateMission(detectiveMission),
};
