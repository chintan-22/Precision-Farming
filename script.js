// Firebase and form submission combined script
document.addEventListener("DOMContentLoaded", async function () {
    const form = document.getElementById("soilForm");
    const displayArea = document.getElementById("displayData");
    const viewDataBtn = document.getElementById("viewDataBtn");
    const statusElement = document.getElementById('firebaseStatus');
    let backendPort = 5003;

    // Initialize Firebase
    const firebaseConfig = {
        apiKey: "AIzaSyD3E2UgTKUJ4pAimCXj-ubBbwW2ZG192GM",
        authDomain: "precisionfarming-216d3.firebaseapp.com",
        databaseURL: "https://precisionfarming-216d3-default-rtdb.firebaseio.com",
        projectId: "precisionfarming-216d3",
        storageBucket: "precisionfarming-216d3.firebasestorage.app",
        messagingSenderId: "408446526312",
        appId: "1:408446526312:web:f92e9441c62cf5203bacdd",
        measurementId: "G-KQ65K4XYCW"
    };

    firebase.initializeApp(firebaseConfig);
    const database = firebase.database();
    console.log("Firebase initialized");

    // Setup Firebase auto-refresh
    setupAutoRefresh();

    // Try to get the backend port, but use default if not available
    await getBackendPort();

    // Set up form submission handler
    form.addEventListener("submit", handleFormSubmit);

    // Set up view data button handler
    viewDataBtn.addEventListener("click", function () {
        // Open in a new tab instead of navigating away
        window.open(`http://localhost:${backendPort}/api/sensors/data`, '_blank');
    });

    // FUNCTION DEFINITIONS
    // Function to fetch latest sensor data from Firebase
    function fetchLatestSensorData() {
        statusElement.textContent = "Fetching latest sensor data...";
        // Reference to your sensor data in Firebase
        const dataRef = database.ref('sensor_data');
        // Get all entries to find the latest
        dataRef.orderByKey().limitToLast(1).once('value')
            .then((snapshot) => {
                if (snapshot.exists()) {
                    let latestData = null;
                    let latestTimestamp = null;
                    // Extract the latest data
                    snapshot.forEach((childSnapshot) => {
                        latestTimestamp = childSnapshot.key;
                        latestData = childSnapshot.val();
                        console.log("Latest timestamp:", latestTimestamp);
                        console.log("Latest data:", latestData);
                    });
                    if (latestData) {
                        // Fill input fields with the fetched data
                        document.getElementById('temperature').value = latestData.temperature_C || '';
                        document.getElementById('humidity').value = latestData.humidity_percent || '';
                        document.getElementById('rainfall').value = latestData.rainfall_mm || '';
                        document.getElementById('ph').value = latestData.pH || '';

                        // Show success message
                        statusElement.textContent = `Sensor data loaded successfully! (Last updated: ${latestData.timestamp})`;
                        statusElement.style.color = 'green';

                        // Clear the displayArea content
                        displayArea.innerHTML = '';

                        // Display the fetched data in the display area
                        displaySensorData(latestData);

                    } else {
                        statusElement.textContent = "No sensor data found in the database.";
                        statusElement.style.color = 'orange';
                    }
                } else {
                    statusElement.textContent = "No sensor data found in the database.";
                    statusElement.style.color = 'orange';
                }
            })
            .catch((error) => {
                console.error("Firebase error:", error);
                statusElement.textContent = `Error loading sensor data: ${error.message}`;
                statusElement.style.color = 'red';
            });
    }

    // Function to display sensor data on the index page
    function displaySensorData(data) {
        displayArea.innerHTML = `
            <p>Adjust the values if needed and submit to get crop recommendations.</p>
        `;
    }

    // Function to set up auto-refresh of sensor data
    function setupAutoRefresh() {
        // Initial fetch when page loads
        fetchLatestSensorData();
        // Set an interval to fetch data every minute (60000 milliseconds)
        setInterval(function () {
            console.log("Auto-refreshing sensor data...");
            fetchLatestSensorData();
        }, 60000);
    }

    // Function to get the backend port
    async function getBackendPort() {
        try {
            const response = await fetch("/api/config");
            if (response.ok) {
                const config = await response.json();
                backendPort = config.port;
                console.log("Using backend port:", backendPort);
            }
        } catch (error) {
            console.log("Using default port:", backendPort);
        }
    }

    // Handle form submission and redirect to results page
    async function handleFormSubmit(event) {
        event.preventDefault();
        displayArea.innerHTML = "<p>Processing your data...</p>";

        const formData = {
            temperature: document.getElementById('temperature').value,
            humidity: document.getElementById('humidity').value,
            ph: document.getElementById('ph').value,
            rainfall: document.getElementById('rainfall').value
        };

        // Store form data in localStorage for the results page
        localStorage.setItem('latestFormData', JSON.stringify(formData));
        
        // Redirect to results page
        window.location.href = 'results.html';
    }
});