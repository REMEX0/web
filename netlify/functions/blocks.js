const { MongoClient } = require('mongodb');

exports.handler = async function(event, context) {
    const MONGODB_URI = "mongodb+srv://stararmx_db_user:mOJAN8MDZCrYeoAj@cluster0.kvpxrlu.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0";
    const DB_NAME = process.env.DB_NAME || 'myapp';
    
    if (!MONGODB_URI) {
        return { statusCode: 500, body: 'Database not configured' };
    }

    try {
        const client = new MongoClient(MONGODB_URI);
        await client.connect();
        
        const db = client.db(DB_NAME);
        const usersCollection = db.collection('users');
        
        if (event.httpMethod === 'GET') {
            // Get user blocks
            const { email } = event.queryStringParameters;
            
            const user = await usersCollection.findOne({ email });
            await client.close();
            
            if (user) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, blocks: user.blocks || [] })
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ success: false, message: 'User not found' })
                };
            }
            
        } else if (event.httpMethod === 'POST') {
            // Add new block
            const { email, block } = JSON.parse(event.body);
            
            const result = await usersCollection.updateOne(
                { email },
                { $push: { blocks: block } }
            );
            
            await client.close();
            
            if (result.modifiedCount > 0) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, message: 'Block added successfully' })
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ success: false, message: 'User not found' })
                };
            }
            
        } else if (event.httpMethod === 'DELETE') {
            // Delete block
            const { email, blockId } = JSON.parse(event.body);
            
            const result = await usersCollection.updateOne(
                { email },
                { $pull: { blocks: { id: blockId } } }
            );
            
            await client.close();
            
            if (result.modifiedCount > 0) {
                return {
                    statusCode: 200,
                    body: JSON.stringify({ success: true, message: 'Block deleted successfully' })
                };
            } else {
                return {
                    statusCode: 404,
                    body: JSON.stringify({ success: false, message: 'Block not found' })
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
