using System;
using System.Collections;
using System.Collections.Generic;
using UnityEngine;
using DaggerfallWorkshop.Game;
using DaggerfallWorkshop.Game.Entity;
using DaggerfallWorkshop.Game.UserInterface;
using DaggerfallWorkshop.Game.Utility.ModSupport;

namespace HearsayDfu
{
    public class HearsayMod : MonoBehaviour
    {
        class Pending { public string tool; public object input; }
        readonly Queue<Pending> pending = new Queue<Pending>();
        Profile profile;
        PlayerEntity player;
        bool visible, busy, playerReady;
        string status = "Bind three static NPCs, then run the backend preparation script.";
        string question = "What have you heard about me?";
        Rect window = new Rect(20, 20, 520, 460);

        [Invoke(StateManager.StateTypes.Start, 0)]
        public static void Init(InitParams parameters)
        {
            GameObject go = new GameObject("HearsayDfu");
            DontDestroyOnLoad(go);
            go.AddComponent<HearsayMod>();
            parameters.Mod.IsReady = true;
        }

        void Awake()
        {
            try { profile = Profile.Load(); }
            catch (Exception) { status = "Invalid private Hearsay profile. Check profile.json."; }
            Debug.Log("Hearsay adapter loaded. Open NPC dialogue, then press F8.");
        }

        void Update()
        {
            if (profile == null) return;
            DaggerfallEntityBehaviour behaviour = GameManager.Instance.PlayerEntityBehaviour;
            PlayerEntity current = behaviour == null ? null : behaviour.Entity as PlayerEntity;
            if (!ReferenceEquals(current, player))
            {
                if (player != null) player.OnCrimeUpdate -= OnCrime;
                player = current;
                if (player != null) player.OnCrimeUpdate += OnCrime;
            }
            bool talking = DaggerfallUI.UIManager.TopWindow is DaggerfallTalkWindow;
            if (!talking) visible = false;
            else if (Input.GetKeyDown(KeyCode.F8)) visible = !visible;
        }

        StaticNPC CurrentNpc()
        {
            TalkManager talk = GameManager.Instance.TalkManager;
            return talk.CurrentNPCType == TalkManager.NPCType.Static ? talk.StaticNPC : null;
        }

        void OnGUI()
        {
            if (visible && profile != null) window = GUILayout.Window(784142, window, Draw, "Hearsay — real game adapter test");
        }

        void Draw(int id)
        {
            StaticNPC npc = CurrentNpc();
            string name = GameManager.Instance.TalkManager.NameNPC;
            Binding bound = profile.Find(npc);
            GUILayout.Label("Current game NPC: " + (npc != null ? name : "choose a static indoor NPC"));
            GUILayout.Label("Test graph role: " + (bound == null ? "unbound" : bound.slot));
            GUILayout.Label("The three test trust links are configured by Hearsay, not Daggerfall's native AI.");
            GUI.enabled = !busy;
            if (!profile.worldPrepared && npc != null)
            {
                GUILayout.BeginHorizontal();
                foreach (Binding binding in profile.bindings)
                {
                    if (GUILayout.Button("Bind " + binding.slot))
                    {
                        Binding existing = profile.Find(npc);
                        if (existing != null && existing != binding) status = "This NPC is already bound to another role.";
                        else
                        {
                            binding.key = Profile.Key(npc);
                            binding.name = name;
                            profile.Save();
                            status = "Saved binding. Bind all three roles before preparing the backend.";
                        }
                    }
                }
                GUILayout.EndHorizontal();
            }
            if (GUILayout.Button("Reload prepared backend settings"))
            {
                try { profile = Profile.Load(); playerReady = false; status = "Settings reloaded."; }
                catch (Exception) { status = "Could not reload the private profile."; }
            }
            GUI.enabled = !busy && profile.worldPrepared && bound != null;
            question = GUILayout.TextField(question, 400);
            if (GUILayout.Button("Ask this NPC using Hearsay"))
                Enqueue("say", new SayInput { playerId = profile.playerId, npcId = bound.slot, text = question });
            if (GUILayout.Button("Inspect this NPC's actual graph memory"))
                Enqueue("recall", new SayInput { playerId = profile.playerId, npcId = bound.slot });
            GUI.enabled = !busy && profile.worldPrepared;
            if (GUILayout.Button("Advance one gossip step (test clock)"))
                Enqueue("advanceTime", new PlayerInput { playerId = profile.playerId });
            GUI.enabled = true;
            GUILayout.Label(status);
            if (GUILayout.Button("Close")) visible = false;
            GUI.DragWindow();
        }

