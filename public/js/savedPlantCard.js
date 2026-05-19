(() => {
  function initCard(cardEl) {
    if (cardEl.dataset.initialized === "true") return;
    cardEl.dataset.initialized = "true";

    const fallingFruitId = cardEl.dataset.fallingFruitId;
    const imgUrl = cardEl.dataset.imgUrl;
    const plantName = cardEl.dataset.plantName || "";
    const cardId = cardEl.id.replace(/^card-/, "");

    const imageContainer = document.getElementById(`plant-image-${cardId}`);
    const saveButton = document.getElementById(`save-button-${fallingFruitId}`);
    const saveIcon = document.getElementById(`save-icon-${fallingFruitId}`);

    // Card click navigates to plant detail, except when the click lands inside the save button
    cardEl.addEventListener("click", (e) => {
      if (saveButton && (e.target === saveButton || saveButton.contains(e.target))) {
        return;
      }
      window.location.href = `/plant/${fallingFruitId}`;
    });

    // When the bookmark is clicked, wait for saveButton.ejs to flip the icon to fa-regular (unsaved),
    // then animate the card out and remove it from the list
    if (saveButton && saveIcon) {
      saveButton.addEventListener("click", () => {
        const observer = new MutationObserver(() => {
          if (!saveIcon.classList.contains("fa-regular")) return;
          observer.disconnect();

          // Suppress the "Removed from Saved" modal — the card disappearing is feedback enough
          const unsaveModal = document.getElementById(`unsave-modal-${fallingFruitId}`);
          if (unsaveModal) unsaveModal.classList.add("hidden");

          // Prefer animating the outer .plant-item wrapper so its margin collapses too
          const wrapper =
            cardEl.parentElement &&
            cardEl.parentElement.classList.contains("plant-item")
              ? cardEl.parentElement
              : cardEl;

          const startHeight = wrapper.offsetHeight;
          wrapper.style.overflow = "hidden";
          wrapper.style.transition =
            "opacity 0.25s ease, max-height 0.3s ease, margin 0.3s ease";
          wrapper.style.maxHeight = `${startHeight}px`;
          void wrapper.offsetHeight; // force reflow so the transition picks up the starting height
          wrapper.style.opacity = "0";
          wrapper.style.maxHeight = "0";
          wrapper.style.marginTop = "0";
          wrapper.style.marginBottom = "0";

          setTimeout(() => {
            wrapper.remove();
            updateSavedCount();
            showEmptyStateIfNeeded();
          }, 300);
        });

        observer.observe(saveIcon, {
          attributes: true,
          attributeFilter: ["class"],
        });
      });
    }

    // Replace the placeholder SVG with the real image when one is available
    if (imgUrl && imageContainer) {
      const img = document.createElement("img");
      img.src = imgUrl;
      img.alt = plantName;
      img.className = "w-full h-full object-cover rounded-xl";
      imageContainer.innerHTML = "";
      imageContainer.appendChild(img);
    }
  }

  function updateSavedCount() {
    const countEl = document.querySelector("[data-saved-count]");
    if (!countEl) return;
    const remaining = document.querySelectorAll(
      "#savedPlantsContainer .plant-item"
    ).length;
    countEl.textContent = `${remaining} PLANTS SAVED`;
  }

  function showEmptyStateIfNeeded() {
    const remaining = document.querySelectorAll(
      "#savedPlantsContainer .plant-item"
    ).length;
    if (remaining === 0) {
      window.location.reload();
    }
  }

  function init() {
    document.querySelectorAll("[data-saved-card]").forEach(initCard);
  }

  if (document.readyState === "loading") {
    document.addEventListener("DOMContentLoaded", init);
  } else {
    init();
  }
})();