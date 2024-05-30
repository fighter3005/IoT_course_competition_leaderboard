import React, { useState, useEffect } from "react";
import { Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "bootstrap/dist/css/bootstrap.min.css";
import { FaTimes } from "react-icons/fa";
import Modal from "react-modal";
import "./App.css";

const url = "https://api.leaderboard.cau.ninja";
const max_packages = 4 * 1500;
// const url = "http://localhost:6969";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

const customStyles = {
  content: {
    top: "50%",
    left: "50%",
    right: "auto",
    bottom: "auto",
    marginRight: "-50%",
    transform: "translate(-50%, -50%)",
    width: "400px",
  },
};

Modal.setAppElement("#root");

function createChartData(competitor) {
  const shades = [
    `${competitor.color}FF`,
    `${competitor.color}CC`,
    `${competitor.color}99`,
    `${competitor.color}66`,
    `${competitor.color}33`,
  ];
  return {
    labels: ["Average", "Node 1", "Node 2", "Node 3", "Node 4"],
    datasets: [
      {
        label: "Latency (ms)",
        data: [competitor.avgLatency, ...competitor.nodeLatencies],
        backgroundColor: shades,
      },
    ],
  };
}

const options = {
  scales: {
    y: {
      beginAtZero: true,
    },
  },
};

function App() {
  const [competitors, setCompetitors] = useState([]);
  const [error, setError] = useState(null);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [modalIsOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const response = await fetch("" + url + "/competitors");
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        data.sort(
          (a, b) =>
            ((0.2 * b.totalPackages) / max_packages) * 100 +
            ((0.5 * b.packagesUnder500ms) / max_packages) * 100 -
            0.3 * (1 - (b.avgLatency - 1) / 999) -
            (0.2 * (a.totalPackages / max_packages) * 100 +
              ((0.5 * a.packagesUnder500ms) / max_packages) * 100 -
              0.3 * (1 - (a.avgLatency - 1) / 999))
        );
        setCompetitors(data);
        setError(null); // Clear the error if the fetch is successful
      } catch (error) {
        setError(error.message);
      }
    };

    fetchData();

    const interval = setInterval(fetchData, 500); // Fetch data every 0.5 seconds
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    const savedLoginState = localStorage.getItem("isLoggedIn");
    if (savedLoginState === "true") {
      setIsLoggedIn(true);
      setUsername(localStorage.getItem("username") || "");
      setPassword(localStorage.getItem("password") || "");
    }
  }, []);

  const handleDelete = async (name) => {
    try {
      const response = await fetch(`${url}/competitors/${name}`, {
        method: "DELETE",
        headers: {
          Authorization: `Basic ${btoa(`${username}:${password}`)}`,
        },
      });
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      setCompetitors(competitors.filter((c) => c.name !== name));
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogin = async (e) => {
    e.preventDefault();
    try {
      const response = await fetch("" + url + "/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password }),
      });
      if (response.ok) {
        setIsLoggedIn(true);
        localStorage.setItem("isLoggedIn", "true");
        localStorage.setItem("username", username);
        localStorage.setItem("password", password);
        setError(null);
        closeModal();
      } else {
        const data = await response.json();
        throw new Error(data.message);
      }
    } catch (error) {
      setError(error.message);
    }
  };

  const handleLogout = () => {
    setIsLoggedIn(false);
    localStorage.removeItem("isLoggedIn");
    localStorage.removeItem("username");
    localStorage.removeItem("password");
  };

  const openModal = () => setIsOpen(true);
  const closeModal = () => setIsOpen(false);

  return (
    <div className="min-h-screen bg-gray-100 flex items-center justify-center">
      <div className="w-full max-w-7xl p-4">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-2xl font-bold">Leaderboard</h1>
          {isLoggedIn ? (
            <button
              onClick={handleLogout}
              className="bg-red-500 text-white py-2 px-4 rounded"
            >
              Logout
            </button>
          ) : (
            <button
              onClick={openModal}
              className="bg-blue-500 text-white py-2 px-4 rounded"
            >
              Login
            </button>
          )}
        </div>
        {error && <div className="text-red-500 text-center mb-4">{error}</div>}
        <Modal
          isOpen={modalIsOpen}
          onRequestClose={closeModal}
          style={customStyles}
          contentLabel="Login Modal"
        >
          <button
            onClick={closeModal}
            className="absolute top-2 right-2 text-gray-600"
          >
            <FaTimes />
          </button>
          <h2 className="text-xl font-bold mb-4">Login</h2>
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-gray-700">Username</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-gray-700">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full p-2 border rounded"
                required
              />
            </div>
            <button
              type="submit"
              className="w-full bg-blue-500 text-white py-2 rounded"
            >
              Login
            </button>
          </form>
        </Modal>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {competitors.map((competitor, index) => {
            const totalPackagesPercentage =
              (competitor.totalPackages / max_packages) * 100;
            const packagesUnder500msPercentage =
              (competitor.packagesUnder500ms / max_packages) * 100;

            return (
              <div key={index} className="bg-white shadow rounded p-4 relative">
                {isLoggedIn && (
                  <button
                    onClick={() => handleDelete(competitor.name)}
                    className="absolute top-2 right-2 text-red-500"
                  >
                    <FaTimes />
                  </button>
                )}
                <h2 className="text-xl font-bold mb-2">{competitor.name}</h2>
                <div className="mb-6">
                  <Bar data={createChartData(competitor)} options={options} />
                </div>
                <div className="mb-4 relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packages Received: {competitor.totalPackages} /{" "}
                    {max_packages}
                  </label>
                  <div
                    className="relative"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #ccc",
                      borderRadius: "0.25rem",
                      height: "30px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: competitor.color,
                        width: `${totalPackagesPercentage}%`,
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          width: "100%",
                          textAlign: "center",
                          lineHeight: "30px",
                          color: "#fff",
                        }}
                      >
                        {totalPackagesPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
                <div className="relative">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Packages Under 500ms: {competitor.packagesUnder500ms} /{" "}
                    {max_packages}
                  </label>
                  <div
                    className="relative"
                    style={{
                      backgroundColor: "white",
                      border: "1px solid #ccc",
                      borderRadius: "0.25rem",
                      height: "30px",
                      overflow: "hidden",
                    }}
                  >
                    <div
                      style={{
                        backgroundColor: competitor.color,
                        width: `${packagesUnder500msPercentage}%`,
                        height: "100%",
                        position: "relative",
                      }}
                    >
                      <span
                        style={{
                          position: "absolute",
                          width: "100%",
                          textAlign: "center",
                          lineHeight: "30px",
                          color: "#fff",
                        }}
                      >
                        {packagesUnder500msPercentage.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

export default App;
