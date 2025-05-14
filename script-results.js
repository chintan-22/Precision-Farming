document.addEventListener("DOMContentLoaded", async function () {
    const displayArea = document.getElementById("displayData");
    let backendPort = 5003;

    // Try to get the backend port if available
    await getBackendPort();

    // Show loading indicator
    displayArea.innerHTML = "<p>Loading recommendation data...</p>";

    // Get the form data from localStorage
    const formData = JSON.parse(localStorage.getItem('latestFormData'));
    if (!formData) {
        displayArea.innerHTML = "<p>No data found. Please go back and enter data.</p>";
        return;
    }

    // Make API request to get crop recommendations
    try {
        const response = await fetch(`http://localhost:${backendPort}/api/sensors/data`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(formData),
        });
        
        if (!response.ok) {
            throw new Error(`Server responded with status: ${response.status}`);
        }
        
        const result = await response.json();

        if (result.prediction) {
            displayPrediction(
                result.prediction.parameters,
                result.prediction.top_prediction,
                result.prediction.recommendations
            );
        } else {
            displayArea.innerHTML = "<p>No prediction available. The model may be unavailable or the data may be invalid.</p>";
        }

    } catch (error) {
        displayArea.innerHTML = `<p class="error">Error: ${error.message}</p>
                                <p>Please check if the backend server is running.</p>`;
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

    // Function to display the prediction results
    function displayPrediction(parameters, top_prediction, recommendations) {
        const paramsHtml = `
            <h3>Input Parameters</h3>
            <ul>
                <li><strong>Temperature:</strong> ${parameters.temperature} °C</li>
                <li><strong>Humidity:</strong> ${parameters.humidity} %</li>
                <li><strong>pH:</strong> ${parameters.ph}</li>
                <li><strong>Rainfall:</strong> ${parameters.rainfall} mm</li>
                ${parameters.N ? `<li><strong>Nitrogen (N):</strong> ${parameters.N}</li>` : ''}
                ${parameters.P ? `<li><strong>Phosphorus (P):</strong> ${parameters.P}</li>` : ''}
                ${parameters.K ? `<li><strong>Potassium (K):</strong> ${parameters.K}</li>` : ''}
            </ul>
        `;

        const topHtml = `
            <h3>Recommended Crop</h3>
            <div>
                <p style="font-size:1.5em;color:#2c7a7b;"><strong>${top_prediction}</strong></p>
            </div>
        `;

        let altHtml = '';
        if (recommendations && recommendations.length > 1) {
            altHtml = `
                <h4>Other Possible Crops:</h4>
                <ul>
                    ${recommendations.slice(1).map(r => `
                        <li>${r.crop}</li>
                    `).join('')}
                </ul>
            `;
        }

        displayArea.innerHTML = paramsHtml + topHtml + altHtml;
    }
});