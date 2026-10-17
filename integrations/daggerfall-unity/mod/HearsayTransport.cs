using System;
using System.Collections;
using System.Text;
using UnityEngine;
using UnityEngine.Networking;

namespace HearsayDfu
{
    [Serializable] public class PlayerInput { public string playerId; }
    [Serializable] public class SayInput { public string playerId; public string npcId; public string text; }
    [Serializable] public class EventInput
    {
        public string playerId;
        public string type;
        public string subject;
        public string placeId = "dfu_location";
        public string[] witnesses;
    }
    [Serializable] public class ErrorBody { public string code; public string message; }
    [Serializable] public class KnownItem { public string eventId; public string type; public string learnedFrom; public float confidence; }
    [Serializable] public class DataBody
    {
        public string reply;
        public string source;
        public string eventId;
        public int tick;
        public KnownItem[] items;
    }
    [Serializable] public class Envelope { public bool ok; public DataBody data; public ErrorBody error; }

    public static class Transport
    {
        // The backend is local. No database credentials or external URLs enter the mod.
        public static IEnumerator Call(string tool, object input, string key, Action<Envelope> done)
        {
            using (UnityWebRequest request = new UnityWebRequest("http://127.0.0.1:8787/tools/" + tool, "POST"))
            {
                request.uploadHandler = new UploadHandlerRaw(Encoding.UTF8.GetBytes(JsonUtility.ToJson(input)));
                request.downloadHandler = new DownloadHandlerBuffer();
                request.timeout = 15;
                request.SetRequestHeader("Content-Type", "application/json");
                request.SetRequestHeader("Authorization", "Bearer " + key);
                yield return request.SendWebRequest();
                Envelope response = null;
                if (!request.isNetworkError)
                {
                    try { response = JsonUtility.FromJson<Envelope>(request.downloadHandler.text); }
                    catch (Exception) { /* Invalid responses never become successful dialogue. */ }
                }
                if (response == null || (!response.ok && response.error == null) || (response.ok && response.data == null))
                    response = new Envelope { ok = false, error = new ErrorBody {
                        code = "TRANSPORT", message = "Hearsay could not confirm the request. Check the local server." }
                    };
                done(response);
            }
        }
    }
}
