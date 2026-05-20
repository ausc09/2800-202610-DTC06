const express = require("express");
const router = express.Router();
const multer = require("multer");

const Plant = require("../models/plant");
const Review = require("../models/review");
const User = require("../models/User");
const { validatePlantImage } = require("../helpers/visionHelpers");
const { updatePlantSafety } = require("../helpers/plantHelpers");

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

router.get("/:reviewId/edit", async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).send("Review not found");
    }

    const isOwner = String(review.userId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).send("Not authorized");
    }

    const plant = await Plant.findById(review.plantId);

    if (!plant) {
      return res.status(404).send("Plant not found");
    }

    res.render("addReview", { plant, review, mode: "edit" });
  } catch (error) {
    console.error(error);
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

    await updatePlantSafety(plant._id);


    const reviewCount = await Review.countDocuments({ userId: req.user._id });

    const milestones = [
      { count: 1, name: "Sprout", emoji: "🌱", tier: 1 },
      { count: 5, name: "Plant Scout", emoji: "🌿", tier: 2 },
      { count: 10, name: "Master Forager", emoji: "🏆", tier: 3 },
      { count: 25, name: "Botanist", emoji: "🧑‍🔬", tier: 4 },
    ];

    const milestone = milestones.find((m) => m.count === reviewCount);

    if (milestone) {
      const alreadyHas = req.user.badges?.some((b) => b.name === milestone.name);
      if (!alreadyHas) {
        await User.findByIdAndUpdate(req.user._id, {
          $push: { badges: milestone },
        });
      }
      return res.redirect(`/plant/${plant.fallingFruitId}?badge=${milestone.tier}`);
    }

    res.redirect(`/plant/${plant.fallingFruitId}`);
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.delete("/:reviewId", async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const isOwner = String(review.userId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const plantId = review.plantId;
    await Review.findByIdAndDelete(req.params.reviewId);
    await updatePlantSafety(plantId);

    res.status(200).json({ message: "Review deleted" });
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.post("/:reviewId/edit", upload.single("photo"), async (req, res) => {
  try {
    const review = await Review.findById(req.params.reviewId);

    if (!review) {
      return res.status(404).json({ error: "Review not found" });
    }

    const isOwner = String(review.userId) === String(req.user._id);
    const isAdmin = req.user.role === "admin";

    if (!isOwner && !isAdmin) {
      return res.status(403).json({ error: "Not authorized" });
    }

    const rating = Number(req.body.rating);
    const { fruitingStatus } = req.body;
    const comment = req.body.review;
    const foodSafetyNotes = req.body.safetyNotes;

    if (rating < 1 || rating > 5 || !fruitingStatus) {
      return res
        .status(400)
        .json({ error: "Rating and fruiting status are required" });
    }

    await Review.findByIdAndUpdate(req.params.reviewId, {
      rating,
      fruitingStatus,
      comment: comment?.trim(),
      foodSafetyNotes: foodSafetyNotes?.trim(),
      date: new Date(),
    });

    await updatePlantSafety(review.plantId);

    const plant = await Plant.findById(review.plantId);
    res.redirect(`/plant/${plant.fallingFruitId}`);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
