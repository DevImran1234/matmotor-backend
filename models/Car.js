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
    aboutCar: { type: String },
    description: { type: String },
    images: [{ type: String }],
  },
  { timestamps: true }
);

export default mongoose.model("Car", carSchema);
