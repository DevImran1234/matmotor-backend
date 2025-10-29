import dotenv from "dotenv";
import mongoose from "mongoose";
import Admin from "./models/Admin.js";

dotenv.config();

mongoose
  .connect(process.env.MONGO_URI)
  .then(async () => {
    console.log("Connected to MongoDB");

    const adminExists = await Admin.findOne({ email: "sysadminmatmotors@gmail.com" });
    if (adminExists) {
      console.log("Admin already exists");
      process.exit();
    }

    await Admin.create({
      email: "sysadminmatmotors@gmail.com",
      password: "Admin-matmotors2k25@", // It will be hashed automatically
    });

    console.log("✅ Admin seeded successfully");
    process.exit();
  })
  .catch((err) => console.error(err));
