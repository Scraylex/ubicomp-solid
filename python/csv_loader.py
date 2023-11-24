import csv
import os
import json
from io import StringIO
import pandas as pd
from feature_extractor import get_features_for_n_seconds

def save_as_csv(list_of_dict, participant, folder):
    '''Saves a list of dicts as one csv file.
    Input: List of feature dicts, participant id.
    Output: CSV file, saved in same directory as this file.'''
    header = list_of_dict[0].keys()
    rows =  [x.values() for x in list_of_dict]

    keys = list_of_dict[0].keys()
    file_name = os.path.join(folder, f'feature_list_P{participant}.csv')
    # if the file already exists, append the rows
    if os.path.exists(file_name):
        with open(file_name, 'a', newline='') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writerows(list_of_dict)
    # otherwise create a new file
    else:
        with open(file_name, 'w', newline='') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writeheader()
            dict_writer.writerows(list_of_dict)
    # '''        
    file_name_all = os.path.join(folder, f'feature_list_all.csv')
    # if the file already exists, append the rows
    if os.path.exists(file_name_all):
        with open(file_name_all, 'a', newline='') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writerows(list_of_dict)
    # otherwise create a new file
    else:
        with open(file_name_all, 'w', newline='') as output_file:
            dict_writer = csv.DictWriter(output_file, keys)
            dict_writer.writeheader()
            dict_writer.writerows(list_of_dict)
    # '''
    return file_name

def collect_data_from_csv_files():
    ''' Collects the filenames of all csv-files in a given folder.
    Input: -
    Output: Dict containing the activites per participants.'''
    root_dir = "./Data/RawGazeData/"
    
    files_list = os.listdir(root_dir)
    print(files_list)
    # filenames are like this: 00_reading.csv, 01_reading.csv,...
    # where the "00" etc. indicates the participant number
    df_files = {}
    for index, path in enumerate(files_list):
        if ("csv" in path):
            name = path.split("_")
            participant_id = name[0]
            activity = name[1].split(".")[0]
            if df_files.get(participant_id):
                df_files[participant_id][activity] = f"{root_dir}{path}"
            else:
                df_files.update({participant_id: {activity: f"{root_dir}{path}"}})
    return df_files

def calculate_features_and_save_for_list_of_files():
    '''Calculates the features for multiple gaze data files and saves those as CSV files.
    Input: Dict containg the activity class (key) and the paths to the gaze data files (value)
    Output: Feature-files.'''
    
    paths = collect_data_from_csv_files()
    for participant_id, participant_item in paths.items():
        feature_list = []
        for activity, path in participant_item.items():
            print(f"calculating features for : {path}")
            df = pd.read_csv(path)
            print(f"activity: {activity}")
            feature_list.append(get_features_for_n_seconds(df, 20, activity, participant_id))

        flat_ls = [item for sublist in feature_list for item in sublist]
        # change the folder here to not overwrite the data we provided!
        save_as_csv(flat_ls, participant_id, './Data/FeatureFiles/')
        
    print("done.")  

# Uncomment this line to calculate the features from the raw gaze data.

def transform_dict_to_csv_row(input_dict):
    # Define the headers for the CSV file
    headers = [
        'eyeDataTimestamp',
        'eyeDataRelativeTimestamp',
        'frameTimestamp',
        'isCalibrationValid',
        'gazeHasValue',
        'gazeOrigin_x',
        'gazeOrigin_y',
        'gazeOrigin_z',
        'gazeDirection_x',
        'gazeDirection_y',
        'gazeDirection_z',
        'gazePointHit',
        'gazePoint_x',
        'gazePoint_y',
        'gazePoint_z'
    ]

    # Initialize a list to store the values in the desired order
    csv_row = []

    # Map the keys in the input_dict to the corresponding headers
    key_mapping = {
        'eyeDataTimestamp': 'EyeDataTimestamp',
        'eyeDataRelativeTimestamp': 'EyeDataRelativeTimestamp',
        'frameTimestamp': 'FrameTimestamp',
        'isCalibrationValid': 'IsCalibrationValid',
        'gazeHasValue': 'GazeHasValue',
        'gazeOrigin_x': 'GazeOrigin',
        'gazeOrigin_y': 'GazeOrigin',
        'gazeOrigin_z': 'GazeOrigin',
        'gazeDirection_x': 'GazeDirection',
        'gazeDirection_y': 'GazeDirection',
        'gazeDirection_z': 'GazeDirection',
        'gazePointHit': 'GazePointHit',
        'gazePoint_x': 'GazePoint',
        'gazePoint_y': 'GazePoint',
        'gazePoint_z': 'GazePoint'
    }

    # Map the values from the input_dict to the corresponding headers and order
    for header in headers:
        if '_' in header:
            # Handle keys with x, y, z
            key, sub_key = header.split('_')
            csv_row.append(input_dict.get(key_mapping[header], {}).get(sub_key, ''))
        else:
            csv_row.append(input_dict.get(key_mapping[header], ''))

    return csv_row

def transform_json_dump_to_pandas(request_data):
        #json to dict
    json_data = json.loads(request_data)
    print(len(json_data))

    # csv string writer
    csv_string = StringIO()
    # write csv headers
    writer = csv.writer(csv_string)
    writer.writerow(['eyeDataTimestamp', 'eyeDataRelativeTimestamp', 'frameTimestamp', 'isCalibrationValid', 'gazeHasValue', 'gazeOrigin_x', 'gazeOrigin_y', 'gazeOrigin_z', 'gazeDirection_x', 'gazeDirection_y', 'gazeDirection_z', 'gazePointHit', 'gazePoint_x', 'gazePoint_y', 'gazePoint_z'])


    # save the json to a json file + timestamp
    for obs in json_data:
        json_obs = json.loads(obs)
        low = transform_dict_to_csv_row(json_obs)
        # append low to csv file
        writer.writerow(low)

    # csv to df
    df = pd.read_csv(StringIO(csv_string.getvalue()))
    features = get_features_for_n_seconds(df, 2, "hololens", "lukas")
    # transform list of json to pandas df
    df = pd.DataFrame(features)
    return df