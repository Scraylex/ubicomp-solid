using ARETT;
using Newtonsoft.Json;
using System.Collections;
using System.Collections.Generic;
using TMPro;
using UnityEngine;
using UnityEngine.Networking;

public class FriendStateHandler : MonoBehaviour
{
    // Start is called before the first frame update
    public TextMeshProUGUI text;

    public string Actvity { get; set; }
    public string Timestamp { get; set; }
    public string Probability { get; set; }
    private const string URL = "https://94b2-130-82-245-232.ngrok.io/friend";


    void Start()
    {
        StartCoroutine(GetFriendData());
    }

    // Update is called once per frame
    void Update()
    {
        
    }

    private IEnumerator GetFriendData()
    {
        Debug.Log($"Sending Request to solid");
        using UnityWebRequest webRequest = UnityWebRequest.Get(URL);
        yield return webRequest.SendWebRequest();
        Debug.Log("Express response: " + webRequest.downloadHandler.data);
        FriendResult friend = JsonConvert.DeserializeObject<FriendResult>(webRequest.downloadHandler.text);
        string friendText = friend.ToString();
        Debug.Log("Friend: " + friendText);
        text.SetText(friendText);
    }
}
