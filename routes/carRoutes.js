import express from "express";
import multer from "multer";
import cloudinary from "../config/cloudinary.js";
import Car from "../models/Car.js";
import axios from "axios";

const router = express.Router();

// Multer in-memory storage
const storage = multer.memoryStorage();
const upload = multer({ storage });

/**
 * @swagger
 * tags:
 *   name: Cars
 *   description: Car management
 */

/**
 * @swagger
 * /api/cars:
 *   post:
 *     summary: Add a new car
 *     tags: [Cars]
 *     requestBody:
 *       required: true
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [in-stock, out-of-stock]
 *               color:
 *                 type: string
 *               model:
 *                 type: string
 *               mileage:
 *                 type: string
 *               bodyType:
 *                 type: string
 *               aboutCar:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       201:
 *         description: Car uploaded successfully
 *       500:
 *         description: Error uploading car
 */
router.post("/", upload.array("images", 10), async (req, res) => {
  try {
    const {
      name,
      carBrand,   
      carModel,   
      price,
      status,
      color,
      model,
      mileage,
            aboutCar,
      description,
    } = req.body;

    const imageUrls = [];
    for (const file of req.files) {
      const b64 = Buffer.from(file.buffer).toString("base64");
      const dataURI = `data:${file.mimetype};base64,${b64}`;
      const result = await cloudinary.uploader.upload(dataURI, { folder: "cars" });
      imageUrls.push(result.secure_url);
    }

    const car = new Car({
      name,
      carBrand,   
      carModel,   
      price,
      status,
      color,
      model,
      mileage,
      aboutCar,
      description,
      images: imageUrls,
    });

    await car.save();

    res.status(201).json({ message: "Car uploaded successfully", car });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error uploading car", error });
  }
});

/**
 * @swagger
 * /api/cars:
 *   get:
 *     summary: Get all cars
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of cars
 *       500:
 *         description: Error fetching cars
 */
router.get("/", async (req, res) => {
  try {
    const cars = await Car.find().sort({ createdAt: -1 });
    res.status(200).json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching cars", error });
  }
});

/**
 * @swagger
 * /api/cars/{id}:
 *   put:
 *     summary: Update a car
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     requestBody:
 *       required: false
 *       content:
 *         multipart/form-data:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *               price:
 *                 type: string
 *               status:
 *                 type: string
 *                 enum: [in-stock, out-of-stock]
 *               color:
 *                 type: string
 *               model:
 *                 type: string
 *               mileage:
 *                 type: string
 *               bodyType:
 *                 type: string
 *               aboutCar:
 *                 type: string
 *               description:
 *                 type: string
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                   format: binary
 *     responses:
 *       200:
 *         description: Car updated successfully
 *       404:
 *         description: Car not found
 *       500:
 *         description: Error updating car
 *
 *   delete:
 *     summary: Delete a car
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car deleted successfully
 *       404:
 *         description: Car not found
 *       500:
 *         description: Error deleting car
 */

/**
 * @swagger
 * /api/cars/filter:
 *   get:
 *     summary: Filter cars by brand, model, price range, or color
 *     tags: [Cars]
 *     parameters:
 *       - in: query
 *         name: name
 *         schema:
 *           type: string
 *         description: Car brand or name (e.g., Toyota)
 *       - in: query
 *         name: model
 *         schema:
 *           type: string
 *         description: Car model (e.g., Corolla)
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: color
 *         schema:
 *           type: string
 *         description: Car color
 *     responses:
 *       200:
 *         description: Filtered list of cars
 *       500:
 *         description: Error fetching filtered cars
 */
router.get("/filter", async (req, res) => {
  try {
    const { name, model, minPrice, maxPrice, color, bodyType, status } = req.query;

    const filters = {};

    // Match by name or carBrand
    if (name) {
      filters.$or = [
        { name: { $regex: name, $options: "i" } },
        { carBrand: { $regex: name, $options: "i" } },
      ];
    }

    // Match by model or carModel
    if (model) {
      filters.$or = filters.$or || [];
      filters.$or.push({ model: { $regex: model, $options: "i" } });
      filters.$or.push({ carModel: { $regex: model, $options: "i" } });
    }

    if (color) {
      filters.color = { $regex: color, $options: "i" };
    }

    if (bodyType) {
      filters.bodyType = { $regex: bodyType, $options: "i" };
    }

    if (status) {
      filters.status = status;
    }

    // Handle price range
    if (minPrice || maxPrice) {
      // Convert price like "50k" → 50000
      const parsePrice = (val) =>
        val?.toLowerCase().includes("k") ? Number(val.replace("k", "")) * 1000 : Number(val);

      filters.price = {};
      if (minPrice) filters.price.$gte = parsePrice(minPrice);
      if (maxPrice && maxPrice !== "+") filters.price.$lte = parsePrice(maxPrice);
    }

    const cars = await Car.find(filters).sort({ createdAt: -1 });

    res.status(200).json(cars);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error filtering cars", error });
  }
});
/**
 * @swagger
 * /api/cars/brands:
 *   get:
 *     summary: Fetch all car brands from external API
 *     tags: [Cars]
 *     responses:
 *       200:
 *         description: List of car brands from external API
 *       500:
 *         description: Error fetching brands
 */


router.get("/brands", async (req, res) => {
  try {
    const response = await axios.get(
      "https://www.carqueryapi.com/api/0.3/?cmd=getMakes&sold_in_us=1"
    );

    // CarQuery sometimes returns wrapped JSON, so handle both cases safely
    let data;

    if (typeof response.data === "string") {
      // if it's a string, clean and parse it
      data = JSON.parse(
        response.data
          .replace("var carquery_make_list = ", "")
          .replace(/;$/, "")
      );
    } else {
      // if it's already JSON
      data = response.data;
    }

    const brands =
      data?.Makes?.map((make) => make.make_display)?.sort() || [];

    res.status(200).json(brands);
  } catch (error) {
    console.error("Error fetching car brands:", error.message);
    res
      .status(500)
      .json({ message: "Error fetching car brands", error: error.message });
  }
});

router.put("/:id", upload.array("images", 10), async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = { ...req.body };

    if (req.files && req.files.length > 0) {
      const imageUrls = [];
      for (const file of req.files) {
        const b64 = Buffer.from(file.buffer).toString("base64");
        const dataURI = `data:${file.mimetype};base64,${b64}`;
        const result = await cloudinary.uploader.upload(dataURI, { folder: "cars" });
        imageUrls.push(result.secure_url);
      }
      updateData.images = imageUrls;
    }

    const updatedCar = await Car.findByIdAndUpdate(id, updateData, { new: true });

    if (!updatedCar) return res.status(404).json({ message: "Car not found" });

    res.status(200).json({ message: "Car updated successfully", car: updatedCar });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error updating car", error });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const deletedCar = await Car.findByIdAndDelete(id);

    if (!deletedCar) return res.status(404).json({ message: "Car not found" });

    res.status(200).json({ message: "Car deleted successfully" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error deleting car", error });
  }
});


/**
 * @swagger
 * /api/cars/{id}:
 *   get:
 *     summary: Get a single car by ID
 *     tags: [Cars]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *         description: Car ID
 *     responses:
 *       200:
 *         description: Car details
 *       404:
 *         description: Car not found
 *       500:
 *         description: Error fetching car
 */
router.get("/details/:id", async (req, res) => {
  try {
    const { id } = req.params;
    const car = await Car.findById(id);

    if (!car) return res.status(404).json({ message: "Car not found" });

    res.status(200).json(car);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Error fetching car", error });
  }
});

export default router;
