const express = require("express");
const router = express.Router();

const PlantCategory = require("../models/PlantCategory");
const { formatPlantItem } = require("../helpers/plantHelpers");

// router.get("/plant", (req, res) => {
//   const plant = {
//     name: "Apple Tree",
//     scientificName: "Malus domestica",
//     location: "Stanley Park, Vancouver",
//     lastObserved: "Apr 25, 2026",
//     season: "Jun – Aug",
//     access: "Public",
//     fruitingStatus: "Ready to pick",
//   };
//   res.render("plant.ejs", { plant });
// });

router.get("/plant/:id", async (req, res) => {
  try {
    const id = req.params.id;
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/locations/${id}?api_key=${process.env.FALLING_FRUIT_API_KEY}&locale=en`,
    );
    const data = await response.json();
    const plant = await formatPlantItem(data);
    res.render("plant", { plant });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/plants", async (req, res) => {
  try {
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/locations?api_key=${process.env.FALLING_FRUIT_API_KEY}&bounds=49.198,-123.224|49.315,-123.023&limit=50`,
    );
    const data = await response.json();
    console.log(data[0]);
    const plants = await Promise.all(data.map(formatPlantItem));
    res.render("plantList", { plants });
  } catch (error) {
    console.log(error);
    res.status(500).send("Something went wrong");
  }
});

router.get("/api/plants", async (req, res) => {
  try {
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/locations?api_key=${process.env.FALLING_FRUIT_API_KEY}&bounds=49.198,-123.224|49.315,-123.023&limit=200`,
    );
    const data = await response.json();
    const result = await Promise.all(data.map(formatPlantItem));
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

const Plant = require("../models/Plant");

router.get("/api/seed-locations", async (req, res) => {
  try {
    const response = await fetch(
      `https://fallingfruit.org/api/0.3/locations?api_key=${process.env.FALLING_FRUIT_API_KEY}&bounds=49.198,-123.224|49.315,-123.023&limit=200`,
    );
    const locations = await response.json();

    for (const loc of locations) {
      const detail = await fetch(
        `https://fallingfruit.org/api/0.3/locations/${loc.id}?api_key=${process.env.FALLING_FRUIT_API_KEY}&locale=en`,
      );
      const data = await detail.json();

      await Plant.findOneAndUpdate(
        { fallingFruitId: loc.id },
        {
          address: data.address,
          season_start: data.season_start,
          season_stop: data.season_stop,
        },
        { upsert: true },
      );
    }

    res.json({ message: `Seeded ${locations.length} locations` });
  } catch (error) {
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
