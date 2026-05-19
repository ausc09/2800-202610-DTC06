const { getDistance } = require("geolib");
const PlantCategory = require("../models/plantCategory");
const PlantSchema = require("../models/plant");
const Review = require("../models/review");

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

const MIN_VERIFIED_REVIEWS = 3;
const VERIFIED_AVERAGE_RATING = 4;

function toMonthName(val) {
  const n = parseInt(val, 10);
  return !isNaN(n) && n >= 1 && n <= 12 ? MONTHS[n - 1] : val;
}

function formatSeasonText(start, stop) {
  const startName = start ? toMonthName(start) : null;
  const stopName = stop ? toMonthName(stop) : null;

  if (startName && stopName) {
    return `${startName} – ${stopName}`;
  }

  if (startName) {
    return `From ${startName}`;
  }

  if (stopName) {
    return `Until ${stopName}`;
  }

  return "Not Available";
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

function formatDistance(userLocation, plantLocation) {
  if (
    !userLocation ||
    plantLocation?.lat == null ||
    plantLocation?.lng == null
  ) {
    return "N/A";
  }

  const userLat = Number(userLocation?.lat);
  const userLng = Number(userLocation?.lng);
  const plantLat = Number(plantLocation?.lat);
  const plantLng = Number(plantLocation?.lng);

  if (
    [userLat, userLng, plantLat, plantLng].some(
      (value) => !Number.isFinite(value),
    )
  ) {
    return "N/A";
  }

  const distanceMeters = getDistance(
    { latitude: userLat, longitude: userLng },
    { latitude: plantLat, longitude: plantLng },
  );

  return (distanceMeters / 1000).toFixed(1);
}

async function getReviewStats(plantId) {
  if (!plantId) {
    return { reviewCount: 0, averageRating: 0 };
  }

  const [stats] = await Review.aggregate([
    { $match: { plantId } },
    {
      $group: {
        _id: "$plantId",
        reviewCount: { $sum: 1 },
        averageRating: { $avg: "$rating" },
      },
    },
  ]);

  return stats || { reviewCount: 0, averageRating: 0 };
}

function getSafetyFromReviewStats(reviewStats) {
  if (
    reviewStats.reviewCount >= MIN_VERIFIED_REVIEWS &&
    reviewStats.averageRating >= VERIFIED_AVERAGE_RATING
  ) {
    return { status: "verified", label: "Verified" };
  }

  return { status: "unverified", label: "Unverified" };
}

async function getSafetyForPlant(plantId) {
  const reviewStats = await getReviewStats(plantId);
  return getSafetyFromReviewStats(reviewStats);
}

async function formatPlantItem(item, userLocation = null) {
  const typeId = item.type_ids?.[0];
  const category = await PlantCategory.findOne({ fallingFruitTypeId: typeId });
  const plantDoc = await PlantSchema.findOne({ fallingFruitId: item.id });
  const lat = plantDoc?.lat ?? item.lat;
  const lng = plantDoc?.lng ?? item.lng;
  const start = plantDoc?.season_start;
  const stop = plantDoc?.season_stop;
  const startName = start ? toMonthName(start) : null;
  const stopName = stop ? toMonthName(stop) : null;
  const seasonStatus = getSeasonStatus(start, stop);
  const reviews = plantDoc?.reviews || [];
  const latestReview = reviews[reviews.length - 1] || null;
  const safety = await getSafetyForPlant(plantDoc?._id);

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
    lat,
    lng,
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
    distance: formatDistance(userLocation, { lat, lng }),
    safety,
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

async function updatePlantSafety(plantId) {
  const reviewStats = await getReviewStats(plantId);
  const safety = getSafetyFromReviewStats(reviewStats);

  await PlantSchema.findByIdAndUpdate(plantId, {
    reviewStats,
    safety,
  });

  return safety;
}

module.exports = {
  formatPlantItem,
  formatDistance,
  getSafetyForPlant,
  getOrCreatePlant,
  updatePlantSafety,
  formatSeasonText,
  getSeasonStatus,
};
