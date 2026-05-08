const PlantCategory = require("../models/plantCategory");
const PlantSchema = require("../models/plant");

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
      `https://fallingfruit.org/api/0.3/locations/${plantId}?api_key=${process.env.FALLING_FRUIT_API_KEY}&locale=en`,
    );
    if (!response.ok) {
      throw new Error("Could not fetch plant information");
    }

    const data = await response.json();
    plant = new PlantSchema({
      fallingFruitId: plantId,
      address: data.address || "Vancouver",
      season_start: data.season_start,
      season_stop: data.season_stop,
      lat: data.lat,
      lng: data.lng,
    });
    await plant.save();
  }
  return plant;
}

module.exports = { formatPlantItem, getOrCreatePlant };
