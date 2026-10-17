# Daggerfall Unity integration test

Status: official game/data files are prepared locally; the Hearsay mod has not yet run inside the game. Unity Editor is required to build the game's standard `.dfmod` asset bundle. This is separate from DuroT's website and does not depend on npm publication.

## Prerequisites found on this machine

- Official Windows x64 game release: `v1.1.1-cve-2025`, 50,240,819-byte archive.
- Classic data: `DaggerfallGameFiles.zip` linked by the project's official cross-platform installation guide, 152,372,819-byte archive. Both archives extracted successfully; `arena2/MAPS.BSA` is present.
- Local setup root: `C:/Users/DELL/Documents/Codex/work/daggerfall-unity-test`.
- Game executable: `game/DaggerfallUnity.exe` under that root.
- Classic data folder: `classic-data` under that root.
- Unity Hub 3.22.3 and Editor 2019.4.41f2 are now present. Hub shows an active Personal license, but the Editor installation is incomplete: `Data/Resources/PackageManager/Server/UnityPackageManager.exe` and `Data/Tools/nodejs/node.exe` are missing. A batch launch also reports no valid license. Hub launch reaches project initialization and reports the missing Package Manager. Repair the Editor before claiming it is usable.
- The game's `ProjectSettings/ProjectVersion.txt` specifies **2019.4.41f2**, revision **6b23d448b533**. Use that version, not a new Unity major version.

Install Unity Hub and sign in, then install that Editor without optional platforms or Visual Studio for this test. Keep the game files and source checkout outside the Hearsay repository. Third-party game assets are not redistributed with Hearsay.

## Source inspection

The official `ModManager` loads `.dfmod` asset bundles. Its loose-source/virtual-mod path is guarded by `UNITY_EDITOR`, so copying C# files into a shipped game's Mods folder is insufficient.

The game exposes `PlayerEntity.OnCrimeUpdate` with its crime enum, `TalkManager.StaticNPC`/`NameNPC` and stable static-NPC layout fields. These support a small adapter: bind a few actual static NPCs to a controlled Hearsay graph, translate supported reported crimes into events, and show graph-backed replies for those NPCs. Bindings and the test trust network must be distinguished from the game's native social simulation. No fabricated theft button should be presented as automatic game-event capture.

The Hearsay HTTP bridge already supports local native clients with bearer authentication. It keeps database credentials on the backend. Live Gemini generation is not required; template replies suffice for the first test.

## Compile evidence

The initial profile/HTTP transport helpers compile as C# 5 against the actual release's managed assemblies using Windows' C# compiler. Run `check-compile.ps1 -GameDirectory <game-folder> -OutputDirectory <outside-repo-folder>` to reproduce. `/noconfig` prevents framework response-file references from colliding with the game's own System assemblies. This check does not build a `.dfmod`, invoke Unity's importer or prove an in-game interaction. Those remain separate runtime checks.

## Reproducible bundle build

Run `build-bundle.ps1 -GameDirectory <game-folder> -BuildDirectory <outside-repo-folder>`. It creates an isolated Unity project, compiles the adapter against the actual game's assemblies, and packages the `.dll.bytes` TextAsset and `.dfmod.json` metadata with Unity's `BuildPipeline.BuildAssetBundles`. This matches the precompiled bundle layout read by the official loader; it does not modify the downloaded game source project. The build then reopens its bundle and checks both assets. The script rejects incomplete Editor installations and limits a stalled build to five minutes.

`BuildBundle.cs` compiles against the installed Editor's `UnityEditor.dll` and `UnityEngine.dll`. This is compile evidence only. The current build is blocked before asset import by the installation/licensing errors above; no `.dfmod` success or in-game test is claimed.

## Bind game NPCs and prepare the backend

After installing `bundle/hearsay.dfmod` into `game/DaggerfallUnity_Data/StreamingAssets/Mods`, enable the mod in the launcher. Select `classic-data` as the game data folder. Open dialogue with three different static indoor NPCs and press F8; bind one to each slot. The slot IDs are opaque adapter IDs; their display names come from the actual game NPCs.

The mod writes `Hearsay/profile.json` under the game's Unity persistent data directory (normally `%USERPROFILE%/AppData/LocalLow/Daggerfall Workshop/Daggerfall Unity`). Do not share or commit that profile after preparation: it contains the local HTTP bearer key.

From this repository run:

```powershell
pnpm exec tsx integrations/daggerfall-unity/prepare.mts '<profile.json>' '<outside-repo-backend-directory>'
# Optional third argument: a private env file holding FalkorDB connection settings.
pnpm cli doctor --project '<outside-repo-backend-directory>'
pnpm cli serve --project '<outside-repo-backend-directory>'
```

Preparation validates three distinct bindings before writing. It creates a separate seed with the captured names, generic resident traits and a controlled two-edge trust chain (second trusts first at 0.9; third trusts second at 0.7), not native Daggerfall relationships. It keeps the HTTP key private and leaves the production seed unchanged. It makes no database calls. Reload settings in the F8 panel after starting the backend. The game visibility rule uses bound, loaded static NPCs within ten Unity units and a clear linecast; it is not the native game's witness list. Crime capture ignores reports without a bound visible witness and caps event subjects at the contract's 60 characters.

This initial profile is per test installation, not per native Daggerfall save. Use one character for the experiment. Dialogue uses template fallback with the default `HEARSAY_LLM=off`; live Gemini is a separate check. Only the adapter's Hearsay panel uses its memory; vanilla quests and NPC dialogue remain native.

Checks: `pnpm exec tsx --test integrations/daggerfall-unity/prepare.test.mts` and `pnpm exec tsc --noEmit --module esnext --moduleResolution bundler --target es2022 --strict --esModuleInterop --skipLibCheck --allowImportingTsExtensions integrations/daggerfall-unity/prepare.mts integrations/daggerfall-unity/prepare.test.mts`. The preparation tests use explicitly synthetic binding names and no database; actual core integration tests require a live FalkorDB.

## Live backend smoke evidence

`backend-smoke.mts` passed against live FalkorDB through an actual local HTTP server on October 17, 2026. It checked bearer authentication (unauthenticated requests return 401), prepared NPC names, player creation, event recording, initial absence of knowledge, two gossip steps, recall at confidence 0.63, the Brom → Mira → Garrick explanation chain, and template dialogue grounded in that event. It removed and verified removal of its own unique player and template graphs afterward. The safe result is recorded in `docs/goodness/daggerfall-backend-results.json`.

Reproduce with `pnpm exec tsx integrations/daggerfall-unity/backend-smoke.mts <private-connection.env> <result.json>`. This deliberately uses synthetic NPC bindings and a synthetic event. It proves the backend path, not Unity crime capture, actual game bindings, bundle loading, or live Gemini generation. The full repository suite still needs its local Docker database.

## Sources

- [Official game repository](https://github.com/Interkarma/daggerfall-unity)
- [Official installation instructions and classic data link](https://github.com/Interkarma/daggerfall-unity/wiki/Installing-Daggerfall-Unity-Cross-Platform)
- [Official releases](https://github.com/Interkarma/daggerfall-unity/releases/tag/v1.1.1-cve-2025)
- [Pinned Editor version](https://raw.githubusercontent.com/Interkarma/daggerfall-unity/master/ProjectSettings/ProjectVersion.txt)
- [Unity 2019.4.41f2 installer](https://unity.com/releases/editor/whats-new/2019.4.41f2)
- [Game mod loader](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Game/Addons/ModSupport/ModManager.cs)
- [Game crime event](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Game/Entities/PlayerEntity.cs)
