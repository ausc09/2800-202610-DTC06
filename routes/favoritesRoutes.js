const express = require("express");
const router = express.Router();

const Favorite = require("../models/Favorite");

router.post("/", async (req, res) => {
  const { userId, plantId } = req.body;

  try {
    const newFavorite = new Favorite({ userId, plantId });
    await newFavorite.save();

    res.status(201).json(newFavorite);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/:userId", async (req, res) => {
  const { userId } = req.params;

  try {
    const favorites = await Favorite.find({ userId });
    res.status(200).json(favorites);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/", async (req, res) => {
  const { userId, plantId } = req.body;

  try {
    await Favorite.deleteOne({ userId, plantId });
    res.status(200).json({ message: "Favorite removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
