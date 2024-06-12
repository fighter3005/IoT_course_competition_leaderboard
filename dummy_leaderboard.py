import requests
import random
import time

# Server URL
# server_url = "http://localhost:6969"
server_url = "https://api.leaderboard.cau.ninja"

competitors = [
    {"name": "Competitor_A", "color": "#33FF57"},
    {"name": "Competitor_B", "color": "#FF5733"},
    {"name": "Competitor_C", "color": "#3357FF"},
    {"name": "Competitor_D", "color": "#FF33A1"},
]

# Function to generate dummy data
def generate_dummy_data(nodeID, measurement_counter):
    temp = round(random.uniform(-25, 200), 1)
    humidity = round(random.uniform(0, 100), 1)
    timestamp = time.time()
    tx_time = random.randint(10, 1000)
    return f"{nodeID};{measurement_counter};{temp};{humidity};{int(round(timestamp))};{tx_time}"

# Send color information to the server
for competitor in competitors:
    response = requests.post(
        f"{server_url}/competitors/{competitor['name']}/color",
        json={"color": competitor["color"]},
    )
    if response.status_code == 200:
        print(f"Color {competitor['color']} set for {competitor['name']}.")
    else:
        print(f"Failed to set color for {competitor['name']}.")

# Generate and send dummy data
try:
    start_time = time.time()
    measurement_counters = [[0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0], [0, 0, 0, 0, 0]]
    # while time.time() - start_time <= 310:  # Run for 5 minutes
    for _ in range(300): # just send 300*5 data points per node for each competitor in approx 2.5 minutes
        index = 0
        for competitor in competitors:
            data_batch = []
            id = 0
            for nodeID in range(1, len(measurement_counters[index]) + 1):  # 4 nodes per competitor
                id += nodeID
                # print(id)
                for _ in range(5):  # Generate 5 measurements per node per batch
                    measurement_counters[index][nodeID-1] += 1
                    data = generate_dummy_data(id, measurement_counters[index][nodeID-1]) 
                    data_batch.append(data)
                    data = generate_dummy_data(id, measurement_counters[index][nodeID-1])
                    data_batch.append(data)
       

            # Send data batch to the server
            data_to_send = {competitor["name"]: data_batch}
            response = requests.post(f"{server_url}/competitors", json=data_to_send)
            if response.status_code == 201:
                print(f"Data batch sent successfully for {competitor['name']}, {str(measurement_counters[index])}.")
            else:
                print(f"Failed to send data batch for {competitor['name']}.")
            index += 1
        time.sleep(0.1)  # Simulate a short delay between batches
except Exception as e:
    print(f"An error occurred during data generation: {e}")
