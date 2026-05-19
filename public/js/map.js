// Set greeting based on time of day
const hour = new Date().getHours();
const greetingSub =
  hour < 12 ? "Good morning," : hour < 17 ? "Good afternoon," : "Good evening,";
document.getElementById("greeting-sub").textContent = greetingSub;

let activeMapFilter = "all";
let plantMarkers = [];
let loadTimeout = null;
let currentUserLocation = null;

// Filter chips
function updateFilterChipStyles() {
  document.querySelectorAll(".filter-chip").forEach((chip) => {
    const isActive = chip.dataset.filter === activeMapFilter;
    chip.classList.toggle("bg-brand-charcoal", isActive);
    chip.classList.toggle("text-white", isActive);
    chip.classList.toggle("bg-brand-surface", !isActive);
    chip.classList.toggle("text-brand-sub", !isActive);
    chip.classList.toggle("border", !isActive);
    chip.classList.toggle("border-brand-border", !isActive);
  });
}

function clearMarkers() {
  plantMarkers.forEach((marker) => marker.remove());
  plantMarkers = [];
}

function getMapQueryParams() {
  const search = document.getElementById("search-input").value.trim();
  const bounds = map.getBounds();

  const params = new URLSearchParams();

  params.set("north", bounds.getNorth());
  params.set("south", bounds.getSouth());
  params.set("east", bounds.getEast());
  params.set("west", bounds.getWest());

  if (search) {
    params.set("search", search);
  }

  if (activeMapFilter === "verified") {
    params.set("verified", "true");
  } else if (activeMapFilter === "inSeason") {
    params.set("inSeason", "true");
  }

  if (currentUserLocation) {
    params.set("lat", currentUserLocation.lat);
    params.set("lng", currentUserLocation.lng);
  }

  return params.toString();
}

function showMapLoader() {
  document.getElementById("mapLoader")?.classList.remove("hidden");
}

function hideMapLoader() {
  document.getElementById("mapLoader")?.classList.add("hidden");
}

// Initialize map centered on Vancouver
const map = L.map("map").setView([49.2827, -123.1207], 13);

let userMarker = null;

const userLocationReady = getUserLocation().then(async (coords) => {
  if (coords) {
    currentUserLocation = coords;
    await saveUserLocation(coords);

    map.setView([coords.lat, coords.lng], 15);

    userMarker = L.circleMarker([coords.lat, coords.lng], {
      radius: 10,
      fillColor: "#4A90D9",
      color: "#fff",
      weight: 3,
      fillOpacity: 1,
    }).addTo(map);

    userMarker.bindTooltip("You are here", {
      permanent: false,
      direction: "top",
      offset: [0, -10],
    });
  }
});

// Add CartoDB light map tiles
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "© OpenStreetMap contributors © CARTO",
}).addTo(map);

// Show map tooltip on first visit
document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("hint_map_marker")) {
    const tooltip = document.getElementById("map-tooltip");
    const overlay = document.getElementById("map-tooltip-overlay");
    overlay.classList.remove("hidden");

    setTimeout(() => {
      tooltip.classList.remove("pointer-events-none");
      tooltip.classList.remove("opacity-0", "translate-y-4");
      tooltip.classList.add("opacity-100", "translate-y-0");
    }, 300);

    setTimeout(() => dismissMapTooltip(), 5000);
  }
});

function dismissMapTooltip() {
  localStorage.setItem("hint_map_marker", "true");
  const tooltip = document.getElementById("map-tooltip");
  const overlay = document.getElementById("map-tooltip-overlay");

  tooltip.classList.remove("opacity-100", "translate-y-0");
  tooltip.classList.add("opacity-0", "translate-y-4", "pointer-events-none");
  overlay.style.opacity = "0";

  setTimeout(() => {
    tooltip.classList.add("hidden");
    overlay.classList.add("hidden");
  }, 500);
}

