const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));

// Your MongoDB Atlas Connection Details
const MONGO_URI = process.env.MONGODB_URI || 
    'mongodb+srv://unmeshsutar33_db_user:Mq1vy7xcj2chIlz6d@cluster0.pg6xtap.mongodb.net/reel_scheduler?retryWrites=true&w=majority';

console.log('🔗 Connecting to MongoDB Atlas...');
console.log('   Cluster: cluster0.pg6xtap.mongodb.net');
console.log('   Database: reel_scheduler');
console.log('   Username: unmeshsutar33_db_user');

// Connect to MongoDB
async function connectDB() {
    try {
        await mongoose.connect(MONGO_URI, {
            serverSelectionTimeoutMS: 5000,
            socketTimeoutMS: 45000,
        });
        
        console.log('✅ Successfully connected to MongoDB Atlas!');
        console.log(`   Database: ${mongoose.connection.name}`);
        console.log(`   Host: ${mongoose.connection.host}`);
        
        return true;
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        
        if (error.message.includes('Authentication failed')) {
            console.log(`
🔐 AUTHENTICATION ERROR
──────────────────────
Possible issues:
1. Wrong password - Check your MongoDB Atlas password
2. User doesn't exist - Verify username: unmeshsutar33_db_user
3. IP not whitelisted - Go to Atlas → Network Access → Add Current IP

Fix: Update password in .env file:
MONGODB_URI=mongodb+srv://unmeshsutar33_db_user:YOUR_ACTUAL_PASSWORD@cluster0.pg6xtap.mongodb.net/reel_scheduler
            `);
        } else if (error.message.includes('ENOTFOUND')) {
            console.log(`
🌐 NETWORK ERROR
────────────────
Cannot reach MongoDB Atlas cluster:
cluster0.pg6xtap.mongodb.net

Check:
1. Internet connection
2. Firewall settings
3. DNS configuration
            `);
        }
        
        return false;
    }
}

// Video Schema
const videoSchema = new mongoose.Schema({
    id: { type: Number, required: true, unique: true },
    name: { type: String, required: true },
    contentType: { type: String, default: 'Other' },
    shoot: { type: String, enum: ['Done', 'Pending'], default: 'Pending' },
    edit: { type: String, enum: ['Done', 'Pending'], default: 'Pending' },
    igUpload: { type: String, enum: ['Not', 'Scheduled', 'Uploaded'], default: 'Not' },
    ytUpload: { type: String, enum: ['Not', 'Scheduled', 'Uploaded'], default: 'Not' },
    igDate: { type: String, default: '' },
    ytDate: { type: String, default: '' },
    views: { type: Number, default: 0 },
    likes: { type: Number, default: 0 },
    notes: { type: String, default: '' }
}, {
    timestamps: true
});

const Video = mongoose.model('Video', videoSchema);

// Initialize database
async function initializeDB() {
    try {
        const count = await Video.countDocuments();
        console.log(`📊 Database has ${count} videos`);
        
        if (count === 0) {
            console.log('📦 Adding sample videos...');
            
            const sampleVideos = [
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
            ];
            
            await Video.insertMany(sampleVideos);
            console.log('✅ Added 2 sample videos');
        }
        
        return true;
    } catch (error) {
        console.error('❌ Database initialization error:', error.message);
        return false;
    }
}

// Import existing data from data.json
const fs = require('fs').promises;
const path = require('path');
const DATA_FILE = path.join(__dirname, 'data.json');

async function importExistingData() {
    try {
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const jsonData = JSON.parse(data);
        const existingVideos = jsonData.videos || [];
        
        if (existingVideos.length > 0) {
            console.log(`📥 Found ${existingVideos.length} videos in data.json`);
            
            // Clear existing data
            await Video.deleteMany({});
            
            // Import all videos
            await Video.insertMany(existingVideos);
            
            console.log(`✅ Imported ${existingVideos.length} videos to MongoDB`);
            
            // Create backup of the imported data
            const backupFile = `backup-${new Date().toISOString().split('T')[0]}.json`;
            await fs.writeFile(backupFile, JSON.stringify(jsonData, null, 2));
            console.log(`💾 Backup saved as: ${backupFile}`);
        }
        
        return existingVideos.length;
    } catch (error) {
        console.log('📁 No existing data found or error reading file');
        return 0;
    }
}

