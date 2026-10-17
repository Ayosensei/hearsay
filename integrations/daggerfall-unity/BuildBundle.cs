using System;
using System.IO;
using UnityEditor;
using UnityEngine;

// Matches the game's Mod Builder: metadata plus a precompiled .dll.bytes TextAsset.
public static class HearsayBundleBuilder
{
    public static void Build()
    {
        string output = Environment.GetEnvironmentVariable("HEARSAY_DFMOD_OUTPUT");
        if (string.IsNullOrEmpty(output)) throw new InvalidOperationException("Missing output directory.");
        Directory.CreateDirectory(output);
        AssetDatabase.Refresh();
        var map = new AssetBundleBuild {
            assetBundleName = "hearsay.dfmod",
            assetNames = new[] { "Assets/Hearsay/hearsay.dfmod.json", "Assets/Hearsay/HearsayDfu.dll.bytes" }
        };
        var result = BuildPipeline.BuildAssetBundles(output, new[] { map },
            BuildAssetBundleOptions.ChunkBasedCompression, BuildTarget.StandaloneWindows);
        if (result == null) throw new InvalidOperationException("Asset bundle build failed.");
        // Reopen the actual bundle and check both loader inputs before reporting success.
        var bundle = AssetBundle.LoadFromFile(Path.Combine(output, "hearsay.dfmod"));
        if (bundle == null) throw new InvalidOperationException("Cannot reopen generated bundle.");
        try {
            var metadata = bundle.LoadAsset<TextAsset>("Assets/Hearsay/hearsay.dfmod.json");
            var assembly = bundle.LoadAsset<TextAsset>("Assets/Hearsay/HearsayDfu.dll.bytes");
            if (metadata == null || assembly == null || assembly.bytes.Length == 0)
                throw new InvalidOperationException("Bundle is missing mod metadata or assembly.");
            Debug.Log("HEARSAY_BUNDLE_VERIFIED " + assembly.bytes.Length + " assembly bytes");
        } finally { bundle.Unload(true); }
    }
}
