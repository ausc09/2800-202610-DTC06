const express = require("express");
const router = express.Router();
require("../models/Plant");
const UserSchema = require("../models/User");

router.get("/", async (req, res) => {
  if (!req.isAuthenticated()) {
    return res.redirect("/login");
  }

  try {
    const user = await UserSchema.findById(req.user._id).populate(
      "favoritePlants",
    );
    const dummyPlants = [
      {
        id: 2,

        name: "Elderberry",
        scientificName: "Sambucus canadensis",

        location: "Queen Elizabeth Park",
        distance: "2.4 km",
        season: "Aug–Sep",

        source: "Falling Fruit",

        safety: {
          status: "caution",
          label: "Caution",
        },
      },
    ];
    res.render("saved", { savedPlants: user.favoritePlants });
  } catch (error) {
    console.error(error);
    res.status(500).send("Error retrieving saved plants");
  }
});

module.exports = router;
