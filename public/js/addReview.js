// DOM references for the add review page
const ratingHelpBtn = document.getElementById("rating-help-btn");

//

const ratingInput = document.getElementById("rating-input");
const reviewText = document.getElementById("review-text");
const charCount = document.getElementById("char-count");
const uploadArea = document.getElementById("upload-area");
const photoInput = document.getElementById("photo-input");
const photoPreview = document.getElementById("photo-preview");
const previewImg = document.getElementById("preview-img");
const removePhotoBtn = document.getElementById("remove-photo");
const aiError = document.getElementById("ai-error");
const submitBtn = document.getElementById("submit-btn");
const progressBar = document.getElementById("progress-bar");
const progressText = document.getElementById("progress-text");
const draftBanner = document.getElementById("draft-banner");
const safetyNotesTextarea = document.querySelector("textarea[name='foodSafetyNotes']");


const reviewForm = document.querySelector("form[action^='/review']");
const draftStorageKey = (() => {
  const action = reviewForm?.action || "";
  const match = action.match(/\/review(?:\/|$)/);
  return match ? "plantReviewDraft" : "plantReviewDraft";
})();


const ratingTooltip = document.getElementById("rating-tooltip");
function toggleRatingTooltip() {
  ratingTooltip?.classList.toggle("hidden");
}

function hideRatingTooltip() {
  ratingTooltip?.classList.add("hidden");
}


const starButtons = Array.from(document.querySelectorAll(".star-btn"));
function updateStarVisuals(value) {
  starButtons.forEach((btn) => {
    const starValue = Number(btn.dataset.value);
    if (starValue <= value) {
      btn.classList.add("bg-brand-green", "text-white", "border-transparent");
      btn.classList.remove("text-brand-muted", "border-brand-border");
    } else {
      btn.classList.remove("bg-brand-green", "text-white", "border-transparent");
      btn.classList.add("text-brand-muted", "border-brand-border");
    }
  });
}



function getSelectedFruitingStatus() {
  return document.querySelector("input[name='fruitingStatus']:checked")?.value || "";
}

function updateProgress() {
  const rating = Number(ratingInput?.value || 0);
  const statusSelected = Boolean(getSelectedFruitingStatus());
  const completedSteps = [rating > 0, statusSelected].filter(Boolean).length;
  const percentage = (completedSteps / 2) * 100;

  progressBar.style.width = `${percentage}%`;
  progressText.textContent = `${completedSteps} / 2`;
}

function updateSubmitState() {
  const isValid = Number(ratingInput?.value || 0) > 0 && Boolean(getSelectedFruitingStatus());
  submitBtn.disabled = !isValid;
  submitBtn.classList.toggle("bg-brand-green", isValid);
  submitBtn.classList.toggle("text-white", isValid);
  submitBtn.classList.toggle("cursor-not-allowed", !isValid);
  submitBtn.classList.toggle("text-brand-muted", !isValid);
  submitBtn.classList.toggle("bg-brand-border", !isValid);
  updateProgress();
}

function updateCharCount() {
  const length = reviewText.value.length;
  charCount.textContent = `${length} / 500`;
}

function previewSelectedPhoto(file) {
  if (!file) return;
  const reader = new FileReader();
  reader.onload = () => {
    previewImg.src = reader.result;
    photoPreview.classList.remove("hidden");
    aiError.classList.add("hidden");
  };
  reader.readAsDataURL(file);
}

function clearPhotoSelection() {
  photoInput.value = "";
  previewImg.src = "";
  photoPreview.classList.add("hidden");
  aiError.classList.add("hidden");
}

function gatherDraftData() {
  return {
    rating: ratingInput.value,
    comment: reviewText.value,
    foodSafetyNotes: safetyNotesTextarea?.value || "",
    fruitingStatus: getSelectedFruitingStatus(),
    photoName: photoInput.files?.[0]?.name || "",
  };
}

function restoreDraft() {
  const rawDraft = localStorage.getItem(draftStorageKey);
  if (!rawDraft) return;

  try {
    const draft = JSON.parse(rawDraft);
    if (draft.rating) {
      ratingInput.value = draft.rating;
      updateStarVisuals(Number(draft.rating));
    }
    if (draft.comment) reviewText.value = draft.comment;
    if (draft.foodSafetyNotes) safetyNotesTextarea.value = draft.foodSafetyNotes;
    if (draft.fruitingStatus) {
      const radio = document.querySelector(`input[name='fruitingStatus'][value='${draft.fruitingStatus}']`);
      if (radio) radio.checked = true;
    }

    if (draft.rating || draft.review || draft.safetyNotes || draft.fruitingStatus) {
      draftBanner.classList.remove("hidden");
    }
  } catch (error) {
    console.warn("Could not parse saved draft", error);
  }
}

function saveDraftAndExit() {
  const data = gatherDraftData();
  localStorage.setItem(draftStorageKey, JSON.stringify(data));
  history.back();
}

function clearDraft() {
  localStorage.removeItem(draftStorageKey);
  draftBanner.classList.add("hidden");
}

function handleFormSubmit(event) {
  if (!Number(ratingInput.value) || !getSelectedFruitingStatus()) {
    event.preventDefault();
    alert("Please select a rating and a fruiting status before submitting.");
    return;
  }
  localStorage.removeItem(draftStorageKey);
}

ratingHelpBtn?.addEventListener("click", (event) => {
  event.stopPropagation();
  toggleRatingTooltip();
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#rating-help-btn") && !e.target.closest("#rating-tooltip")) {
    hideRatingTooltip();
  }
});

starButtons.forEach((button) => {
  button.addEventListener("click", () => {
    const value = Number(button.dataset.value) || 0;
    ratingInput.value = value;
    updateStarVisuals(value);
    updateSubmitState();
  });
});

reviewText?.addEventListener("input", () => {
  updateCharCount();
});

uploadArea?.addEventListener("click", () => {
  photoInput?.click();
});

photoInput?.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) {
    clearPhotoSelection();
    return;
  }
  previewSelectedPhoto(file);
});

removePhotoBtn?.addEventListener("click", () => {
  clearPhotoSelection();
});

reviewForm?.addEventListener("change", (event) => {
  if (event.target.name === "fruitingStatus") {
    updateSubmitState();
  }
});

reviewForm?.addEventListener("submit", handleFormSubmit);

window.saveDraftAndExit = saveDraftAndExit;
window.clearDraft = clearDraft;

restoreDraft();
updateCharCount();
updateSubmitState();

