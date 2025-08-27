const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
    if (event.httpMethod !== 'POST') {
        return { statusCode: 405, body: 'Method Not Allowed' };
    }

    try {
        const { action, email, password } = JSON.parse(event.body);
        const uri = process.env.MONGODB_URI;
        
        const client = new MongoClient(uri);
        await client.connect();
        
        const db = client.db('myapp');
        const users = db.collection('users');
        
        if (action === 'register') {
            // Check if user exists
            const existingUser = await users.findOne({ email });
            if (existingUser) {
                return {
                    statusCode: 400,
                    body: JSON.stringify({ success: false, message: 'User already exists' })
                };
            }
            
            // Create new user
            await users.insertOne({
                email,
                password, // Note: In production, hash the password!
                blocks: [],
                createdAt: new Date()
            });
            
            return {
                statusCode: 200,
                body: JSON.stringify({ success: true, message: 'User created successfully' })
            };
        } else if (action === 'login') {
            // Find user
            const user = await users.findOne({ email, password });
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
        
        await client.close();
        
    } catch (error) {
        return {
            statusCode: 500,
            body: JSON.stringify({ success: false, message: error.message })
        };
    }
};