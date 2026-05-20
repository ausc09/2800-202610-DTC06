const Review = require("../models/review");
const Plant = require("../models/plant");
const viewHistory = require("../models/viewHistory");
const {
  formatDistance,
  formatSeasonText,
  getSeasonStatus,
} = require("../helpers/plantHelpers");

function reviewPhotoSrc(review) {
  if (!review.photo?.data || !review.photo.contentType) return null;

  const photoData = review.photo.data;
  const photoBuffer = Buffer.isBuffer(photoData)
    ? photoData
    : Buffer.from(photoData.buffer || photoData.data || photoData);

  return `data:${review.photo.contentType};base64,${photoBuffer.toString("base64")}`;
}

function getUserLocation(req) {
  if (req.query.lat !== undefined && req.query.lng !== undefined) {
    return { lat: Number(req.query.lat), lng: Number(req.query.lng) };
  }

  const userLocation = req.session?.userLocation;
  if (!userLocation) return null;

  return { lat: userLocation.lat, lng: userLocation.lng };
}

function saveUserLocation(req) {
  const lat = Number(req.body.lat);
  const lng = Number(req.body.lng);
  req.session.userLocation = { lat, lng };
}

async function recordViewHistory(user, fallingFruitId, plantName) {
  if (!user) return;
  await viewHistory.create({
    userId: user._id,
    fallingFruitId: Number(fallingFruitId),
    plantName: plantName || "Unknown plant",
  });
}

async function getPlantReviews(plantId) {
  const reviewDocs = await Review.find({ plantId }).sort({ date: -1 }).lean();
  return reviewDocs.map((review) => ({
    ...review,
    photoSrc: reviewPhotoSrc(review),
  }));
}

async function getPlantDetail(id, userLocation, user) {
  const plantDoc = await Plant.findOne({ fallingFruitId: id }).lean();
  if (!plantDoc) return null;

  await recordViewHistory(user, id, plantDoc.name);

  const reviews = await getPlantReviews(plantDoc._id);
  const latestReview = reviews[0] || null;

  const plant = {
    ...plantDoc,
    season: formatSeasonText(plantDoc.season_start, plantDoc.season_stop),
    seasonStatus: getSeasonStatus(plantDoc.season_start, plantDoc.season_stop),
    author: plantDoc.author || "Not Available",
    categories: plantDoc.categories || [],
    urls: plantDoc.urls || { wikipedia: null, usda: null },
    description: plantDoc.description || "No description available.",
    safety: plantDoc.safety,
    reviewStats: plantDoc.reviewStats,
    fruitingStatus: latestReview?.fruitingStatus || "Not Available",
    distance: formatDistance(userLocation, plantDoc),
    heroPhoto: await getHeroPhoto(plantDoc._id),
  };

  return { plant, reviews };
}

function buildPlantListQuery(filters) {
  const { search, verified, inSeason, safeOnly, type } = filters;
  const query = {};

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { scientificName: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  if (verified) query.unverified = false;
  if (inSeason) {
    const currentMonth = new Date().getMonth() + 1;
    query.season_start = { $lte: currentMonth };
    query.season_stop = { $gte: currentMonth };
  }
  if (safeOnly) query["safety.status"] = "verified";
  if (type !== "all") query.name = { $regex: type, $options: "i" };

  return query;
}

async function getHeroPhoto(plantId) {
  const review = await Review.findOne({
    plantId,
    "photo.data": { $exists: true },
  })
    .sort({ date: -1 })
    .lean();

  return review ? reviewPhotoSrc(review) : null;
}

async function getPaginatedPlants(filters, userLocation, page) {
  const PLANTS_PER_PAGE = 20;
  const query = buildPlantListQuery(filters);
  const totalPlants = await Plant.countDocuments(query);
  const totalPages = Math.ceil(totalPlants / PLANTS_PER_PAGE) || 1;
  const plants = await Plant.find(query)
    .skip((page - 1) * PLANTS_PER_PAGE)
    .limit(PLANTS_PER_PAGE)
    .lean();

  const plantsWithData = await Promise.all(
    plants.map(async (plant) => ({
      ...plant,
      distance: formatDistance(userLocation, plant),
      season: formatSeasonText(plant.season_start, plant.season_stop),
      heroPhoto: await getHeroPhoto(plant._id),
    })),
  );

  return {
    plants: plantsWithData,
    page,
    totalPages,
  };
}

function buildMapQuery({ search, type, bounds }) {
  const { north, south, east, west } = bounds;
  const query = {
    lat: { $exists: true },
    lng: { $exists: true },
    name: { $exists: true, $ne: null },
  };

  if (!isNaN(north) && !isNaN(south) && !isNaN(east) && !isNaN(west)) {
    query.lat = { $gte: south, $lte: north };
    query.lng = { $gte: west, $lte: east };
  }

  if (search) {
    query.$or = [
      { name: { $regex: search, $options: "i" } },
      { scientificName: { $regex: search, $options: "i" } },
      { address: { $regex: search, $options: "i" } },
    ];
  }

  if (type !== "all") query.name = { $regex: type, $options: "i" };

  return query;
}

async function getMapPlants(filters, userLocation) {
  const plants = await Plant.find(buildMapQuery(filters))
    .limit(300)
    .select(
      "fallingFruitId name scientificName lat lng season_start season_stop address location safety unverified source distance",
    );

  return plants.map((plant) => ({
    ...plant.toObject(),
    id: plant.fallingFruitId,
    distance: formatDistance(userLocation, plant),
    season: formatSeasonText(plant.season_start, plant.season_stop),
    safety: plant.safety,
  }));
}

module.exports = {
  getUserLocation,
  saveUserLocation,
  getPlantDetail,
  getPaginatedPlants,
  getMapPlants,
};
