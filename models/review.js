const mongoose = require("mongoose");

const reviewSchema = new mongoose.Schema({
  plantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "Plant",
    required: true,
  },
  userId: { type: mongoose.Schema.Types.ObjectId, ref: "User", required: true },
  username: { type: String, required: true },
  rating: { type: Number, required: true, min: 1, max: 5 },
  fruitingStatus: { type: String, required: true },
  comment: { type: String, maxlength: 500 },
  foodSafetyNotes: String,
  photoUrl: String,
  date: { type: Date, default: Date.now },
});


const Review = mongoose.model("Review", reviewSchema);

module.exports = Review;
