require('dotenv').config();

const express = require('express');
const mongoose = require('mongoose');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 3000;

// MongoDB Atlas connection string
// Get this from MongoDB Atlas dashboard after creating a cluster
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb+srv://unmeshsutar33_db_user:Mq1vy7xcj2chIlz6@cluster0.pg6xtap.mongodb.net/?appName=Cluster0';

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '.')));

// MongoDB Schema and Model
const videoSchema = new mongoose.Schema({
    id: {
        type: Number,
        required: true,
        unique: true
    },
    name: {
        type: String,
        required: true
    },
    contentType: {
        type: String,
        default: 'Dance',
        enum: ['Dance', 'Vlog', 'BTS', 'Motivation', 'Brand Collab', 'Tutorial', 'Music', 'Other']
    },
    shoot: {
        type: String,
        default: 'Pending',
        enum: ['Done', 'Pending']
    },
    edit: {
        type: String,
        default: 'Pending',
        enum: ['Done', 'Pending']
    },
    igUpload: {
        type: String,
        default: 'Not',
        enum: ['Not', 'Scheduled', 'Uploaded']
    },
    ytUpload: {
        type: String,
        default: 'Not',
        enum: ['Not', 'Scheduled', 'Uploaded']
    },
    igDate: {
        type: String,
        default: ''
    },
    ytDate: {
        type: String,
        default: ''
    },
    views: {
        type: Number,
        default: 0,
        min: 0
    },
    likes: {
        type: Number,
        default: 0,
        min: 0
    },
    notes: {
        type: String,
        default: ''
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
});

// Update the updatedAt field on save
videoSchema.pre('save', function(next) {
    this.updatedAt = Date.now();
    next();
});

const Video = mongoose.model('Video', videoSchema);

// Initialize database with sample data
async function initDatabase() {
    try {
        console.log('🔌 Attempting to connect to MongoDB Atlas...');
        console.log('📡 Connection String:', process.env.MONGODB_URI ? 'Configured' : 'Not configured');
        
        if (!process.env.MONGODB_URI) {
            console.log('⚠️  MONGODB_URI environment variable not set');
            console.log('ℹ️  Create a .env file with: MONGODB_URI=your_connection_string');
            console.log('📁 Using fallback: local file storage only');
            return;
        }
        
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000, // Timeout after 5 seconds
            socketTimeoutMS: 45000, // Close sockets after 45 seconds of inactivity
        });
        
        console.log('✅ Connected to MongoDB Atlas successfully!');
        
        // Check if we have any videos, if not add sample data
        const videoCount = await Video.countDocuments();
        if (videoCount === 0) {
            console.log('📝 Adding sample data to database...');
            
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
            console.log('✅ Sample data added successfully');
        } else {
            console.log(`✅ Database already has ${videoCount} videos`);
        }
        
    } catch (error) {
        console.error('❌ MongoDB Connection Error:', error.message);
        console.log('📁 Using local file storage as fallback');
        
        // Create a fallback data.json file if it doesn't exist
        const fs = require('fs').promises;
        const DATA_FILE = path.join(__dirname, 'data.json');
        
        try {
            await fs.access(DATA_FILE);
            console.log('📁 Found existing data.json file');
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
                    }
                ],
                version: "1.0.0",
                lastUpdated: new Date().toISOString()
            };
            await fs.writeFile(DATA_FILE, JSON.stringify(initialData, null, 2));
            console.log('📁 Created data.json file with sample data');
        }
    }
}

// GET all videos (works with both MongoDB and file system)
app.get('/api/videos', async (req, res) => {
    try {
        // Try MongoDB first
        if (mongoose.connection.readyState === 1) {
            const videos = await Video.find().sort({ id: 1 }).lean();
            return res.json({
                videos,
                version: "2.0.0",
                lastUpdated: new Date().toISOString(),
                source: 'mongodb',
                totalCount: videos.length
            });
        }
        
        // Fallback to file system
        const fs = require('fs').promises;
        const DATA_FILE = path.join(__dirname, 'data.json');
        const data = await fs.readFile(DATA_FILE, 'utf8');
        const parsed = JSON.parse(data);
        
        res.json({
            ...parsed,
            source: 'file-system',
            lastUpdated: new Date().toISOString()
        });
        
    } catch (error) {
        console.error('❌ Error fetching videos:', error);
        res.status(500).json({ 
            error: 'Failed to fetch videos',
            message: error.message,
            source: 'error'
        });
    }
});