// API Routes
app.get('/api/info', async (req, res) => {
    try {
        const count = await Video.countDocuments();
        const sample = await Video.findOne().lean();
        
        res.json({
            success: true,
            database: {
                name: mongoose.connection.name,
                host: mongoose.connection.host,
                totalVideos: count,
                sampleVideo: sample || null
            },
            connection: {
                username: 'unmeshsutar33_db_user',
                cluster: 'cluster0.pg6xtap.mongodb.net',
                appName: 'Cluster0'
            },
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/videos', async (req, res) => {
    try {
        const videos = await Video.find().sort({ id: 1 }).lean();
        res.json({
            success: true,
            videos,
            count: videos.length,
            database: mongoose.connection.name,
            timestamp: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.post('/api/videos', async (req, res) => {
    try {
        const { videos } = req.body;
        
        if (!Array.isArray(videos)) {
            return res.status(400).json({ error: 'Videos array required' });
        }
        
        await Video.deleteMany({});
        await Video.insertMany(videos);
        
        res.json({
            success: true,
            message: `Saved ${videos.length} videos to MongoDB`,
            count: videos.length
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

app.get('/api/health', (req, res) => {
    res.json({
        status: 'OK',
        mongodb: mongoose.connection.readyState === 1 ? 'Connected' : 'Disconnected',
        database: 'reel_scheduler',
        collection: 'videos',
        cluster: 'cluster0.pg6xtap.mongodb.net',
        timestamp: new Date().toISOString()
    });
});

// Import endpoint
app.post('/api/import-local', async (req, res) => {
    try {
        const importedCount = await importExistingData();
        
        if (importedCount > 0) {
            res.json({
                success: true,
                message: `Imported ${importedCount} videos from data.json to MongoDB`
            });
        } else {
            res.json({
                success: false,
                message: 'No data found in data.json'
            });
        }
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Export current data
app.get('/api/export', async (req, res) => {
    try {
        const videos = await Video.find().lean();
        const exportData = {
            videos,
            exportedAt: new Date().toISOString(),
            count: videos.length,
            source: 'mongodb'
        };
        
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Content-Disposition', 'attachment; filename="mongodb-export.json"');
        res.json(exportData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend
app.get('*', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// Start server
async function startServer() {
    console.log(`
╔══════════════════════════════════════════════════════╗
║            Reel Scheduler - MongoDB Setup           ║
╠══════════════════════════════════════════════════════╣
║   User: unmeshsutar33_db_user                       ║
║   Cluster: cluster0.pg6xtap.mongodb.net             ║
║   Database: reel_scheduler                          ║
║   Collection: videos                                ║
╚══════════════════════════════════════════════════════╝
    `);
    
    // Connect to MongoDB
    const connected = await connectDB();
    
    if (!connected) {
        console.log(`
⚠️  CANNOT CONNECT TO MONGODB
─────────────────────────────
Please check:
1. Password in .env file is correct
2. IP address is whitelisted in MongoDB Atlas
3. Internet connection is working

Temporary fix: The app will still run with local storage.
        `);
        process.exit(1);
    }
    
    // Initialize or import data
    const count = await Video.countDocuments();
    
    if (count === 0) {
        console.log('\n📥 Checking for existing data to import...');
        const importedCount = await importExistingData();
        
        if (importedCount === 0) {
            await initializeDB();
        }
    }
    
    // Start Express server
    app.listen(PORT, () => {
        console.log(`
✅ SERVER STARTED SUCCESSFULLY
─────────────────────────────
Local: http://localhost:${PORT}
API: http://localhost:${PORT}/api/videos
Health: http://localhost:${PORT}/api/health
Info: http://localhost:${PORT}/api/info

📊 To check your MongoDB data:
1. Visit: http://localhost:${PORT}/api/info
2. Or go to MongoDB Atlas → Browse Collections
        `);
    });
}

// Handle graceful shutdown
process.on('SIGINT', async () => {
    console.log('\n🛑 Shutting down...');
    await mongoose.connection.close();
    console.log('✅ MongoDB connection closed');
    process.exit(0);
});

startServer();
