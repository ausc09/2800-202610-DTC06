const express = require("express");
const router = express.Router();

const PlantCategory = require("../models/PlantCategory");
const { formatPlantItem } = require("../helpers/plantHelpers");
const Plant = require("../models/Plant");

router.get("/plant/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const plant = await Plant.findById(id);

    if (!plant) {
      return res.status(404).send("Plant not found");
    }

    res.render("plant", { plant });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/plants/:page", async (req, res) => {
  try {
    const page = Number(req.params.page) || 1;
    const plantsPerPage = 20;

    const search = req.query.search?.trim() || "";
    const verified = req.query.verified === "true";
    const inSeason = req.query.inSeason === "true";
    const safeOnly = req.query.safeOnly === "true";
    const type = req.query.type || "all";

    const query = {};

    if (search) {
      query.$or = [
        { name: { $regex: search, $options: "i" } },
        { scientificName: { $regex: search, $options: "i" } },
        { address: { $regex: search, $options: "i" } },
      ];
    }

    if (verified) {
      query.unverified = false;
    }

    if (inSeason) {
      const currentMonth = new Date().getMonth() + 1;
      query.season_start = { $lte: currentMonth };
      query.season_stop = { $gte: currentMonth };
    }

    if (safeOnly) {
      query["safety.status"] = "safe";
    }

    if (type !== "all") {
      query.name = { $regex: type, $options: "i" };
    }

    const totalPlants = await Plant.countDocuments(query);
    const totalPages = Math.ceil(totalPlants / plantsPerPage) || 1;

    const plants = await Plant.find(query)
      .skip((page - 1) * plantsPerPage)
      .limit(plantsPerPage);

    res.render("plantList", {
      plants,
      page,
      totalPages,
      search,
      type,
      verified,
      inSeason,
      safeOnly,
    });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/api/plants", async (req, res) => {
  try {
    const plants = await Plant.find({
      lat: { $exists: true },
      lng: { $exists: true },
      name: { $exists: true, $ne: null },
    }).select(
      "fallingFruitId name scientificName lat lng season address safety reviews",
    );

    const result = plants.map((p) => ({
      ...p.toObject(),
      id: p.fallingFruitId,
    }));

    res.json(result);
  } catch (error) {
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
      });

      const formattedPlant = {
        fallingFruitId: loc.id,

        name: category ? category.name : "Unknown",
        scientificName: category ? category.scientificName : "Unknown",
        reviews: [],

        address: data.address || "Unknown",
        location: data.address || "Unknown",

        lat: loc.lat || data.lat,
        lng: loc.lng || data.lng,

        lastObserved: data.updated_at
          ? new Date(data.updated_at).toDateString()
          : "Unknown",

        season_start: data.season_start || null,
        season_stop: data.season_stop || null,

        season:
          data.season_start && data.season_stop
            ? `${data.season_start} – ${data.season_stop}`
            : "Unknown",

        access: data.access || loc.access || "Unknown",

        fruitingStatus: "Ready to pick",
        imgUrl: null,
        distance: "N/A",

        unverified: data.unverified || false,

        source: "Falling Fruit",
      };

      await Plant.create(formattedPlant);

      seededCount++;
    }

    res.json({
      message: `Seeded ${seededCount} locations`,
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
