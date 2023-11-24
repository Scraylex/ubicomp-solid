using ARETT;
using System;
using System.Collections;
using System.Collections.Concurrent;
using System.Collections.Generic;
using Newtonsoft.Json;
using UnityEngine;
using UnityEngine.Networking;

public class GazeDataFromHL2Example : MonoBehaviour
{

    // connect the DtatProvider-Prefab from ARETT in the Unity Editor
    public DataProvider DataProvider;
    private ConcurrentQueue<Action> _mainThreadWorkQueue = new ConcurrentQueue<Action>();
    private List<string> batch;
    private const int BATCH_SIZE = 60; // -> 2s interval
    public HandleClassification handleClassification;
    private const string URL = "https://3391-130-82-229-35.ngrok.io/gazedata";


    // Start is called before the first frame update
    void Start()
    {
        batch = new List<string>();
    }

    // Update is called once per frame
    void Update()
    {
        // Check if there is something to process
        if (!_mainThreadWorkQueue.IsEmpty)
        {
            // Process all commands which are waiting to be processed
            // Note: This isn't 100% thread save as we could end in a loop when there is still new data coming in.
            //       However, data is added slowly enough so we shouldn't run into issues.
            while (_mainThreadWorkQueue.TryDequeue(out Action action))
            {
                // Invoke the waiting action
                action.Invoke();
            }
        }
    }

    /// <summary>
    /// Starts the Coroutine to get Eye tracking data on the HL2 from ARETT.
    /// </summary>
    public void StartArettData()
    {
        StartCoroutine(SubscribeToARETTData());
    }

    /// <summary>
    /// Subscribes to newDataEvent from ARETT.
    /// </summary>
    /// <returns></returns>
    private IEnumerator SubscribeToARETTData()
    {
        //*
        _mainThreadWorkQueue.Enqueue(() =>
        {
            DataProvider.NewDataEvent += HandleDataFromARETT;
        });
        //*/

        print("subscribed to ARETT events");
        yield return null;

    }

    /// <summary>
    /// Unsubscribes from NewDataEvent from ARETT.
    /// </summary>
    public void UnsubscribeFromARETTData()
    {
        _mainThreadWorkQueue.Enqueue(() =>
        {
            DataProvider.NewDataEvent -= HandleDataFromARETT;
        });

    }




    /// <summary>
    /// Handles gaze data from ARETT and allows you to do something with it
    /// </summary>
    /// <param name="gd"></param>
    /// <returns></returns>
    public void HandleDataFromARETT(GazeData gd)
    {
        // Some exemplary values from ARETT.
        // for a full list of available data see:
        // https://github.com/AR-Eye-Tracking-Toolkit/ARETT/wiki/Log-Format#gaze-data
        string t = "received GazeData\n";
        t += "EyeDataRelativeTimestamp:" + gd.EyeDataRelativeTimestamp;
        t += "\nGazeDirection: " + gd.GazeDirection;
        t += "\nGazePointWebcam: " + gd.GazePointWebcam;
        t += "\nGazeHasValue: " + gd.GazeHasValue;
        t += "\nGazePoint: " + gd.GazePoint;
        t += "\nGazePointMonoDisplay: " + gd.GazePointMonoDisplay;
        Debug.Log(t);
        //StartCoroutine(SendGazeData(gd));
    }

    public IEnumerator SendGazeData(GazeData gd)
    {
        Debug.Log("Adding Gaze Data");
        var gdString = JsonUtility.ToJson(gd);
        batch.Add(gdString);

        Debug.Log($"Added Gaze Data. Current count: {batch.Count}");
        if (batch.Count == BATCH_SIZE)
        {

            string batchJson = JsonConvert.SerializeObject(batch);
            WWWForm from = new();
            from.AddField("value", batchJson);

            Debug.Log("Sending");
            Debug.Log($"String: {batchJson}");
            using UnityWebRequest webRequest = UnityWebRequest.Post(URL, from);
            batch.Clear();
            yield return webRequest.SendWebRequest();
            Debug.Log(webRequest.downloadHandler.data);


            if (webRequest.responseCode == 200)
            {
                string resp = webRequest.downloadHandler.text;
                Dictionary<string, object> data = JsonConvert.DeserializeObject<Dictionary<string, object>>(resp);
                var value = (string)data["value"];
                int result = value switch
                {
                    "Inspection" => 0,
                    "Reading" => 1,
                    "Search" => 2,
                    _ => -1 // Handle invalid input, if needed
                };


                Debug.Log($"Sending Finished successfully with result {resp}");
                if (result != -1)
                {
                    handleClassification.State = value;
                    handleClassification.Value = result;
                }
            }
            else
            {
                Debug.Log($"Sending Finished failed with result {webRequest.responseCode}");
            }
        }
        Debug.Log("Finished �Gaze Coroutine");
    }
}
