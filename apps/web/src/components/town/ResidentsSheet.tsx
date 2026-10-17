"use client";
import { useState } from "react";
import { Button } from "../ui/button";
import { Input } from "../ui/input";
import { districts, districtOf } from "../../lib/town-residents";
import type { NPC } from "../../lib/types";

export function ResidentsSheet({ npcs, onSelect }: { npcs: NPC[]; onSelect: (id: string) => void }) {
  const [search, setSearch] = useState("");
  const found = npcs.filter((npc) => `${npc.name} ${npc.role}`.toLowerCase().includes(search.toLowerCase()));
  return <div className="space-y-5">
    <p>{npcs.length} lives, connected by family, work and trust. Choose someone to meet.</p>
    <Input aria-label="Find a villager" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Name or occupation…" />
    {Object.entries(districts).map(([id, district]) => <section key={id} className="space-y-2">
      <h3 className="font-serif text-2xl">{district.name}</h3>
      {found.filter((npc) => districtOf(npc.id) === id).map((npc) => <Button key={npc.id} variant="secondary" className="resident-entry" onClick={() => onSelect(npc.id)}>
        <strong>{npc.name}</strong><span>{npc.role}</span><small>{npc.attitude}</small>
      </Button>)}
    </section>)}
    {!found.length && <p>No villagers match that search.</p>}
  </div>;
}
