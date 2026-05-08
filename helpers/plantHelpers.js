const PlantCategory = require("../models/PlantCategory");
const PlantSchema = require("../models/Plant");

async function formatPlantItem(item) {
  const typeId = item.type_ids[0];
  const category = await PlantCategory.findOne({ fallingFruitTypeId: typeId });
  const plantDoc = await PlantSchema.findOne({ fallingFruitId: item.id });
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

async function getOrCreatePlant(plantId) {
  let plant = await PlantSchema.findOne({ fallingFruitId: plantId });
  if (!plant) {
    const response = await fetch(
      `http://localhost:3000/plant/information/${plantId}`,
    );
    if (!response.ok) {
      throw new Error("Could not fetch plant information");
    }

    const plantInfo = await response.json();
    plant = new PlantSchema({
      ...plantInfo,
      fallingFruitId: plantId,
    });
    await plant.save();
  }
  return plant;
}

module.exports = { formatPlantItem, getOrCreatePlant };
