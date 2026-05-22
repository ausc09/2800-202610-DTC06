const express = require("express");
const router = express.Router();

const UserSchema = require("../models/User");
const Plant = require("../models/plant");
const { formatSeasonText } = require("../helpers/plantHelpers");

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }

  return res.redirect("/login");
}

const Review = require("../models/review");

function reviewPhotoSrc(review) {
  if (!review?.photo?.data) return null;
  const b64 = review.photo.data.toString("base64");
  return `data:${review.photo.contentType};base64,${b64}`;
}

async function getHeroPhoto(plantId) {
  const review = await Review.findOne({
    plantId,
    "photo.data": { $exists: true },
  }).sort({ date: -1 }).lean();
  return review ? reviewPhotoSrc(review) : null;
}

router.get("/", requireLogin, async (req, res) => {
  try {
    const user = await UserSchema.findById(req.user._id).populate(
      "favoritePlants",
    );

    if (!user.favoritePlants || user.favoritePlants.length === 0) {
      return res.render("saved", { savedPlants: [] });
    }

    const savedPlants = await Promise.all(
      user.favoritePlants.map(async (plant) => {
        const obj = plant.toObject();
        obj.season = formatSeasonText(plant.season_start, plant.season_stop);
        obj.heroPhoto = await getHeroPhoto(plant._id);
        return obj;
      })
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

    const plant = await Plant.findOne({ fallingFruitId: Number(plantId) });

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

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

    const plant = await Plant.findOne({ fallingFruitId: Number(plantId) });

    if (!plant) {
      return res.status(404).json({ message: "Plant not found" });
    }

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
  try {
    const { plantId } = req.query;

    if (!req.user) {
      return res.status(200).json({ isFavorite: false });
    }

    const user = await UserSchema.findById(req.user._id);

    if (!user) {
      return res.status(200).json({ isFavorite: false });
    }

    const plant = await Plant.findOne({ fallingFruitId: Number(plantId) });

    if (!plant) {
      return res.status(200).json({ isFavorite: false });
    }

    const isFavorite = user.favoritePlants.some(
      (id) => id.toString() === plant._id.toString(),
    );

    res.status(200).json({ isFavorite });
  } catch (error) {
    console.error(error);
    res.status(200).json({ isFavorite: false });
  }
});

module.exports = router;
