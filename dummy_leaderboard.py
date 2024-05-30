import requests
import random
import time

# Server URL
server_url = "http://localhost:6969"
# server_url = "https://api.leaderboard.cau.ninja"

competitors = [
    {"name": "Competitor_A", "color": "#FF5733"},
    {"name": "Competitor_B", "color": "#33FF57"},
    {"name": "Competitor_C", "color": "#3357FF"},
    {"name": "Competitor_D", "color": "#FF33A1"},
]

# Function to generate dummy data
def generate_dummy_data(nodeID, measurement_counter):
    temp = round(random.uniform(-10, 35), 1)
    humidity = round(random.uniform(10, 90), 1)
    timestamp = int(time.time())
    tx_time = random.randint(100, 1000)
    return f"{nodeID};{measurement_counter};{temp};{humidity};{timestamp};{tx_time}"

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
    measurement_counter = 0
    while time.time() - start_time <= 300:  # Run for 5 minutes
        for competitor in competitors:
            data_batch = []
            for nodeID in range(1, 5):  # 4 nodes per competitor
                for _ in range(5):  # Generate 5 measurements per node per batch
                    data = generate_dummy_data(nodeID, measurement_counter)
                    data_batch.append(data)
                    measurement_counter += 1

            # Send data batch to the server
            data_to_send = {competitor["name"]: data_batch}
            response = requests.post(f"{server_url}/competitors", json=data_to_send)
            if response.status_code == 201:
                print(f"Data batch sent successfully for {competitor['name']}.")
            else:
                print(f"Failed to send data batch for {competitor['name']}.")
        time.sleep(1)  # Simulate a short delay between batches
except Exception as e:
    print(f"An error occurred during data generation: {e}")
