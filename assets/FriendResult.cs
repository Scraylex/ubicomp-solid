// Copyright (c) Sebastian Kapp.
// Licensed under the MIT License.

using UnityEngine;

namespace ARETT {
	/// <summary>
	/// Data of the eye gaze after processing
	/// </summary>
	public class FriendResult
	{
		public string Activity;

        public string Timestamp;
        public string Probability;
        public string Friend;


        public FriendResult() {	}

        public override string ToString()
        {
            return $"Activity: {Activity}, Timestamp: {Timestamp}, Probability: {Probability}, Friend: {Friend}";
        }
    }
}
