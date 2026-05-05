const mongoose = require("mongoose");

const favoriteSchema = new mongoose.Schema({
  userId: { type: String, required: true },
  plantId: { type: String, required: true },
});

const Favorite = mongoose.model("Favorite", favoriteSchema);

module.exports = Favorite;
