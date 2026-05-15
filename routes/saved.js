const express = require("express");
const router = express.Router();
require("../models/plant");
const UserSchema = require("../models/User");
const Plant = require("../models/plant");

router.get("/", async (req, res) => {
  try {
    const user = await UserSchema.findById(req.user._id).populate(
      "favoritePlants",
    );

    console.log("User's favorite plants:", user.favoritePlants);

    if (!user.favoritePlants || user.favoritePlants.length === 0) {
      return res.render("saved", { savedPlants: [] });
    }

    const savedPlants = await Promise.all(
      user.favoritePlants.map(async (plant) => {
        return await Plant.findById(plant);
      }),
    );

    res.render("saved", { savedPlants });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving saved plants");
  }
});

router.post("/", async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.body;

  try {
    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plant = await Plant.findById(plantId);

    const alreadySaved = user.favoritePlants.some(
      (id) => id.toString() === plant._id.toString(),
    );

    if (alreadySaved) {
      return res.status(400).json({ message: "Plant already in favorites" });
    }

    user.favoritePlants.push(plant._id);
    await user.save();

    res.status(201).json({ message: "Plant added to favorites" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.delete("/", async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.body;

  try {
    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plant = await Plant.findById(plantId);

    user.favoritePlants = user.favoritePlants.filter(
      (id) => id.toString() !== plant._id.toString(),
    );

    await user.save();

    res.status(200).json({ message: "Favorite removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/isFavorite", async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.query;

  try {
    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const isFavorite = user.favoritePlants.some(
      (id) => id.toString() === plantId.toString(),
    );

    res.status(200).json({ isFavorite });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
