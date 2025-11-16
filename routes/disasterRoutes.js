import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import House from "../models/House.js"; // Assuming House model is created
import axios from "axios";

const router = express.Router();

// Multer in-memory storage for images
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Houses
 *   description: House management for disaster response
 */

/**
 * @swagger
 * /api/houses:
 *   post:
 *     summary: Add a new house with disaster damage details
 *     tags: [Houses]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               houseLocation:
 *                 type: string
 *                 description: The location of the house (address)
 *               houseSize:
 *                 type: string
 *                 description: Size of the house in Marla
 *               damageDescription:
 *                 type: string
 *                 description: Description of the damage (e.g., roof collapse, window broken)
 *               damageTime:
 *                 type: string
 *                 format: date-time
 *                 description: Time when the damage occurred
 *               damageType:
 *                 type: string
 *                 description: Type of disaster (e.g., storm, earthquake)
 *               reportedBy:
 *                 type: string
 *                 description: Name of the person reporting the damage
 *               contactInfo:
 *                 type: string
 *                 description: Contact information of the person reporting the damage
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload multiple images of the damage
 *     responses:
 *       201:
 *         description: House damage reported successfully
 *       400:
 *         description: Missing required fields
 *       500:
 *         description: Error reporting house damage
 */
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const {
      houseLocation,
      houseSize,
      damageDescription,
      damageTime,
      damageType,
      reportedBy,
      contactInfo,
    } = req.body;

    // Validate required fields
    if (!houseLocation || !houseSize || !damageDescription || !damageTime || !damageType || !reportedBy) {
      return res.status(400).json({
        message: "Missing required fields: houseLocation, houseSize, damageDescription, damageTime, damageType, reportedBy",
      });
    }

    // Upload images to Cloudinary
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, {
          folder: "houses",
        });
        imageUrls.push(result.secure_url);
      }
    }

    // Create and save house damage report
    const house = new House({
      houseLocation,
      houseSize,
      damageDescription,
      damageTime,
      damageType,
      reportedBy,
      contactInfo,
      images: imageUrls,
    });

    await house.save();

    res.status(201).json({
      message: "✅ House damage reported successfully",
      house,
    });
  } catch (error) {
    console.error("❌ Error reporting house damage:", error);
    res.status(500).json({
      message: "Error reporting house damage",
      error: error.message || error,
    });
  }
});

/**
 * @swagger
 * /api/houses:
 *   get:
 *     summary: Get all reported houses with damage details
 *     tags: [Houses]
 *     responses:
 *       200:
 *         description: List of houses with damage details
 *       500:
 *         description: Error fetching houses
 */
router.get("/", async (req, res) => {
  try {
    console.log("🏚️ [GET /api/houses] Fetching all houses...");
    const houses = await House.find().sort({ damageTime: -1 });
    console.log(`✅ Found ${houses.length} houses`);

    res.status(200).json(houses);
  } catch (error) {
    console.error("❌ Error in /api/houses:", error);
    res.status(500).json({ message: "Error fetching houses", error: error.message });
  }
});

/**
 * @swagger
 * /api/houses/{id}:
 *   put:
 *     summary: Update a house's damage report
 *     tags: [Houses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: House ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               houseLocation:
 *                 type: string
 *               houseSize:
 *                 type: string
 *               damageDescription:
 *                 type: string
 *               damageTime:
 *                 type: string
 *               damageType:
 *                 type: string
 *               reportedBy:
 *                 type: string
 *               contactInfo:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: House damage report updated successfully
 *       404:
 *         description: House not found
 *       500:
 *         description: Error updating house damage report
 */
router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    // Handle images if they exist
    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, { folder: "houses" });
        imageUrls.push(result.secure_url);
      }
      updateData.images = imageUrls;  // Update the images array
    }

    // Update the house in the database
    const updatedHouse = await House.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedHouse) return res.status(404).json({ message: "House not found" });

    res.status(200).json({ message: "House damage report updated", house: updatedHouse });
  } catch (error) {
    console.error("❌ Error updating house damage:", error);
    res.status(500).json({ message: "Error updating house damage", error });
  }
});

/**
 * @swagger
 * /api/houses/details/{id}:
 *   get:
 *     summary: Get a single house's damage report by ID
 *     tags: [Houses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: House ID
 *     responses:
 *       200:
 *         description: House damage details
 *       404:
 *         description: House not found
 *       500:
 *         description: Error fetching house damage details
 */
router.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const house = await House.findById(id);

    if (!house) return res.status(404).json({ message: "House not found" });

    res.status(200).json(house);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching house details", error });
  }
});


/**
 * @swagger
 * /api/houses/{id}:
 *   delete:
 *     summary: Delete a house's damage report by ID
 *     tags: [Houses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: House ID
 *     responses:
 *       200:
 *         description: House damage report deleted successfully
 *       404:
 *         description: House not found
 *       500:
 *         description: Error deleting house damage report
 */
router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params; // Get the house ID from the request params
    const deletedHouse = await House.findByIdAndDelete(id); // Find the house by ID and delete it

    if (!deletedHouse) {
      return res.status(404).json({ message: "House not found" }); // If house doesn't exist, return 404
    }

    res.status(200).json({ message: "House damage report deleted successfully" }); // Return success message
  } catch (error) {
    console.error("❌ Error deleting house damage:", error);
    res.status(500).json({ message: "Error deleting house damage", error });
  }
});

/**
 * @swagger
 * /api/houses/{id}/replace-images:
 *   put:
 *     summary: Replace the images of a house's damage report
 *     tags: [Houses]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: House ID
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *                 description: Upload multiple images to replace the existing ones
 *     responses:
 *       200:
 *         description: House damage report images replaced successfully
 *       404:
 *         description: House not found
 *       500:
 *         description: Error replacing house damage report images
 */
router.put("/:id/replace-images", upload.array("images", 10), async (req, res) => {
  try {
    const { id } = req.params;
    
    // Find the house by ID
    const house = await House.findById(id);

    if (!house) {
      return res.status(404).json({ message: "House not found" });
    }

    // If new images are uploaded, replace the existing images with the new ones
    const imageUrls = [];
    if (req.files && req.files.length > 0) {
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, { folder: "houses" });
        imageUrls.push(result.secure_url);
      }
    }

    // Replace the images of the house damage report
    house.images = imageUrls;

    // Save the updated house record
    await house.save();

    res.status(200).json({
      message: "✅ House damage report images replaced successfully",
      house,
    });
  } catch (error) {
    console.error("❌ Error replacing house damage images:", error);
    res.status(500).json({
      message: "Error replacing house damage report images",
      error: error.message || error,
    });
  }
});

export default router;
