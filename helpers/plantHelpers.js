const PlantCategory = require("../models/plantCategory");
const PlantSchema = require("../models/plant");

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
  const typeId = item.type_ids?.[0];
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
    categories: category?.categories || [],
    urls: category?.urls || {},
    location: plantDoc?.address || item.address || "Not Available",
    author: item.author || "Not Available",
    description: item.description || "No description available.",
    unverified: plantDoc?.unverified ?? item.unverified ?? false,
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

module.exports = { formatPlantItem };
