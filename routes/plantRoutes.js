const express = require("express");
const router = express.Router();

const {
  getUserLocation,
  saveUserLocation,
  getPlantInformation,
  getPlantDetail,
  getPaginatedPlants,
  getMapPlants,
} = require("./plantService");

router.post("/api/user-location", (req, res) => {
  saveUserLocation(req);
  res.status(200).json({ message: "Location saved" });
});

router.get("/plant/information/:id", async (req, res) => {
  try {
    const plant = await getPlantInformation(
      req.params.id,
      getUserLocation(req),
    );
    res.json(plant);
  } catch (error) {
    console.log(error);
    res.status(500).json({ error: "Something went wrong" });
  }
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

router.get("/api/seed-categories", async (req, res) => {
  try {
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/types?api_key=${process.env.FALLING_FRUIT_API_KEY}&locale=en`,
    );
    const types = await response.json();

    for (const type of types) {
      await PlantCategory.findOneAndUpdate(
        { fallingFruitTypeId: type.id },
        {
          name:
            type.common_names?.en?.[0] ||
            type.scientific_names?.[0] ||
            "Unknown",
          scientificName: type.scientific_names?.[0] || "",
          categories: type.categories || [],
          urls: {
            wikipedia: type.urls?.wikipedia || null,
            usda: type.urls?.usda || null,
          },
        },
        { upsert: true },
      );
    }

    res.json({ message: `Seeded ${types.length} categories` });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/api/seed-locations", async (req, res) => {
  try {
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/locations?api_key=${process.env.FALLING_FRUIT_API_KEY}&bounds=49.198,-123.224|49.315,-123.023&limit=1000`,
    );

    const locations = await response.json();

    let seededCount = 0;

    for (const loc of locations) {
      const detailResponse = await fetch(
        `https://fallingfruit.org/api/0.3/locations/${loc.id}?api_key=${process.env.FALLING_FRUIT_API_KEY}&locale=en`,
      );

      const data = await detailResponse.json();

      const typeId = data.type_ids?.[0] || loc.type_ids?.[0];

      const category = await PlantCategory.findOne({
        fallingFruitTypeId: typeId,
      }).lean();

      const formattedPlant = {
        fallingFruitId: loc.id,

        name: category ? category.name : "Unknown",
        scientificName: category ? category.scientificName : "Unknown",

        author: data.author || "Not Available",

        categories: category ? category.categories : [],

        urls: {
          wikipedia: category?.urls?.wikipedia || null,
          usda: category?.urls?.usda || null,
        },

        description: data.description?.trim() || "No description available.",

        address: data.address || "Unknown",
        location: data.address || "Unknown",

        lat: loc.lat ?? data.lat,
        lng: loc.lng ?? data.lng,

        lastObserved: data.updated_at
          ? new Date(data.updated_at).toDateString()
          : "Unknown",

        season_start: data.season_start ?? null,
        season_stop: data.season_stop ?? null,

        access: data.access ?? loc.access ?? "Unknown",

        imgUrl: null,
        distance: "N/A",

        source: "Falling Fruit",
      };

      await Plant.findOneAndUpdate(
        { fallingFruitId: loc.id },
        {
          $set: formattedPlant,
          $setOnInsert: {
            photos: [],
            safety: {
              status: "unverified",
              label: "Unverified",
            },
            reviewStats: {
              reviewCount: 0,
              averageRating: 0,
            },
          },
        },
        {
          upsert: true,
          new: true,
        },
      );

      seededCount++;
    }

    res.json({
      message: `Seeded or updated ${seededCount} locations`,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({
      error: "Something went wrong",
      details: error.message,
    });
  }
});

module.exports = router;