const months = [
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

function formatSeason(season) {
  if (!season) return "";
  const parts = season.split(/\s*[–-]\s*/);
  if (parts.length !== 2) return season;
  const start = parseInt(parts[0]) - 1;
  const end = parseInt(parts[1]) - 1;
  if (isNaN(start) || isNaN(end)) return season;
  return `${months[start]} – ${months[end]}`;
}

// Get user location
function getUserLocation() {
  return new Promise((resolve) => {
    if (!navigator.geolocation) return resolve(null);
    navigator.geolocation.getCurrentPosition(
      (pos) => resolve({ lat: pos.coords.latitude, lng: pos.coords.longitude }),
      () => resolve(null),
    );
  });
}

async function saveUserLocation(coords) {
  if (!coords) return;

  try {
    await fetch("/api/user-location", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(coords),
    });
  } catch (err) {
    console.error("Failed to save user location:", err);
  }
}

// Fetch plant locations from Falling Fruit API and add markers
async function loadPlants() {
  try {
    showMapLoader();
    clearMarkers();

    const query = getMapQueryParams();
    const res = await fetch(`/api/plants?${query}`);
    const data = await res.json();

    data.forEach((plant) => {
      if (!plant.lat || !plant.lng) return;

      const marker = L.circleMarker([plant.lat, plant.lng], {
        radius: 8,
        fillColor: "#c47c5a",
        color: "#fff",
        weight: 2,
        fillOpacity: 1,
      }).addTo(map);

      plantMarkers.push(marker);

      marker.on("click", () => {
        const season = plant.season || "";
        const dist = plant.distance ? parseFloat(plant.distance) : null;
        const detailParams = currentUserLocation
          ? `?lat=${encodeURIComponent(currentUserLocation.lat)}&lng=${encodeURIComponent(currentUserLocation.lng)}`
          : "";

        marker
          .bindPopup(
            `
            <div style="font-family:'DM Sans',sans-serif;padding:4px;min-width:200px">
              <div style="display:flex;align-items:center;gap:10px;margin-bottom:10px">
                <div style="width:40px;height:40px;background:#e8f5ee;border-radius:10px;
                            flex-shrink:0;display:flex;align-items:center;justify-content:center">
                  <svg width="22" height="22" fill="none" stroke="#2d6a4f" stroke-width="1.5" viewBox="0 0 24 24">
                    <path d="M12 22V12"/>
                    <path d="M12 12C12 8 16 4 20 4c0 4-4 8-8 8z"/>
                    <path d="M12 16C12 13 8 9 4 9c0 4 4 7 8 7z"/>
                  </svg>
                </div>
                <div>
                  <div style="font-weight:600;font-size:14px;color:#1a1a16">${plant.name}</div>
                  <div style="font-size:11px;color:#a89e90;font-style:italic">
                    ${plant.scientificName || ""}
                    ${
                      dist
                        ? ` / ${
                            dist < 1
                              ? `${Math.round(dist * 1000)} m away`
                              : `${dist.toFixed(1)} km away`
                          }`
                        : ""
                    }
                  </div>
                </div>
              </div>
              <div style="display:flex;gap:6px;margin-bottom:10px">
                <span style="font-size:11px;padding:3px 8px;background:#e8f5ee;color:#2d6a4f;border-radius:20px">
                  ${plant.safety?.label || "Safe"}
                </span>

                ${
                  season
                    ? `<span style="font-size:11px;padding:3px 8px;background:#f5f0e8;color:#8c6a50;border-radius:20px">${season}</span>`
                    : ""
                }
              </div>
              <a href="/plant/${plant.fallingFruitId}${detailParams}"
                 style="display:block;background:#2a2620;color:#fff;text-align:center;
                        padding:9px;border-radius:10px;font-size:13px;
                        text-decoration:none;font-weight:500">
                View Plant Profile →
              </a>
            </div>
          `,
            { maxWidth: 240 },
          )
          .openPopup();
      });
    });
  } catch (err) {
    console.error("Failed to load plants:", err);
  } finally {
    hideMapLoader();
  }
}

function debounceLoadPlants() {
  clearTimeout(loadTimeout);

  loadTimeout = setTimeout(() => {
    loadPlants();
  }, 350);
}

updateFilterChipStyles();
userLocationReady.then(loadPlants);

map.on("moveend", debounceLoadPlants);
map.on("zoomend", debounceLoadPlants);

document.querySelectorAll(".filter-chip").forEach((chip) => {
  chip.addEventListener("click", () => {
    activeMapFilter = chip.dataset.filter;
    updateFilterChipStyles();
    loadPlants();
  });
});

document.getElementById("search-input").addEventListener("keydown", (event) => {
  if (event.key === "Enter") {
    loadPlants();
  }
});
