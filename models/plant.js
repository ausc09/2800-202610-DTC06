const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  username: String,
  rating: Number,
  comment: String,
  date: { type: Date, default: Date.now },
});

const plantSchema = new mongoose.Schema({
  name: String,
  scientificName: String,
  description: String,
  location: {
    lat: Number,
    lng: Number,
  },
  season: String,
  access: String,
  fruitingStatus: String,
  photos: [String],
  reviews: [reviewSchema],
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
