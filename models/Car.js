import mongoose from "mongoose";

const carSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    carBrand: { type: String, required: true },
    carModel: { type: String, required: true },
    price: { type: String, required: true },
    status: {
      type: String,
      enum: ["in-stock", "out-of-stock"],
      default: "in-stock",
    },
    color: { type: String },
    model: { type: String },
    mileage: { type: String },
    description: { type: String },
    images: [{ type: String }],
    fuelType: {
      type: String,
      enum: ["Petrol", "Diesel", "Hybrid", "Electric"],
      required: true,
    },
    engineCapacity: { type: String },
    gear: { type: String },
    doors: { 
      type: Number, 
      required: true,
      enum: [2, 3, 4, 5, 6, 7, 8, 9, 10],  // Door values from 2 to 10
    },
    seats: { 
      type: Number, 
      required: true,
      enum: [2, 3, 4, 5, 6, 7, 8, 9, 10],  // Seat values from 2 to 10
    },
    emissionClass: {
      type: String,
      enum: ["Euro 5", "Euro 6", "Euro 7"],  // Emission classes like Euro 5, Euro 6, Euro 7
    },
    previousOwners: {
      type: Number,
      required: true,
      min: 0,  // Ensure it can't be a negative number
    },
  },
  { timestamps: true }
);

export default mongoose.model("Car", carSchema);
