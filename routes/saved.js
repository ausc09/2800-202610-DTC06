const express = require("express");
const router = express.Router();
require("../models/Plant");
const UserSchema = require("../models/User");

router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    const user = await UserSchema.findById(req.user._id).populate(
      "favoritePlants",
    );
    const dummyPlants = [
      {
        id: 2,

        name: "Elderberry",
        scientificName: "Sambucus canadensis",

        location: "Queen Elizabeth Park",
        distance: "2.4 km",
        season: "Aug–Sep",

        source: "Falling Fruit",

        safety: {
          status: "caution",
          label: "Caution",
        },
      },
    ];
    res.render("saved", { savedPlants: user.favoritePlants });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving saved plants");
  }
});

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.status(401).json({ message: "You must be logged in" });
}

router.post("/", requireLogin, async (req, res) => {
  const userId = req.user._id;
  const { plantId } = req.body;

  console.log("Received plantId:", plantId);
  console.log("User ID:", userId);
  try {
    const user = await UserSchema.findById(userId);
    console.log("User found:", user);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const alreadySaved = user.favoritePlants.some(
      (id) => id.toString() === plantId,
    );

    if (alreadySaved) {
      return res.status(400).json({ message: "Plant already in favorites" });
    }

    user.favoritePlants.push(plantId);
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

    user.favoritePlants = user.favoritePlants.filter(
      (id) => id.toString() !== plantId,
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

    const isFavorite = user.favoritePlants.some(
      (id) => id.toString() === plantId,
    );

    res.status(200).json({ isFavorite });
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
});

module.exports = router;
