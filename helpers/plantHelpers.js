function formatFallingFruitPlant(item) {
  return {
    name: item.name || "Unknown",
    scientificName: item.scientific_name || "",
    location: {
      lat: item.lat,
      lng: item.lng,
    },
    season: item.season_start && item.season_stop
      ? `${item.season_start} – ${item.season_stop}`
      : "Unknown",
    access: item.access || "Unknown",
    fruitingStatus: item.description || "",
    photos: item.photos || [],
  };
}

module.exports = { formatFallingFruitPlant };