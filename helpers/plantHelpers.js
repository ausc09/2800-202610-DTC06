const PlantCategory = require("../models/PlantCategory");
const PlantSchema = require("../models/Plant");

const MONTHS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "May",
  "Jun",
  "Jul",
  "Aug",
  "Sep",
  "Oct",
  "Nov",
  "Dec",
];

function toMonthName(val) {
  const n = parseInt(val, 10);
  return !isNaN(n) && n >= 1 && n <= 12 ? MONTHS[n - 1] : val;
}

function getSeasonStatus(start, stop) {
  if (!start || !stop) {
    return null;
  }
  const month = new Date().getMonth() + 1;
  let isInSeason = false;
  if (start <= stop) {
    isInSeason = month >= start && month <= stop;
  } else {
    isInSeason = month >= start || month <= stop;
  }
  return isInSeason;
}

async function formatPlantItem(item) {
  const typeId = item.type_ids[0];
  const category = await PlantCategory.findOne({ fallingFruitTypeId: typeId });
  const plantDoc = await PlantSchema.findOne({ fallingFruitId: item.id });
  const start = plantDoc?.season_start;
  const stop = plantDoc?.season_stop;
  const startName = start ? toMonthName(start) : null;
  const stopName = stop ? toMonthName(stop) : null;
  const seasonStatus = getSeasonStatus(start, stop);
  const reviews = plantDoc?.reviews || [];
  const reviewCount = reviews.length;
  const latestReview = reviews[reviews.length - 1] || null;

  return {
    id: item.id,
    name: category ? category.name : "Not Available",
    scientificName: category ? category.scientificName : "Not Available",
    location: plantDoc?.address || "Not Available",
    lat: plantDoc?.lat || item.lat,
    lng: plantDoc?.lng || item.lng,
    lastObserved: item.updated_at
      ? new Date(item.updated_at).toDateString()
      : "Not Available",
    season:
      startName && stopName ? `${startName} – ${stopName}` : "Not Available",
    seasonStart: startName,
    seasonStop: stopName,
    seasonStatus: seasonStatus ? "in" : "out",
    fruitingStatus: latestReview?.fruitingStatus || "Not Available",
    imgUrl: null,
    distance: "N/A",
    safety: {
      //Temporary waiting for review feature finish
      // status: "verified",
      // label: "Verified",
      status: reviewCount < 0 ? "verified" : "unverified",
      label: reviewCount < 0 ? "Verified" : "Unverified",
    },
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
