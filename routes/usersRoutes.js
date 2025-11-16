import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken"; // To generate JWT
import User from "../models/User.js"; // User model

const router = express.Router();

// Signup API
/**
 * @swagger
 * tags:
 *   name: Auth
 *   description: User authentication (login and signup)
 */

/**
 * @swagger
 * /api/auth/signup:
 *   post:
 *     summary: Register a new user
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       201:
 *         description: User created successfully
 *       400:
 *         description: Invalid data or user already exists
 *       500:
 *         description: Error during registration
 */
router.post("/signup", async (req, res) => {
  const { email, password, name } = req.body;  // Accept name from request body

  try {
    // Check if user already exists
    const userExists = await User.findOne({ email });
    if (userExists) {
      return res.status(400).json({ message: "User already exists" });
    }

    // Create a new user with email, password, and name
    const user = new User({
      email,
      password,
      name,  // Store the name in the database
    });

    await user.save();

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d", // Token expiration (30 days)
    });

    res.status(201).json({
      message: "User created successfully",
      token,
    });
  } catch (error) {
    console.error("❌ Error signing up:", error);
    res.status(500).json({ message: "Error during registration", error: error.message });
  }
});


// Login API
/**
 * @swagger
 * /api/auth/login:
 *   post:
 *     summary: Login with email and password
 *     tags: [Auth]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *                 description: User's email
 *               password:
 *                 type: string
 *                 description: User's password
 *     responses:
 *       200:
 *         description: Login successful, returns JWT
 *       401:
 *         description: Invalid credentials
 *       500:
 *         description: Error during login
 */
router.post("/login", async (req, res) => {
  const { email, password } = req.body;

  try {
    // Find the user by email
    const user = await User.findOne({ email });
    if (!user) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Check if the password matches
    const isMatch = await user.matchPassword(password);
    if (!isMatch) {
      return res.status(401).json({ message: "Invalid credentials" });
    }

    // Generate a JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "30d", // Token expiration (30 days)
    });

    res.status(200).json({
      message: "Login successful",
      token,
    });
  } catch (error) {
    console.error("❌ Error logging in:", error);
    res.status(500).json({ message: "Error during login", error: error.message });
  }
});

export default router;
