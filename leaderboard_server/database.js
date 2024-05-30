const sqlite3 = require("sqlite3").verbose();
const db = new sqlite3.Database(":memory:");

// Initialize the database schema
db.serialize(() => {
  db.run(
    `CREATE TABLE competitor_data (
      competitorName TEXT,
      nodeID INTEGER,
      measurementCounter INTEGER,
      temp REAL,
      humidity REAL,
      timestamp INTEGER,
      txTime INTEGER
    )`
  );
  db.run(
    `CREATE TABLE competitor_colors (
      competitorName TEXT,
      color TEXT,
      FOREIGN KEY (competitorName) REFERENCES competitor_data(competitorName) ON DELETE CASCADE
    )`
  );
});

// Save competitor data
const saveCompetitorData = (data) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      "INSERT INTO competitor_data (competitorName, nodeID, measurementCounter, temp, humidity, timestamp, txTime) VALUES (?, ?, ?, ?, ?, ?, ?)"
    );

    db.serialize(() => {
      for (const [competitorName, values] of Object.entries(data)) {
        values.forEach((value) => {
          console.log(value);
          const [
            nodeID,
            measurementCounter,
            temp,
            humidity,
            timestamp,
            txTime,
          ] = value.split(";");
          if (
            ["1", "3", "6", "10"].includes(nodeID.toString()) &&
            Number(measurementCounter) <= 1500 &&
            Number(temp) >= -25 &&
            Number(temp) <= 200 &&
            Number(humidity) >= 0 &&
            !Number(humidity) <= 100
          ) {
            stmt.run(
              competitorName,
              parseInt(nodeID),
              parseInt(measurementCounter),
              parseFloat(temp),
              parseFloat(humidity),
              parseInt(timestamp),
              parseInt(txTime)
            );
          }
        });
      }
      stmt.finalize();
      resolve();
    });
  });
};

// Get competitors data
const getCompetitorsData = () => {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT 
        c.competitorName,
        c.nodeID,
        AVG(c.txTime) as avgLatency,
        COUNT(*) as totalPackages,
        SUM(CASE WHEN c.txTime < 500 THEN 1 ELSE 0 END) as packagesUnder500ms,
        co.color as color
      FROM competitor_data c
      LEFT JOIN competitor_colors co ON c.competitorName = co.competitorName
      GROUP BY c.competitorName, c.nodeID
    `;

    db.all(query, [], (err, rows) => {
      if (err) {
        reject(err);
      } else {
        // Aggregate data by competitor
        const competitorsMap = {};
        rows.forEach((row) => {
          if (!competitorsMap[row.competitorName]) {
            competitorsMap[row.competitorName] = {
              name: row.competitorName,
              avgLatency: 0,
              nodeLatencies: [],
              totalPackages: 0,
              packagesUnder500ms: 0,
              color: row.color || "#36A2EB", // Default color if not set
            };
          }
          const competitor = competitorsMap[row.competitorName];
          competitor.avgLatency =
            (competitor.avgLatency * competitor.nodeLatencies.length +
              row.avgLatency) /
            (competitor.nodeLatencies.length + 1);
          competitor.nodeLatencies.push(row.avgLatency);
          competitor.totalPackages += row.totalPackages;
          competitor.packagesUnder500ms += row.packagesUnder500ms;
        });

        const competitors = Object.values(competitorsMap);
        resolve(competitors);
      }
    });
  });
};

// Set color for competitor
const setColorForCompetitor = (name, color) => {
  return new Promise((resolve, reject) => {
    const stmt = db.prepare(
      "INSERT OR REPLACE INTO competitor_colors (competitorName, color) VALUES (?, ?)"
    );
    stmt.run(name, color, (err) => {
      if (err) {
        reject(err);
      } else {
        resolve();
      }
    });
    stmt.finalize();
  });
};

// Delete competitor data
const deleteCompetitor = (name) => {
  return new Promise((resolve, reject) => {
    db.run(
      "DELETE FROM competitor_data WHERE competitorName = ?",
      [name],
      (err) => {
        if (err) {
          reject(err);
        } else {
          db.run(
            "DELETE FROM competitor_colors WHERE competitorName = ?",
            [name],
            (err) => {
              if (err) {
                reject(err);
              } else {
                resolve();
              }
            }
          );
        }
      }
    );
  });
};

module.exports = {
  saveCompetitorData,
  getCompetitorsData,
  deleteCompetitor,
  setColorForCompetitor,
};
