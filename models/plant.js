const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  username: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now },
});

const plantSchema = new mongoose.Schema({
  fallingFruitId: { type: Number, required: true, unique: true },
  address: String,
  season_start: Number,
  season_stop: Number,
  lat: Number,
  lng: Number,
  photos: [String],
  reviews: [reviewSchema],
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
