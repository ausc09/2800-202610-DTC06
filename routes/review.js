const express = require("express");
const router = express.Router();
const reviewSchema = require("../models/review");

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

async function reviewOwner(params) {
    
}

// label reviews
router.get("/:plantID", async (req, res) => {
    try {
        const id = req.params.plantID;
        const reviewsFound = await reviewSchema.find({ plantId: id })
        if (reviewsFound.length === 0) return res.status(204).json({message: "No reviews found"})
        res.status(200).json(reviewsFound);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Backend Error" });
    }
});

// create new review
router.post("/", async (req, res) => {
    try {
        // const reviewsFound = await reviewSchema.find({ plantId: id, username:  })
        const review = req.body
        const reviewCreated = await reviewSchema.create(review)
        res.status(200).json(review);
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
        Object.assign(reviewsFound, req.body)
        await reviewsFound.deleteOne()
        res.status(200).json(reviewsFound);
    } catch (error) {
        console.log(error);
        res.status(500).json({ error: "Backend Error" });
    }
});


module.exports = router;
