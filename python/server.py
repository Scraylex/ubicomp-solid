import os
import pickle
from flask import Flask, request, jsonify
from csv_loader import transform_json_dump_to_pandas

app = Flask(__name__)

# FEATURE_SET = ['minFix', 'maxFix', 'minDis', 'maxDis', 'blinkMin', 'blinkMax', 'xDir', 'yDir', 'fixDensPerBB']
FEATURE_SET =  ["xDir", "yDir", "fixDensPerBB"]

def run_classifier(df):
    features = df[FEATURE_SET]
    file_path = os.path.join(os.getcwd(), "python", 'classifier.pkl')
    with open(file_path, 'rb') as file:
    # Use pickle.load to load the dictionary from the file
        loaded_model = pickle.load(file)
        y_pred = loaded_model.predict(features)
        print('Classified:', y_pred)
        return y_pred

@app.route('/gazedata', methods=['POST'])
def receive_gaze_data():
    df = transform_json_dump_to_pandas(request.form['value'])
    pred = run_classifier(df)
    if(len(pred) == 0):
        return 400
    value = str(pred[0])
    response = {'value': value}
    return jsonify(response), 200

if __name__ == '__main__':
    app.run(host='0.0.0.0', port=5000)
