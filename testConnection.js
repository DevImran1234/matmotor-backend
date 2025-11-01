import mongoose from "mongoose";

const uri =
  "mongodb+srv://imrantahirsubhani_db_user:DiuP4baCVOuKa7Ae@cluster0.o3wl22a.mongodb.net/matmotorDB?retryWrites=true&w=majority&appName=Cluster0";

console.log("🔍 Attempting to connect to MongoDB Atlas...");

mongoose
  .connect(uri, {
    serverSelectionTimeoutMS: 10000,
    socketTimeoutMS: 45000,
  })
  .then(() => {
    console.log("✅ Successfully connected to MongoDB Atlas!");
    process.exit(0);
  })
  .catch((err) => {
    console.error("❌ Connection failed!");
    console.error(err.message);
    process.exit(1);
  });
