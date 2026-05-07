const PlantCategory = require("../models/PlantCategory");
const Plant = require("../models/Plant");

async function formatPlantItem(item) {
  const typeId = item.type_ids[0];
  const category = await PlantCategory.findOne({ fallingFruitTypeId: typeId });
  const plantDoc = await Plant.findOne({ fallingFruitId: item.id });
  return {
    id: item.id,
    name: category ? category.name : "Unknown",
    scientificName: category ? category.scientificName : "Unknown",
    location: plantDoc?.address || "Unknown",
    lat: plantDoc?.lat || item.lat,
    lng: plantDoc?.lng || item.lng,
    lastObserved: item.updated_at
      ? new Date(item.updated_at).toDateString()
      : "Unknown",
    season:
      plantDoc?.season_start && plantDoc?.season_stop
        ? `${plantDoc.season_start} – ${plantDoc.season_stop}`
        : "Unknown",
    access: item.access || "Unknown",
    fruitingStatus: "Ready to pick",
    imgUrl: null,
    distance: "N/A",
    safety: { status: "safe", label: "Safe" },
    source: "Falling Fruit",
  };
}

module.exports = { formatPlantItem };
