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

## Sources

- [Official game repository](https://github.com/Interkarma/daggerfall-unity)
- [Official installation instructions and classic data link](https://github.com/Interkarma/daggerfall-unity/wiki/Installing-Daggerfall-Unity-Cross-Platform)
- [Official releases](https://github.com/Interkarma/daggerfall-unity/releases/tag/v1.1.1-cve-2025)
- [Pinned Editor version](https://raw.githubusercontent.com/Interkarma/daggerfall-unity/master/ProjectSettings/ProjectVersion.txt)
- [Unity 2019.4.41f2 installer](https://unity.com/releases/editor/whats-new/2019.4.41f2)
- [Game mod loader](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Game/Addons/ModSupport/ModManager.cs)
- [Game crime event](https://github.com/Interkarma/daggerfall-unity/blob/master/Assets/Scripts/Game/Entities/PlayerEntity.cs)
