using System.Collections;
using System.Collections.Generic;
using System.Threading;
using UnityEngine;
using UnityEngine.Networking;

public class UploadScript : MonoBehaviour
{

    public GameObject classificationHandler;
    private HandleClassification handleClassification;
    //private ClassificationHandler classificationHandler;
    private const string URL = "https://8b1d-130-82-245-232.ngrok.io/classified/";
    // Start is called before the first frame update
    void Start()
    {
        handleClassification = classificationHandler.GetComponent<HandleClassification>();
    }

    // Update is called once per frame
    void Update()
    {
    }

    public void ToogleShare()
    {
        if (handleClassification.IsShared)
        {
            handleClassification.IsShared = false;
        }
        else
        {
            handleClassification.IsShared = true;
        }
    }

    public IEnumerator SendToSolid()
    {
        Thread.Sleep(10000);
        if(handleClassification.IsShared)
        {
            Debug.Log("Sending Request to solid");
            using UnityWebRequest webRequest = UnityWebRequest.PostWwwForm(URL + handleClassification.Value, "");
            yield return webRequest.SendWebRequest();
            Debug.Log("Express response: " + webRequest.downloadHandler.data);
        }
    }
}
