document.addEventListener("DOMContentLoaded", () => {
  const searchWrapper = document.querySelector("[data-search-screen]");
  const searchInput = document.getElementById("searchInput");
  const searchButton = document.getElementById("searchButton");

  if (!searchWrapper || !searchInput || !searchButton) return;

  const screen = searchWrapper.dataset.searchScreen;

  toggleSearchButton();

  searchInput.addEventListener("input", toggleSearchButton);

  function toggleSearchButton() {
    const hasText = searchInput.value.trim().length > 0;
    searchButton.classList.toggle("hidden", !hasText);
  }

  if (screen === "plants") {
    setupPlantListSearch(searchInput, searchButton);
  }

  if (screen === "saved") {
    setupSavedSearch(searchInput);
  }
});

function setupPlantListSearch(searchInput, searchButton) {
  function submitSearch() {
    const search = searchInput.value.trim();
    const params = new URLSearchParams(window.location.search);

    const verified = params.get("verified");
    const inSeason = params.get("inSeason");
    const safeOnly = params.get("safeOnly");

    const newParams = new URLSearchParams();

    if (verified === "true") newParams.set("verified", "true");
    if (inSeason === "true") newParams.set("inSeason", "true");
    if (safeOnly === "true") newParams.set("safeOnly", "true");
    if (search) newParams.set("search", search);

    const query = newParams.toString();

    window.location.href = `/plants/1${query ? `?${query}` : ""}`;
  }

  searchInput.addEventListener("keydown", (event) => {
    if (event.key === "Enter") {
      submitSearch();
    }
  });

  searchButton.addEventListener("click", submitSearch);
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
      button.classList.toggle("bg-brand-alt", !isActive);
      button.classList.toggle("text-brand-sub", !isActive);
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

      if (activeFilters.has("safe")) {
        matchesFilter = matchesFilter && plant.dataset.safety === "safe";
      }

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
