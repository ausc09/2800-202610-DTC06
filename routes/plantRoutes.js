const express = require("express");
const router = express.Router();

const PlantCategory = require("../models/PlantCategory");

router.get("/plants", (req, res) => {
  const plant = {
    name: "Apple Tree",
    scientificName: "Malus domestica",
    location: "Stanley Park, Vancouver",
    lastObserved: "Apr 25, 2026",
    season: "Jun – Aug",
    access: "Public",
    fruitingStatus: "Ready to pick",
  };
  res.render("plant.ejs", { plant });
});

router.get("/api/plants", async (req, res) => {
  try {
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/locations?api_key=${process.env.FALLING_FRUIT_API_KEY}&bounds=49.198,-123.224|49.315,-123.023&limit=200`,
    );
    const plants = await response.json();

    const result = await Promise.all(
      plants.map(async (plant) => {
        const typeId = plant.type_ids[0];
        const category = await PlantCategory.findOne({
          fallingFruitTypeId: typeId,
        });
        return {
          id: plant.id,
          name: category ? category.name : "Unknown",
          lat: plant.lat,
          lng: plant.lng,
        };
      }),
    );

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
        },
        { upsert: true },
      );
    }

    res.json({ message: `Seeded ${types.length} categories` });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
