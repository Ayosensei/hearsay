using System;
using System.IO;
using UnityEngine;
using DaggerfallWorkshop.Game;

namespace HearsayDfu
{
    [Serializable]
    public class Binding
    {
        public string slot;
        public string key;
        public string name;
    }

    [Serializable]
    public class Profile
    {
        public string playerId = "dfu_" + Guid.NewGuid().ToString("N");
        public string apiKey = "";
        public bool worldPrepared;
        public Binding[] bindings = new Binding[] {
            new Binding { slot = "brom" }, new Binding { slot = "mira" }, new Binding { slot = "garrick" }
        };

        public static string FilePath
        {
            get { return Path.Combine(Application.persistentDataPath, "Hearsay", "profile.json"); }
        }

        public static Profile Load()
        {
            Profile profile = File.Exists(FilePath) ? JsonUtility.FromJson<Profile>(File.ReadAllText(FilePath)) : new Profile();
            if (profile == null || profile.bindings == null || profile.bindings.Length != 3)
                throw new InvalidDataException("Invalid Hearsay profile.");
            profile.Save();
            return profile;
        }

        public void Save()
        {
            Directory.CreateDirectory(Path.GetDirectoryName(FilePath));
            File.WriteAllText(FilePath, JsonUtility.ToJson(this, true));
        }

        public static string Key(StaticNPC npc)
        {
            StaticNPC.NPCData d = npc.Data;
            return d.mapID + ":" + d.buildingKey + ":" + d.nameSeed + ":" + d.hash;
        }

        public Binding Find(StaticNPC npc)
        {
            if (npc == null) return null;
            string key = Key(npc);
            return Array.Find(bindings, binding => binding.key == key);
        }
    }
}
