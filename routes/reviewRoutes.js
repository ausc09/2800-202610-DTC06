const express = require("express");
const router = express.Router();

const Plant = require("../models/plant");
const Review = require("../models/review");

router.get("/:id/new", async (req, res) => {
  try {
    const plant = await Plant.findOne({ fallingFruitId: req.params.id });

    if (!plant) {
      return res.status(404).send("Plant not found");
    }

    res.render("addReview", { plant });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.post("/:plantId", async (req, res) => {
  try {
    const plant = await Plant.findById(req.params.plantId);

    if (!plant) {
      return res.status(404).send("Plant not found");
    }

    const rating = Number(req.body.rating);
    const { fruitingStatus, review, safetyNotes } = req.body;

    if (rating < 1 || rating > 5 || !fruitingStatus) {
      return res.status(400).send("Rating and fruiting status are required");
    }

    const username = [req.user.firstName, req.user.lastName].join(" ");

    await Review.create({
      plantId: plant._id,
      userId: req.user._id,
      username,
      rating,
      fruitingStatus,
      comment: review?.trim(),
      foodSafetyNotes: safetyNotes?.trim(),
    });

    res.redirect(`/plant/${plant.fallingFruitId}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
