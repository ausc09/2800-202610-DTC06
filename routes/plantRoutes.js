const express = require("express");
const router = express.Router();

const {
  getUserLocation,
  saveUserLocation,
  getPlantDetail,
  getPaginatedPlants,
  getMapPlants,
} = require("./plantService");

router.post("/api/user-location", (req, res) => {
  saveUserLocation(req);
  res.status(200).json({ message: "Location saved" });
});

router.get("/plant/:id", async (req, res) => {
  try {
    const result = await getPlantDetail(
      req.params.id,
      getUserLocation(req),
      req.user,
    );
    if (!result) return res.status(404).send("Plant not found");
    res.render("plant", {
      plant: result.plant,
      reviews: result.reviews,
      user: req.user || null,
      badgeTier: req.query.badge || null,
      fromReview: req.query.fromReview || req.query.badge || null,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/plant/:id/review", (req, res) => {
  res.redirect(`/reviews/${req.params.id}/new`);
});

router.get("/plants/:page", async (req, res) => {
  try {
    const page = Number(req.params.page) || 1;
    const filters = {
      search: req.query.search?.trim() || "",
      verified: req.query.verified === "true",
      inSeason: req.query.inSeason === "true",
      safeOnly: req.query.safeOnly === "true",
      type: req.query.type || "all",
    };
    const result = await getPaginatedPlants(
      filters,
      getUserLocation(req),
      page,
    );
    res.render("plantList", { ...result, ...filters });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/api/plants", async (req, res) => {
  try {
    const filters = {
      search: req.query.search?.trim() || "",
      type: req.query.type || "all",
      bounds: {
        north: Number(req.query.north),
        south: Number(req.query.south),
        east: Number(req.query.east),
        west: Number(req.query.west),
      },
    };
    const plants = await getMapPlants(filters, getUserLocation(req));
    res.json(plants);
  } catch (error) {
    console.error(error);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
