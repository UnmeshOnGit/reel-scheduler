const express = require('express');
const fs = require('fs').promises;
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;
const DATA_FILE = path.join(__dirname, 'data.json');

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// Initialize data file if it doesn't exist
async function initDataFile() {
    try {
        await fs.access(DATA_FILE);
        console.log('Data file exists');
    } catch {
        const initialData = {
            videos: [
                {
                    id: 1,
                    name: "Tauba Tauba",
                    contentType: "Dance",
                    shoot: "Done",
                    edit: "Done",
                    igUpload: "Uploaded",
                    ytUpload: "Not",
                    igDate: "2024-08-07",
                    ytDate: "",
                    views: 15000,
                    likes: 1200,
                    notes: "Good engagement, mostly female audience"
                },
                {
                    id: 2,
                    name: "APT",
                    contentType: "Dance",
                    shoot: "Done",
                    edit: "Done",
                    igUpload: "Uploaded",
                    ytUpload: "Not",
                    igDate: "2025-01-19",
                    ytDate: "",
                    views: 0,
                    likes: 0,
                    notes: ""
                }
            ],
            version: "1.0.0",
            lastUpdated: new Date().toISOString()
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
        console.log('Created new data file with sample data');
    }
}

// GET all videos
app.get('/api/videos', async (req, res) => {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        res.json(JSON.parse(data));
    } catch (error) {
        console.error('Error reading data file:', error);
        res.status(500).json({ error: 'Failed to read data' });
    }
});

// POST save videos
app.post('/api/videos', async (req, res) => {
    try {
        const { videos, version = "1.0.0" } = req.body;
        const data = { 
            videos, 
            version,
            lastUpdated: new Date().toISOString() 
        };
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        res.json({ 
            success: true, 
            message: 'Data saved successfully',
            lastUpdated: data.lastUpdated
        });
    } catch (error) {
        console.error('Error saving data:', error);
        res.status(500).json({ error: 'Failed to save data' });
    }
});

// GET health check
app.get('/api/health', (req, res) => {
    res.json({ status: 'OK', timestamp: new Date().toISOString() });
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Initialize and start server
initDataFile().then(() => {
    app.listen(PORT, () => {
        console.log(`
    ╔═══════════════════════════════════════╗
    ║    Reel Scheduler Backend Running     ║
    ╠═══════════════════════════════════════╣
    ║   Local: http://localhost:${PORT}        ║
    ║   API Endpoints:                      ║
    ║   - GET /api/videos                   ║
    ║   - POST /api/videos                  ║
    ║   - GET /api/health                   ║
    ╚═══════════════════════════════════════╝
        `);
    });
}).catch(error => {
    console.error('Failed to initialize data file:', error);
    process.exit(1);
});