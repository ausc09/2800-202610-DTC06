document.addEventListener("DOMContentLoaded", () => {
  const searchWrapper = document.querySelector("[data-search-screen]");
  const searchInput = document.getElementById("searchInput");

  if (!searchWrapper || !searchInput) return;

  const screen = searchWrapper.dataset.searchScreen;

  if (screen === "plants") {
    setupPlantListSearch(searchInput);
  }

  if (screen === "saved") {
    setupSavedSearch(searchInput);
  }
});

function setupPlantListSearch(searchInput) {
  let debounceTimer = null;

  async function liveSearch() {
    const search = searchInput.value.trim();
    const params = new URLSearchParams(window.location.search);

    const newParams = new URLSearchParams();
    if (params.get("verified") === "true") newParams.set("verified", "true");
    if (params.get("inSeason") === "true") newParams.set("inSeason", "true");
    if (search) newParams.set("search", search);

    const query = newParams.toString();
    const url = `/plants/1${query ? `?${query}` : ""}`;

    try {
      const res = await fetch(url);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, "text/html");

      const newContainer = doc.getElementById("plants-container");
      const newCount = doc.getElementById("plants-count");

      if (newContainer) {
        document.getElementById("plants-container").innerHTML =
          newContainer.innerHTML;
        document
          .getElementById("plants-container")
          .querySelectorAll("script")
          .forEach((old) => {
            const s = document.createElement("script");
            s.textContent = old.textContent;
            old.replaceWith(s);
          });
      }
      if (newCount) {
        document.getElementById("plants-count").textContent =
          newCount.textContent;
      }
    } catch (err) {
      console.error("Search failed:", err);
    }
  }

  searchInput.addEventListener("input", () => {
    clearTimeout(debounceTimer);
    debounceTimer = setTimeout(liveSearch, 300);
  });

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      clearTimeout(debounceTimer);
      liveSearch();
    }
  });
}

function setupSavedSearch(searchInput) {
  const savedPlants = document.querySelectorAll(".plant-item");
  const filterButtons = document.querySelectorAll(".saved-filter-btn");
  const plantsContainer = document.getElementById("savedPlantsContainer");

  if (!plantsContainer) return;

  const activeFilters = new Set();

  let noResultsMessage = document.getElementById("noResultsMessage");

  if (!noResultsMessage) {
    noResultsMessage = document.createElement("div");
    noResultsMessage.id = "noResultsMessage";
    noResultsMessage.className =
      "hidden text-center text-brand-muted text-sm mt-8";
    noResultsMessage.innerHTML = `
      <i class="fa-regular fa-face-frown text-2xl mb-3 block"></i>
      <p class="font-semibold text-brand-text">No matches found</p>
      <p class="text-brand-sub mt-1">Try another search or filter.</p>
    `;

    plantsContainer.appendChild(noResultsMessage);
  }

  function updateFilterButtonStyles() {
    filterButtons.forEach((button) => {
      const filter = button.dataset.savedFilter;

      const isActive =
        filter === "all" ? activeFilters.size === 0 : activeFilters.has(filter);

      button.classList.toggle("bg-brand-charcoal", isActive);
      button.classList.toggle("text-white", isActive);
      button.classList.toggle("bg-brand-surface", !isActive);
      button.classList.toggle("text-brand-sub", !isActive);
      button.classList.toggle("border", !isActive);
      button.classList.toggle("border-brand-border", !isActive);
    });
  }

  function applySavedFilters() {
    const search = searchInput.value.toLowerCase().trim();
    let visibleCount = 0;

    savedPlants.forEach((plant) => {
      const name = plant.dataset.name?.toLowerCase() || "";
      const scientific = plant.dataset.scientific?.toLowerCase() || "";
      const location = plant.dataset.location?.toLowerCase() || "";

      const matchesSearch =
        name.includes(search) ||
        scientific.includes(search) ||
        location.includes(search);

      let matchesFilter = true;

      if (activeFilters.has("verified")) {
        matchesFilter = matchesFilter && plant.dataset.verified === "true";
      }

      if (activeFilters.has("in-season")) {
        matchesFilter = matchesFilter && plant.dataset.inSeason === "true";
      }

      const shouldShow = matchesSearch && matchesFilter;

      plant.classList.toggle("hidden", !shouldShow);

      if (shouldShow) visibleCount++;
    });

    noResultsMessage.classList.toggle("hidden", visibleCount > 0);
  }

  searchInput.addEventListener("input", applySavedFilters);

  filterButtons.forEach((button) => {
    button.addEventListener("click", () => {
      const filter = button.dataset.savedFilter;

      if (filter === "all") {
        activeFilters.clear();
      } else if (activeFilters.has(filter)) {
        activeFilters.delete(filter);
      } else {
        activeFilters.add(filter);
      }

      updateFilterButtonStyles();
      applySavedFilters();
    });
  });

  updateFilterButtonStyles();
}
