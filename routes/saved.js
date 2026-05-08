const express = require("express");
const router = express.Router();
require("../models/Plant");
const UserSchema = require("../models/User");
const {
  getOrCreatePlant,
  formatPlantItem,
} = require("../helpers/plantHelpers");

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({
    message: "You must be logged in",
    redirectTo: "/login",
  });
}

router.get("/", requireLogin, async (req, res) => {
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
        const response = await fetch(
          `http://localhost:3000/plant/information/${plant.fallingFruitId}`,
        );

        if (!response.ok) {
          throw new Error("Could not fetch plant information");
        }

        return await response.json();
      }),
    );

    res.render("saved", { savedPlants });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving saved plants");
  }
});

router.post("/", requireLogin, async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.body;

  try {
    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plant = await getOrCreatePlant(plantId);

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

router.delete("/", requireLogin, async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.body;

  try {
    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plant = await getOrCreatePlant(plantId);

    user.favoritePlants = user.favoritePlants.filter(
      (id) => id.toString() !== plant._id.toString(),
    );

    await user.save();

    res.status(200).json({ message: "Favorite removed" });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

router.get("/isFavorite", requireLogin, async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.query;

  try {
    const user = await UserSchema.findById(userId);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const plant = await getOrCreatePlant(plantId);

    const isFavorite = user.favoritePlants.some(
      (id) => id.toString() === plant._id.toString(),
    );

    res.status(200).json({ isFavorite });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
