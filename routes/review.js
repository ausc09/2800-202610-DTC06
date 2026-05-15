const express = require("express");
const mongoose = require("mongoose");
const router = express.Router();
const reviewSchema = require("../models/review");
const Plant = require("../models/Plant");


const exampleReviewFromGPT = {
    plantId: "6821f7b8c3d91a4d5e9a1234",
    userId: "6821f80fc3d91a4d5e9a5678",
    username: "forestExplorer",
    rating: 4,
    fruitingStatus: "Ripe and abundant",
    comment:
        "Found several healthy berries along the south trail. Most were fully ripe and easy to pick. Area was clean and accessible.",
    foodSafetyNotes:
        "Wash thoroughly before eating. Some nearby plants looked similar but were not edible.",
    photoUrl:
        "https://example.com/images/wild-berries-review.jpg",
    date: new Date("2026-05-12T10:30:00Z"),
};

function requireLogin(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }   return res.status(401).json({
    message: "You must be logged in",
    redirectTo: "/login",
  });
}

async function resolvePlantObjectId(plantId) {
  if (!plantId) return null;
  if (mongoose.Types.ObjectId.isValid(plantId)) {
    return plantId;
  }
  const numericValue = Number(plantId);
  if (!Number.isNaN(numericValue)) {
    let plantDoc = await Plant.findOne({ fallingFruitId: numericValue });
    if (!plantDoc) {
      plantDoc = await Plant.create({ fallingFruitId: numericValue });
    }
    return plantDoc._id;
  }
  return null;
}

const reviewOwnerByUser = async function(req, reviewDocId) {
    const userId = req.user._id
    const reviewDocUserId = reviewSchema.findById(reviewDocId).userId
    console.log(userId,reviewDocUserId)
    if (req.user._id)
    console.log("reached",req.session)
    next()
}

// render add review page using mongoose Plant module only
router.get("/add/:plantId", requireLogin, async (req, res) => {
    try {
        const plantId = Number(req.params.plantId);
        let plantDoc = await Plant.findOne({ fallingFruitId: plantId });

        if (!plantDoc) {
            plantDoc = await Plant.create({ fallingFruitId: plantId });
        }

        res.render("addReview", {
            plant: {
                _id: plantDoc._id,
                name: plantDoc.name || `Plant #${plantDoc.fallingFruitId}`,
                scientificName: plantDoc.scientificName || "Not Available",
            },
        });
    } catch (error) {
        console.log(error);
        res.status(500).send("Backend Error");
    }
});

// label reviews
router.get("/:plantID", async (req, res) => {
    try {
        const rawId = req.params.plantID;
        // Resolve numeric Falling Fruit id to Plant ObjectId when needed
        const resolvedPlantId = await resolvePlantObjectId(rawId);
        if (!resolvedPlantId) return res.json({ message: "No reviews found" });

        const reviewsFound = await reviewSchema.find({ plantId: resolvedPlantId });
        if (!reviewsFound || reviewsFound.length === 0) return res.json({ message: "No reviews found" });
        res.status(200).json(reviewsFound);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Backend Error" });
    }
});

// create new review
router.post("/", requireLogin, async (req, res) => {
    try {
        const resolvedPlantId = await resolvePlantObjectId(req.body.plantId);
        if (!resolvedPlantId) {
            return res.status(400).json({ error: "Invalid plantId" });
        }
        console.log(req.user)
        const reviewPayload = {
            ...req.body,
            plantId: resolvedPlantId,
            userId: req.user._id,
            username: `${req.user.firstName} ${req.user.lastName}`,
            rating: Number(req.body.rating),
        };
        const reviewCreated = await reviewSchema.create(reviewPayload);
        res.status(200).json(reviewCreated);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Backend Error" });
    }
});

// edit a review
router.put("/:reviewDocID", async (req, res) => {
    try {
        const reviewDocId = req.params.reviewDocID;
        const reviewsFound = await reviewSchema.findById(reviewDocId)
        if (reviewsFound.length === 0) return res.status(400).json({message: "Review not found"})
        Object.assign(reviewsFound, req.body)
        await reviewsFound.save()
        res.status(200).json(reviewsFound);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Backend Error" });
    }
});

// delete a review
router.delete("/:reviewDocID", async (req, res) => {
    try {
        const reviewDocId = req.params.reviewDocID;
        const reviewsFound = await reviewSchema.findById(reviewDocId)
        if (reviewsFound.length === 0) return res.status(400).json({message: "Review not found"})
        await reviewsFound.deleteOne()
        res.status(200).json(reviewsFound);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Backend Error" });
    }
});




module.exports = router;
