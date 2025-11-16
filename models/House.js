import mongoose from "mongoose";

const houseSchema = new mongoose.Schema(
  {
    houseLocation: { type: String, required: true }, // Location of the house (address)
    houseSize: { type: String, required: true }, // Size of the house (in Marla)
    damageDescription: { type: String, required: true }, // Description of the damage (e.g., roof collapse)
    damageTime: { type: Date, required: true }, // Time when the damage occurred
    damageType: {
      type: String,
      enum: ["storm", "earthquake", "flood", "fire", "other"], // Type of disaster
      required: true,
    },
    images: [{ type: String }], // Array to store image URLs of the damage
    reportedBy: { type: String, required: true }, // Name of the person reporting the damage
    contactInfo: { type: String }, // Contact information of the person reporting the damage (optional)
    status: {
      type: String,
      enum: ["reported", "under_assessment", "resolved"], // Status of the damage report
      default: "reported",
    },
  },
  { timestamps: true } // Automatically tracks the time of creation and update
);

export default mongoose.model("House", houseSchema);
