const mongoose = require("mongoose");

const plantSchema = new mongoose.Schema({
  fallingFruitId: { type: Number, required: true, unique: true },
  address: String,
  season_start: Number,
  season_stop: Number,
  lat: Number,
  lng: Number,
  photos: [String],
});

const Plant = mongoose.model("Plant", plantSchema);

module.exports = Plant;
