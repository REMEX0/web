const { MongoClient } = require("mongodb");

let cachedClient = null;
let cachedDb = null;

async function connectToDatabase() {
  if (cachedClient && cachedDb) {
    return { client: cachedClient, db: cachedDb };
  }

  const MONGODB_URI =
    process.env.MONGODB_URI ||
    "mongodb+srv://stararmx_db_user:mOJAN8MDZCrYeoAj@cluster0.kvpxrlu.mongodb.net/myapp?retryWrites=true&w=majority&appName=Cluster0";

  const DB_NAME = process.env.DB_NAME || "myapp";

  if (!MONGODB_URI) throw new Error("MongoDB URI missing");

  const client = new MongoClient(MONGODB_URI);
  await client.connect();

  const db = client.db(DB_NAME);

  cachedClient = client;
  cachedDb = db;

  return { client, db };
}

exports.handler = async function (event, context) {
  if (event.httpMethod !== "POST") {
    return { statusCode: 405, body: "Method Not Allowed" };
  }

  try {
    const { action, email, password } = JSON.parse(event.body);

    const { db } = await connectToDatabase();
    const usersCollection = db.collection("users");

    if (action === "register") {
      const existingUser = await usersCollection.findOne({ email });
      if (existingUser) {
        return {
          statusCode: 400,
          body: JSON.stringify({ success: false, message: "User already exists" }),
        };
      }

      await usersCollection.insertOne({
        email,
        password, // ⚠️ لازم تعمل hashing في production
        blocks: [],
        createdAt: new Date(),
      });

      return {
        statusCode: 200,
        body: JSON.stringify({ success: true, message: "User created successfully" }),
      };
    } else if (action === "login") {
      const user = await usersCollection.findOne({ email, password });

      if (user) {
        return {
          statusCode: 200,
          body: JSON.stringify({ success: true, message: "Login successful" }),
        };
      } else {
        return {
          statusCode: 401,
          body: JSON.stringify({ success: false, message: "Invalid credentials" }),
        };
      }
    }
  } catch (error) {
    console.error("Database error:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ success: false, message: "Server error: " + error.message }),
    };
  }
};
