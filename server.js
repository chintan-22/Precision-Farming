const express = require('express');
const cors = require('cors');
const fs = require('fs');
const { spawn } = require('child_process');

const app = express();
const PORT = process.env.PORT || 5003;

app.use(express.json());
app.use(cors({ origin: '*' }));

const DATA_FILE = 'sensorData.json';

// Load existing sensor data
const loadSensorData = () => {
    try {
        return JSON.parse(fs.readFileSync(DATA_FILE, 'utf8'));
    } catch (error) {
        return [];
    }
};

// Save new sensor data
const saveSensorData = (data) => {
    fs.writeFileSync(DATA_FILE, JSON.stringify(data, null, 2), 'utf8');
};

let sensorData = loadSensorData();

// **Store Soil Data and Return Prediction**
app.post('/api/sensors/data', async (req, res) => {
    try {
        const newEntry = { ...req.body, timestamp: new Date().toISOString() };

        // First, get the prediction
        const prediction = await getPrediction(req.body);

        // Store both the data and the prediction
        newEntry.prediction = prediction.prediction;

        sensorData.push(newEntry);
        saveSensorData(sensorData);

        res.status(201).json({
            message: 'Data saved successfully',
            data: newEntry,
            prediction: prediction
        });
    } catch (error) {
        console.error('Error in /api/sensors/data:', error);
        res.status(500).json({ error: error.message });
    }
});

// Helper function to get prediction
function getPrediction(data) {
    return new Promise((resolve, reject) => {
        const { temperature, humidity, ph, rainfall } = data;

        if (
            temperature === undefined ||
            humidity === undefined ||
            ph === undefined ||
            rainfall === undefined
        ) {
            return reject(new Error("Missing required parameters"));
        }

        const pythonProcess = spawn('python', [
            'model.py',
            temperature.toString(),
            humidity.toString(),
            ph.toString(),
            rainfall.toString()
        ]);

        let dataString = '';
        let errorString = '';

        pythonProcess.stdout.on('data', (data) => {
            dataString += data.toString();
        });

        pythonProcess.stderr.on('data', (data) => {
            errorString += data.toString();
            console.error(`Python error: ${data}`);
        });

       // Modify the getPrediction function
pythonProcess.on('close', (code) => {
    if (code !== 0) {
        return reject(new Error(`Model prediction failed: ${errorString}`));
    }
    
    try {
        const result = JSON.parse(dataString.trim());
        if (result.error) throw new Error(result.error);
        resolve(result);
    } catch (e) {
        reject(new Error("Invalid response from model"));
    }
});

        
    });
}


// **Direct Prediction Endpoint**
app.post('/api/predict', async (req, res) => {
    try {
        const prediction = await getPrediction(req.body);
        res.json(prediction);
    } catch (error) {
        console.error('Error in /api/predict:', error);
        res.status(500).json({ error: error.message });
    }
});

// **Get All Stored Sensor Data**
app.get('/api/sensors/data', (req, res) => {
    res.json(sensorData);
});

// **Get Latest Sensor Data with Prediction**
app.get('/api/sensors/latest', (req, res) => {
    if (sensorData.length === 0) {
        return res.status(404).json({ error: "No sensor data available" });
    }

    // Return the most recent entry
    const latestEntry = sensorData[sensorData.length - 1];
    res.json(latestEntry);
});

// **Configuration endpoint**
app.get('/api/config', (req, res) => {
    res.json({ port: PORT });
});

// Serve static files from current directory
app.use(express.static('./'));

// **Start Server**
const server = app.listen(PORT, () => {
    console.log(`✅ Server running on port ${PORT}`);
});
server.on('error', (err) => {
    if (err.code === 'EADDRINUSE') {
        console.error(`❌ Port ${PORT} is already in use. Please use a different port.`);
    } else {
        console.error('Server error:', err);
    }
});

