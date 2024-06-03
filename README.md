# IoT_challenge_leaderboard

## Info:

The code is a quick and dirty implementation of a leaderboard and an api to visualize the progress of the running experiment from Lab2 - Part 4, of the 2024 iteration of the IoT course at the CAU Kiel. Feel free to modify the code as you wish.

Note: The code is not very clean. (For example style & className props are used, and the code could be split into separate components). Security is also a factor, that is outside of the scope of this repo. The username and password are not secure, and the login is also not intended to be secure.

## Deployment

### How to start up the Leaderboard

- clone the repo
- configure the url(s) and port(s)
- navigate to folder `cd IoT_challenge_leaderboard/`
- build the app (also do this after changing something) `docker compose build --no-cache`
- start the containers `docker compose up -d`

Then use the provided `leaderboard.py` to capture, save and send the data generated by the sink node to the leaderboard api. Start the script and as soon as you are ready, start your protocol and hit enter to start the 5 minute timer and capture serial output. The script terminates after 5 minutes.

**For local testing and development:**

- cd into leaderboard or leaderboard_server
- configure url to localhost and adjust ports
- install dependencies with `npm install`
- then start with `npm start`

## Configuration:

**Frontend:**
You need to specify the `url` of the express-server api in `App.js`. You also need to adjust the maximum amount of packages `max_packages` that can be received per competitor. You may also adjust the `scoreFn` for individual weighting of the statistics.

**Backend:** You need to configure the `port`, `username`, and `password` in `server.js` and also the `max_measurement_counter` in `database.js`. If needed, you can also adjust the constrains for the format of a valid string by modifying the if statement in the function `saveCompetitorData` or ad a regex beforehand, like in the `leaderboard.py` script.

**leaderboard.py:**
You need to set the `server_url`, `competitorName`, `serial_port`, and `baud_rate`. Setting a color is optional for each group.
