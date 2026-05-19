const express = require("express");
const router = express.Router();
const PlantCategory = require("../models/plantCategory");
const Plant = require("../models/plant");

const FALLING_FRUIT_BASE_URL = "https://fallingfruit.org/api/0.3";
const VANCOUVER_BOUNDS = "49.198,-123.224|49.315,-123.023";

function buildUrl(path, params = {}) {
  const query = new URLSearchParams({
    api_key: process.env.FALLING_FRUIT_API_KEY,
    ...params,
  });
  return `${FALLING_FRUIT_BASE_URL}${path}?${query.toString()}`;
}

async function seedCategories() {
  const response = await fetch(buildUrl("/types", { locale: "en" }));
  const types = await response.json();

  for (const type of types) {
    await PlantCategory.findOneAndUpdate(
      { fallingFruitTypeId: type.id },
      {
        name:
          type.common_names?.en?.[0] || type.scientific_names?.[0] || "Unknown",
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

  return { seededCount: types.length };
}

async function formatPlantData(loc, data, category) {
  return {
    fallingFruitId: loc.id,
    name: category?.name || "Unknown",
    scientificName: category?.scientificName || "Unknown",
    author: data.author || "Not Available",
    categories: category?.categories || [],
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
}

async function seedLocations() {
  const response = await fetch(
    buildUrl("/locations", { bounds: VANCOUVER_BOUNDS, limit: "1000" }),
  );
  const locations = await response.json();
  let seededCount = 0;

  for (const loc of locations) {
    const detailResponse = await fetch(
      buildUrl(`/locations/${loc.id}`, { locale: "en" }),
    );
    const data = await detailResponse.json();
    const typeId = data.type_ids?.[0] || loc.type_ids?.[0];
    const category = await PlantCategory.findOne({
      fallingFruitTypeId: typeId,
    }).lean();
    const formattedPlant = await formatPlantData(loc, data, category);

    await Plant.findOneAndUpdate(
      { fallingFruitId: loc.id },
      {
        $set: formattedPlant,
        $setOnInsert: {
          photos: [],
          safety: { status: "unverified", label: "Unverified" },
          reviewStats: { reviewCount: 0, averageRating: 0 },
        },
      },
      { upsert: true, new: true },
    );

    seededCount++;
  }

  return { seededCount };
}

router.get("/api/seed-categories", async (req, res) => {
  try {
    const { seededCount } = await seedCategories();
    res.json({ message: `Seeded ${seededCount} categories` });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

router.get("/api/seed-locations", async (req, res) => {
  try {
    const { seededCount } = await seedLocations();
    res.json({ message: `Seeded or updated ${seededCount} locations` });
  } catch (error) {
    console.error(error);
    res
      .status(500)
      .json({ error: "Something went wrong", details: error.message });
  }
});

module.exports = router;
