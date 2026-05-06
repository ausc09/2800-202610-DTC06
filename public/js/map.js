// Greeting based on time of day
const hour = new Date().getHours();
const greetingSub = hour < 12 ? "Good morning," :
                    hour < 17 ? "Good afternoon," : "Good evening,";
document.getElementById("greeting-sub").textContent = greetingSub;

// Filter chips
function filterMap(type) {
  document.querySelectorAll(".filter-chip").forEach(chip => {
    const isActive = chip.dataset.filter === type;
    chip.classList.toggle("bg-brand-charcoal", isActive);
    chip.classList.toggle("text-white", isActive);
    chip.classList.toggle("bg-brand-surface", !isActive);
    chip.classList.toggle("text-brand-sub", !isActive);
    chip.classList.toggle("border", !isActive);
    chip.classList.toggle("border-brand-border", !isActive);
  });
  // TODO: filter map markers by type
}

// Initialize map centered on Vancouver
// Code adapted from: https://leafletjs.com/examples/quick-start/
// Modified by: Austyn Chan
const map = L.map("map").setView([49.2827, -123.1207], 13);

// Add map tiles (the actual map images from OpenStreetMap - free)
// Code adapted from: https://carto.com/basemaps/
// Modified by: Austyn Chan
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "© OpenStreetMap contributors"
}).addTo(map);