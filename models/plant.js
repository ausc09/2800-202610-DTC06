const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  username: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now },
});

const safetySchema = new mongoose.Schema(
  {
    status: { type: String, default: "safe" },
    label: { type: String, default: "Safe" },
  },
  { _id: false },
);

const plantSchema = new mongoose.Schema({
  fallingFruitId: { type: Number, required: true, unique: true },

  name: { type: String, default: "Unknown" },
  scientificName: { type: String, default: "Unknown" },

  address: { type: String, default: "Unknown" },
  location: { type: String, default: "Unknown" },

  season_start: Number,
  season_stop: Number,
  season: { type: String, default: "Unknown" },
  lat: Number,
  lng: Number,

  lastObserved: { type: String, default: "Unknown" },
  access: { type: String, default: "Unknown" },
  fruitingStatus: { type: String, default: "Ready to pick" },

  imgUrl: { type: String, default: null },
  distance: { type: String, default: "N/A" },

  safety: { type: safetySchema, default: () => ({}) },

  unverified: { type: Boolean, default: false },
  source: { type: String, default: "Falling Fruit" },

  photos: { type: [String], default: [] },
  reviews: { type: [reviewSchema], default: [] },
  photos: [String],
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
