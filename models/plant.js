const mongoose = require("mongoose");

const safetySchema = new mongoose.Schema(
  {
    status: {
      type: String,
      enum: ["verified", "unverified"],
      default: "unverified",
    },

    label: {
      type: String,
      enum: ["Verified", "Unverified"],
      default: "Unverified",
    },
  },
  { _id: false },
);

const plantSchema = new mongoose.Schema({
  fallingFruitId: { type: Number, required: true, unique: true },

  name: { type: String, default: "Unknown" },
  scientificName: { type: String, default: "Unknown" },

  author: { type: String, default: "Not Available" },

  categories: { type: [String], default: [] },

  urls: {
    wikipedia: { type: String, default: null },
    usda: { type: String, default: null },
  },

  description: {
    type: String,
    default: "No description available.",
  },

  address: { type: String, default: "Unknown" },
  location: { type: String, default: "Unknown" },

  season_start: Number,
  season_stop: Number,
  season: { type: String, default: "Unknown" },
  lat: Number,
  lng: Number,

  lastObserved: { type: String, default: "Unknown" },
  access: { type: String, default: "Unknown" },
  fruitingStatus: { type: String, default: "Unknown" },

  imgUrl: { type: String, default: null },
  distance: { type: String, default: "N/A" },

  safety: { type: safetySchema, default: () => ({}) },
  reviewStats: {
    reviewCount: { type: Number, default: 0 },
    averageRating: { type: Number, default: 0 },
  },

  unverified: { type: Boolean, default: false },
  source: { type: String, default: "Falling Fruit" },

  photos: { type: [String], default: [] },
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
