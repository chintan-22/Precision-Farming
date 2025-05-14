# import serial
# import firebase_admin
# from firebase_admin import credentials, db
# from datetime import datetime

# # --- Firebase Setup ---
# cred = credentials.Certificate("C:/Users/harsh/OneDrive/Desktop/be_proj/precisionfarming-216d3-firebase-adminsdk-fbsvc-de3fad6eab.json")
# firebase_admin.initialize_app(cred, {
#     'databaseURL': 'https://precisionfarming-216d3-default-rtdb.firebaseio.com/'  # Replace with your actual URL if different
# })

# # --- Serial Setup ---
# ser = serial.Serial('COM7', 9600, timeout=1)  # Ensure this matches your Arduino port
# ser.flush()

# print("📡 Waiting for sensor data from Arduino...")

# while True:
#     if ser.in_waiting > 0:
#         line = ser.readline().decode('utf-8').strip()
#         print(f"Raw data: {line}")
#         try:
#             values = [float(x) for x in line.split(',')]
#             if len(values) == 6:
#                 data_dict = {
#                     'red': values[0],
#                     'green': values[1],
#                     'blue': values[2],
#                     'rainfall': values[3],
#                     'temperature': values[4],
#                     'humidity': values[5],
#                     'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
#                 }

#                 # Push to Firebase
#                 ref = db.reference('sensor_data')
#                 ref.push(data_dict)

#                 print("✅ Data sent to Firebase:", data_dict)
#             else:
#                 print("⚠️ Incomplete data received. Expected 6 values.")
#         except Exception as e:
#             print(f"❌ Error parsing data: {e}")
import serial
import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime

# --- Firebase Setup ---
cred = credentials.Certificate("C:/Users/harsh/OneDrive/Desktop/be_proj/precisionfarming-216d3-firebase-adminsdk-fbsvc-de3fad6eab.json")
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://precisionfarming-216d3-default-rtdb.firebaseio.com/'
})

# --- Serial Setup ---
ser = serial.Serial('COM7', 9600, timeout=1)
ser.flush()

print("📡 Waiting for sensor data from Arduino...")

while True:
    if ser.in_waiting > 0:
        line = ser.readline().decode('utf-8').strip()
        print(f"Raw data: {line}")
        try:
            values = [float(x) for x in line.split(',')]
            if len(values) == 4:
                data_dict = {
                    'rainfall_mm': values[0],
                    'temperature_C': values[1],
                    'humidity_percent': values[2],
                    'pH': values[3],
                    'timestamp': datetime.now().strftime('%Y-%m-%d %H:%M:%S')
                }

                # Push to Firebase
                ref = db.reference('sensor_data')
                ref.push(data_dict)

                print("✅ Data sent to Firebase:", data_dict)
            else:
                print("⚠️ Incomplete data received. Expected 4 values.")
        except Exception as e:
            print(f"❌ Error parsing data: {e}")
