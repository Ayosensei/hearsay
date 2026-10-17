# Temporary G3 seed

`hollowbrook.json` is the three-NPC bootstrap explicitly allowed by Goodness task G3 while DuroT's D1 content is pending. It includes Brom, Mira and Garrick with their locked traits and applicable trust edges. It is synthetic and is not the completed six-NPC demo world.

DuroT can replace this file with the full seed described in `docs/shared/03-graph-model.md` without changing the loader. The loader validates every relation reference, duplicate IDs/edges, trait ranges, policy bounds and required template states before writing anything.

Existing templates/player graphs are not silently migrated when this file changes. A fresh template deployment or an explicit migration is needed to publish new world content; player saves remain isolated copies.
