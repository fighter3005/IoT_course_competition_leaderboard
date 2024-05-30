import serial
import re
import requests
import random
from threading import Timer

################################################### TODO: ###################################################
color = None # TODO: set your custom color here
competitorName = "Group_X" # TODO: set your group name here
serial_port = '/dev/tty.usbmodem0006832480041' # TODO: set serial port here!
baud_rate = 115200 # TODO: set baud rate here!

# Regular expression to match the desired output format (also enforced server-side)
pattern = re.compile(r'(1|3|6|10);(\d+);(-?(?:25\.0|[0-9]|[1-9]\d|1[0-9]\d|200)\.\d);((?:100\.0|[0-9]|[1-9]\d)\.\d);(\d+\.\d+);(\d+)')
#re.compile(r'(\d+);(\d+);(-?\d+\.\d);(\d+\.\d);(\d+);(\d+)')

# Server URL
server_url = "https://api.leaderboard.cau.ninja"

# Attempt to establish a serial connection
try:
    ser = serial.Serial(serial_port, baud_rate, timeout=1)
    serial_connected = True
except serial.SerialException:
    serial_connected = False
    print(f"Unable to establish a serial connection on {serial_port}. Checking for existing data files...")

# Pick a random color if none is provided
if color is None:
    colors = ["#FF5733", "#33FF57", "#3357FF", "#FF33A1", "#A133FF"]
    color = random.choice(colors)

# Send competitorName & color to the server
color_response = requests.post(f"{server_url}/competitors/{competitorName}/color", json={"color": color})
if color_response.status_code == 200:
    print(f"Color {color} set for {competitorName}.")
else:
    print(f"Failed to set color for {competitorName}.")

# Wait for user input to continue
input("Press Enter to start reading and sending data...")

# Timer to stop reading data after 5 minutes
def stop_reading():
    global serial_connected
    serial_connected = False
    print("Stopped reading data after 5 minutes.")

stop_timer = Timer(300, stop_reading)
stop_timer.start()

# Main loop to read data if serial connection is successful
if serial_connected:
    try:
        data_batch = []
        failed_batches = []
        while serial_connected:
            line = ser.readline().decode('utf-8').strip()
            if line:
                with open(f"{competitorName}.txt", "a") as myfile:
                    myfile.write(line + "\n")
                print(line)
                match = pattern.match(line)
                if match:
                    data_batch.append(line)
                    if len(data_batch) >= 20:
                        data_to_send = {competitorName: data_batch}
                        try:
                            data_response = requests.post(f"{server_url}/competitors", json=data_to_send)
                            if data_response.status_code == 201:
                                print("Data batch sent successfully.")
                                data_batch = []
                            else:
                                print("Failed to send data batch, will retry.")
                                failed_batches.append(data_batch)
                                data_batch = []
                        except requests.RequestException as e:
                            print(f"Exception occurred: {e}")
                            failed_batches.append(data_batch)
                            data_batch = []

            # Attempt to resend failed batches
            for batch in failed_batches[:]:
                data_to_send = {competitorName: batch}
                try:
                    data_response = requests.post(f"{server_url}/competitors", json=data_to_send)
                    if data_response.status_code == 201:
                        print("Failed data batch sent successfully.")
                        failed_batches.remove(batch)
                    else:
                        print("Failed to resend data batch, will retry later.")
                except requests.RequestException as e:
                    print(f"Exception occurred: {e}")
                    print("Will retry failed data batch later.")

        # Send remaining data if any
        if data_batch:
            data_to_send = {competitorName: data_batch}
            try:
                data_response = requests.post(f"{server_url}/competitors", json=data_to_send)
                if data_response.status_code == 201:
                    print("Final data batch sent successfully.")
                else:
                    print("Failed to send final data batch, will retry.")
                    failed_batches.append(data_batch)
            except requests.RequestException as e:
                print(f"Exception occurred: {e}")
                failed_batches.append(data_batch)

        # Attempt to send any remaining failed batches one last time
        for batch in failed_batches:
            data_to_send = {competitorName: batch}
            try:
                data_response = requests.post(f"{server_url}/competitors", json=data_to_send)
                if data_response.status_code == 201:
                    print("Failed data batch sent successfully.")
                else:
                    print("Failed to resend final data batch.")
            except requests.RequestException as e:
                print(f"Exception occurred: {e}")
                print("Failed to resend final data batch.")

    except Exception as e:
        print(f"An error occurred during data capture: {e}")
    finally:
        ser.close()
else:
    print("Serial connection not established.")
