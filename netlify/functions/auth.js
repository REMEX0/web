const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, email, password } = JSON.parse(event.body);
        const MONGODB_URI = "mongodb+srv://stararmx_db_user:mOJAN8MDZCrYeoAj@cluster0.kvpxrlu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";;
        const DB_NAME = process.env.DB_NAME || 'myapp';
        
        if (!MONGODB_URI) {
            throw new Error('MongoDB connection string not found');
        }

        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        
        if (action === 'register') {
            // Check if user exists
            const existingUser = await usersCollection.findOne({ email });
            if (existingUser) {
                await client.close();
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: 'User already exists' })
                };
            }
            
            // Create new user
            await usersCollection.insertOne({
                email,
                password, // Note: In production, hash the password!
                blocks: [],
                createdAt: new Date()
            });
            
            await client.close();
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'User created successfully' })
            };
            
        } else if (action === 'login') {
            // Find user
            const user = await usersCollection.findOne({ email, password });
            await client.close();
            
            if (user) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, message: 'Login successful' })
                };
            } else {
                return {
                    statusCode: 401,
                    body: JSON.stringify({ success: false, message: 'Invalid credentials' })
                };
            }
        }
        
    } catch (error) {
        console.error('Database error:', error);
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: 'Server error: ' + error.message })
        };
    }

};
