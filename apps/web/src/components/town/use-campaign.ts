"use client";
import { useEffect, useState } from "react";
import { emptyCampaign, readCampaign, saveCampaign } from "../../lib/campaign";
import type { ScenarioId } from "../../lib/scenarios";

export function useCampaign() {
  const [progress, setProgress] = useState(emptyCampaign);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    const update = () => { setProgress(readCampaign()); setReady(true); };
    update(); window.addEventListener("storage", update); window.addEventListener("hearsay-campaign", update);
    return () => { window.removeEventListener("storage", update); window.removeEventListener("hearsay-campaign", update); };
  }, []);
  return { progress, ready,
    completeDemo: () => saveCampaign({ ...readCampaign(), demo: true }),
    completeLevel: (id: ScenarioId) => {
      const saved = readCampaign();
      if (!saved.completed.includes(id)) saveCampaign({ ...saved, completed: [...saved.completed, id] });
    },
  };
}
