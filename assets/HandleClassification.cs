using TMPro;
using UnityEngine;

// Start is called before the first frame update
public class HandleClassification : MonoBehaviour
    {
        public TextMeshProUGUI textMeshPro ;
        public string State { get; set; }
        public int Value { get; set; }
        public bool IsShared { get; set; }


    // Start is called before the first frame update
    void Start()
        {
            State = "None";
            Value = -1;
            IsShared = false;
        }

        // Update is called once per frame
        void Update()
        {
            textMeshPro.SetText(State);
        }
    }