// POST save videos (works with both MongoDB and file system)
app.post('/api/videos', async (req, res) => {
    try {
        const { videos } = req.body;
        
        if (!Array.isArray(videos)) {
            return res.status(400).json({ error: 'Videos must be an array' });
        }
        
        const response = {
            success: true,
            message: `Data saved successfully (${videos.length} videos)`,
            lastUpdated: new Date().toISOString(),
            savedTo: []
        };
        
        // Save to MongoDB if connected
        if (mongoose.connection.readyState === 1) {
            try {
                await Video.deleteMany({});
                if (videos.length > 0) {
                    await Video.insertMany(videos);
                }
                response.savedTo.push('mongodb');
                console.log(`💾 Saved ${videos.length} videos to MongoDB`);
            } catch (mongoError) {
                console.error('MongoDB save failed:', mongoError);
            }
        }
        
        // Always save to file as backup
        const fs = require('fs').promises;
        const DATA_FILE = path.join(__dirname, 'data.json');
        const data = { 
            videos, 
            version: "2.0.0",
            lastUpdated: new Date().toISOString() 
        };
        
        await fs.writeFile(DATA_FILE, JSON.stringify(data, null, 2));
        response.savedTo.push('file-system');
        console.log(`📁 Saved ${videos.length} videos to data.json`);
        
        res.json(response);
        
    } catch (error) {
        console.error('❌ Error saving videos:', error);
        res.status(500).json({ 
            error: 'Failed to save data',
            message: error.message 
        });
    }
});

// GET single video by ID
app.get('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findOne({ id: parseInt(req.params.id) });
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        res.json(video);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// PUT update single video
app.put('/api/videos/:id', async (req, res) => {
    try {
        const video = await Video.findOneAndUpdate(
            { id: parseInt(req.params.id) },
            { ...req.body, updatedAt: Date.now() },
            { new: true, runValidators: true }
        );
        
        if (!video) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Video updated successfully',
            video 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// DELETE single video
app.delete('/api/videos/:id', async (req, res) => {
    try {
        const result = await Video.findOneAndDelete({ id: parseInt(req.params.id) });
        
        if (!result) {
            return res.status(404).json({ error: 'Video not found' });
        }
        
        res.json({ 
            success: true, 
            message: 'Video deleted successfully' 
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// GET database health
app.get('/api/db-health', async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        const videoCount = await Video.countDocuments();
        
        res.json({
            database: isConnected ? 'connected' : 'disconnected',
            connectionState: mongoose.connection.readyState,
            videoCount: videoCount,
            lastUpdated: new Date().toISOString(),
            mongodbUri: process.env.MONGODB_URI ? 'configured' : 'not configured'
        });
    } catch (error) {
        res.status(500).json({ 
            database: 'error',
            error: error.message 
        });
    }
});

// GET health check
app.get('/api/health', (req, res) => {
    res.json({ 
        status: 'OK', 
        timestamp: new Date().toISOString(),
        environment: process.env.NODE_ENV || 'development',
        nodeVersion: process.version
    });
});

// GET app info
app.get('/api/info', async (req, res) => {
    try {
        const isConnected = mongoose.connection.readyState === 1;
        const videoCount = isConnected ? await Video.countDocuments() : 0;
        
        res.json({
            app: 'Reel Scheduler',
            version: '2.0.0',
            database: isConnected ? 'MongoDB Atlas' : 'Not connected',
            totalVideos: videoCount,
            environment: process.env.NODE_ENV || 'development',
            lastUpdated: new Date().toISOString()
        });
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Backup endpoint - export all data as JSON
app.get('/api/backup', async (req, res) => {
    try {
        const videos = await Video.find().sort({ id: 1 }).lean();
        
        const backupData = {
            videos: videos,
            exportDate: new Date().toISOString(),
            version: "2.0.0",
            totalVideos: videos.length
        };
        
        res.setHeader('Content-Disposition', 'attachment; filename="reel-scheduler-backup.json"');
        res.setHeader('Content-Type', 'application/json');
        res.json(backupData);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
});

// Serve frontend for any other route
app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});

// Graceful shutdown
process.on('SIGINT', async () => {
    console.log('🛑 Shutting down gracefully...');
    if (mongoose.connection.readyState) {
        await mongoose.connection.close();
        console.log('✅ MongoDB connection closed');
    }
    process.exit(0);
});

// Initialize and start server
initDatabase().then(() => {
    app.listen(PORT, '0.0.0.0', () => {
        console.log(`
    ╔══════════════════════════════════════════════════════╗
    ║         Reel Scheduler with MongoDB Atlas           ║
    ╠══════════════════════════════════════════════════════╣
    ║   Server: http://localhost:${PORT}                   
    ║   Environment: ${process.env.NODE_ENV || 'development'}
    ║   Database: ${mongoose.connection.readyState === 1 ? '✅ Connected' : '❌ Not connected'}
    ║   MongoDB URI: ${process.env.MONGODB_URI ? 'Configured' : 'Not configured'}
    ╠══════════════════════════════════════════════════════╣
    ║   API Endpoints:                                    
    ║   - GET    /api/videos           - Get all videos   
    ║   - POST   /api/videos           - Save all videos  
    ║   - GET    /api/videos/:id       - Get single video 
    ║   - PUT    /api/videos/:id       - Update video     
    ║   - DELETE /api/videos/:id       - Delete video     
    ║   - GET    /api/health           - Health check     
    ║   - GET    /api/db-health        - Database health  
    ║   - GET    /api/info             - App info         
    ║   - GET    /api/backup           - Export backup    
    ╚══════════════════════════════════════════════════════╝
        `);
    });
}).catch(error => {
    console.error('❌ Failed to start server:', error);
    process.exit(1);
});
