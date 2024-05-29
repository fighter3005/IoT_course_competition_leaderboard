const express = require("express");
const cors = require("cors");
const app = express();
const port = 6969;

const username = "laura";
const password = "#IoT24";

const {
  saveCompetitorData,
  getCompetitorsData,
  deleteCompetitor,
  setColorForCompetitor,
} = require("./database");

app.use(cors());
app.use(express.json());

app.post("/login", (req, res) => {
  const { username: user, password: pass } = req.body;
  if (user === username && pass === password) {
    res.json({ message: "Login successful" });
  } else {
    res.status(401).json({ message: "Invalid credentials" });
  }
});

const authenticate = (req, res, next) => {
  const authHeader = req.headers.authorization;
  if (
    authHeader &&
    authHeader ===
      `Basic ${Buffer.from(`${username}:${password}`).toString("base64")}`
  ) {
    next();
  } else {
    res.status(401).json({ message: "Unauthorized" });
  }
};

app.get("/competitors", async (req, res) => {
  try {
    const competitors = await getCompetitorsData();
    res.json(competitors);
    // console.log(competitors);
  } catch (error) {
    res.status(500).json({ message: "Error retrieving competitors data" });
  }
});

app.post("/competitors", async (req, res) => {
  const data = req.body;
  try {
    await saveCompetitorData(data);
    // console.log(data);
    res.status(201).json({ message: "Data saved successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error saving data" });
  }
});

app.post("/competitors/:name/color", async (req, res) => {
  const { name } = req.params;
  const { color } = req.body;
  // console.log(name, color);
  try {
    await setColorForCompetitor(name, color);
    res.status(200).json({ message: "Color set successfully" });
  } catch (error) {
    res.status(500).json({ message: "Error setting color" });
  }
});

app.delete("/competitors/:name", authenticate, async (req, res) => {
  const { name } = req.params;
  try {
    await deleteCompetitor(name);
    res.status(200).json({ message: "Competitor deleted" });
  } catch (error) {
    res.status(500).json({ message: "Error deleting competitor" });
  }
});

app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});
