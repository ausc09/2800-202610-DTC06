const express = require("express");
const router = express.Router();
const multer = require("multer");

const Plant = require("../models/plant");
const Review = require("../models/review");
const { validatePlantImage } = require("../helpers/visionHelpers");

const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 },
});

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

router.post("/api/validate-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        passed: false,
        message: "Please upload plant image.",
      });
    }

    const base64Image = req.file.buffer.toString("base64");
    const result = await validatePlantImage(base64Image);

    if (!result.passed) {
      return res.json({
        passed: false,
        message: "Please upload plant image.",
      });
    }

    res.json({
      passed: true,
      message: "Verified photo",
      matchedLabel: result.matchedLabel,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      passed: false,
      message: "Please upload plant image.",
    });
  }
});

router.post("/:plantId", upload.single("photo"), async (req, res) => {
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

    let photo = undefined;

    if (req.file) {
      photo = {
        data: req.file.buffer,
        contentType: req.file.mimetype,
      };
    }

    const username = [req.user.firstName, req.user.lastName].join(" ");

    const createdReview = await Review.create({
      plantId: plant._id,
      userId: req.user._id,
      username,
      rating,
      fruitingStatus,
      comment: review?.trim(),
      foodSafetyNotes: safetyNotes?.trim(),
      photo,
    });

    plant.reviews.push({
      username: createdReview.username,
      rating: createdReview.rating,
      comment: createdReview.comment,
      date: createdReview.date,
    });

    await plant.save();

    res.redirect(`/plant/${plant.fallingFruitId}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

module.exports = router;
