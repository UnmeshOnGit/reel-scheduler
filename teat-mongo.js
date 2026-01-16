require('dotenv').config();
const mongoose = require('mongoose');

const MONGODB_URI = process.env.MONGODB_URI;

async function testConnection() {
    console.log('🔌 Testing MongoDB Atlas Connection...');
    console.log('📡 URI:', MONGODB_URI ? 'Configured' : 'Not configured');
    
    if (!MONGODB_URI) {
        console.error('❌ ERROR: MONGODB_URI not found in .env file');
        console.log('💡 Create a .env file with:');
        console.log('MONGODB_URI=mongodb+srv://username:password@cluster0.xxxxx.mongodb.net/reel-scheduler?retryWrites=true&w=majority');
        return;
    }
    
    try {
        await mongoose.connect(MONGODB_URI, {
            useNewUrlParser: true,
            useUnifiedTopology: true,
            serverSelectionTimeoutMS: 5000,
        });
        
        console.log('✅ SUCCESS: Connected to MongoDB Atlas!');
        console.log('📊 Database:', mongoose.connection.db.databaseName);
        console.log('📍 Host:', mongoose.connection.host);
        
        // Test a simple operation
        const collections = await mongoose.connection.db.listCollections().toArray();
        console.log('🗂️ Collections:', collections.map(c => c.name));
        
        await mongoose.disconnect();
        console.log('🔌 Disconnected successfully');
        
    } catch (error) {
        console.error('❌ CONNECTION FAILED:', error.message);
        console.log('💡 Common issues:');
        console.log('1. Wrong password - check your Atlas dashboard');
        console.log('2. IP not whitelisted - add 0.0.0.0/0 to Network Access');
        console.log('3. Wrong cluster URL - check connection string format');
        console.log('4. Network issues - check your internet connection');
    }
}

testConnection();