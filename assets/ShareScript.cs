using System.Collections;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;
using UnityEngine.Networking;

public class ShareScript : MonoBehaviour
{
    private const string URL = "https://94b2-130-82-245-232.ngrok.io/share";

    // Start is called before the first frame update
    void Start()
    {
        
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    public void ShareWithFriend() {
        StartCoroutine(SendToSolid());
    }
    public IEnumerator SendToSolid()
    {
            Debug.Log($"Sending Share Request");
            using UnityWebRequest webRequest = UnityWebRequest.PostWwwForm(URL, "");
            yield return webRequest.SendWebRequest();
            Debug.Log("Response: " + webRequest.responseCode);
    }
}