        void OnCrime(PlayerEntity.Crimes crime)
        {
            if (!profile.worldPrepared) return;
            string type;
            if (crime == PlayerEntity.Crimes.Theft || crime == PlayerEntity.Crimes.Pickpocketing) type = "stole";
            else if (crime == PlayerEntity.Crimes.Assault || crime == PlayerEntity.Crimes.Murder) type = "attacked";
            else return; // None is also emitted by the game; it is not a new action.
            List<string> witnesses = new List<string>();
            Camera camera = Camera.main;
            if (camera != null)
            {
                foreach (StaticNPC npc in FindObjectsOfType<StaticNPC>())
                {
                    Binding binding = profile.Find(npc);
                    if (binding == null || Vector3.Distance(camera.transform.position, npc.transform.position) > 10f) continue;
                    RaycastHit hit;
                    Vector3 target = npc.transform.position + Vector3.up;
                    bool blocked = Physics.Linecast(camera.transform.position, target, out hit, Physics.DefaultRaycastLayers, QueryTriggerInteraction.Ignore);
                    if (!blocked || hit.transform == npc.transform || hit.transform.IsChildOf(npc.transform)) witnesses.Add(binding.slot);
                }
            }
            Enqueue("recordEvent", new EventInput {
                playerId = profile.playerId, type = type,
                subject = "reported " + crime + " in " + GameManager.Instance.PlayerGPS.CurrentLocation.Name,
                witnesses = witnesses.ToArray()
            });
        }

        void Enqueue(string tool, object input)
        {
            if (!profile.worldPrepared || profile.apiKey == null || profile.apiKey.Length < 24)
            { status = "Run prepare.mjs and reload settings before connecting."; return; }
            if (pending.Count >= 32) { status = "Adapter queue full; this action was not sent."; return; }
            pending.Enqueue(new Pending { tool = tool, input = input });
            if (!busy) StartCoroutine(Process());
        }

        IEnumerator Process()
        {
            busy = true;
            try
            {
                if (!playerReady)
                {
                    Envelope created = null;
                    yield return Transport.Call("newPlayer", new PlayerInput { playerId = profile.playerId }, profile.apiKey, result => created = result);
                    if (created == null || !created.ok)
                    { status = "Backend initialization failed; pending actions were not confirmed."; pending.Clear(); yield break; }
                    playerReady = true;
                }
                while (pending.Count > 0)
                {
                    Pending call = pending.Dequeue();
                    Envelope response = null;
                    yield return Transport.Call(call.tool, call.input, profile.apiKey, result => response = result);
                    if (response == null || !response.ok)
                    { status = "Request not confirmed: " + (response != null && response.error != null ? response.error.code : "TRANSPORT"); continue; }
                    if (call.tool == "say") status = response.data.reply + " [" + response.data.source + "]";
                    else if (call.tool == "recordEvent") status = "Game-reported action recorded: " + response.data.eventId;
                    else if (call.tool == "advanceTime") status = "Hearsay gossip tick: " + response.data.tick;
                    else if (call.tool == "recall")
                    {
                        KnownItem[] items = response.data.items ?? new KnownItem[0];
                        status = items.Length == 0 ? "This NPC has no graph knowledge of your actions." : "Known actions:\n";
                        foreach (KnownItem item in items) status += item.type + " via " + item.learnedFrom + " (" + item.confidence + ")\n";
                    }
                    Debug.Log("Hearsay " + call.tool + " confirmed.");
                }
            }
            finally { busy = false; }
        }

        void OnDestroy()
        {
            if (player != null) player.OnCrimeUpdate -= OnCrime;
        }
    }
}
