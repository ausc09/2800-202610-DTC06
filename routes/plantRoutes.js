const express = require("express");
const router = express.Router();

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

module.exports = router;
