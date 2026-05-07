// Set greeting based on time of day
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
const map = L.map("map").setView([49.2827, -123.1207], 13);

// Add CartoDB light map tiles
// Code adapted from: https://leafletjs.com/examples/quick-start/
// Code adapted from: https://carto.com/basemaps/
// Modified by: Austyn Chan
L.tileLayer("https://{s}.basemaps.cartocdn.com/light_all/{z}/{x}/{y}{r}.png", {
  attribution: "© OpenStreetMap contributors © CARTO"
}).addTo(map);


const months = ["Jan","Feb","Mar","Apr","May","Jun",
                "Jul","Aug","Sep","Oct","Nov","Dec"];

// Fetch plant locations from Falling Fruit API and add markers
// Code adapted from: https://fallingfruit.org/api
// Modified by: Austyn Chan
async function loadPlants() {
  try {
    const res = await fetch(
      "https://fallingfruit.org/api/0.3/locations?" +
      "api_key=AKDJGHSD&" +
      "bounds=49.198,-123.224%7C49.315,-123.023&" +
      "locale=en&" +
      "limit=20"
    );
    const data = await res.json();

    data.forEach(plant => {
      if (!plant.lat || !plant.lng) return;

      // Create circle marker on map
      const marker = L.circleMarker([plant.lat, plant.lng], {
        radius: 8,
        fillColor: "#c47c5a",
        color: "#fff",
        weight: 2,
        fillOpacity: 1
      }).addTo(map);

      // On marker click, fetch full details then show popup
      marker.on("click", async () => {
        marker.bindPopup(
          `<p style="padding:8px;font-family:'DM Sans',sans-serif;color:#6b6456">Loading...</p>`
        ).openPopup();

        try {
          const typeId = plant.type_ids?.[0];

          // Fetch location detail and type name at the same time
          const [detailRes, typeRes] = await Promise.all([
            fetch(`https://fallingfruit.org/api/0.3/locations/${plant.id}?api_key=AKDJGHSD&locale=en`),
            fetch(`https://fallingfruit.org/api/0.3/types/${typeId}?api_key=AKDJGHSD&locale=en`)
          ]);

          const detail   = detailRes.ok ? await detailRes.json() : {};
          const typeData = typeRes.ok   ? await typeRes.json()   : {};

          const name       = plant.type_names?.[0] || "Unknown";
          const scientific = typeData.scientific_names?.[0] || "";
          const season     = detail.season_start && detail.season_stop
            ? `${months[detail.season_start - 1]} – ${months[detail.season_stop - 1]}`
            : "";

          marker.bindPopup(`
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
                  <div style="font-weight:600;font-size:14px;color:#1a1a16">${name}</div>
                  <div style="font-size:11px;color:#a89e90;font-style:italic">${scientific}</div>
                </div>
              </div>

              <div style="display:flex;gap:6px;margin-bottom:10px">
                <span style="font-size:11px;padding:3px 8px;background:#e8f5ee;
                             color:#2d6a4f;border-radius:20px">✓ Safe to eat</span>
                ${season ? `
                  <span style="font-size:11px;padding:3px 8px;background:#f5f0e8;
                               color:#8c6a50;border-radius:20px">${season}</span>
                ` : ""}
              </div>

              <a href="/plant/${plant.id}"
                 style="display:block;background:#2a2620;color:#fff;text-align:center;
                        padding:9px;border-radius:10px;font-size:13px;
                        text-decoration:none;font-weight:500">
                View Plant Profile →
              </a>

            </div>
          `, { maxWidth: 240 }).openPopup();

        } catch (err) {
          console.error("Failed to load plant details:", err);
        }
      });
    });

  } catch (err) {
    console.error("Failed to load plants:", err);
  }
}

loadPlants();