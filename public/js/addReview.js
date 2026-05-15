const form = document.querySelector("form");
const ratingHelpBtn = document.getElementById("rating-help-btn");
const ratingTooltip = document.getElementById("rating-tooltip");
const ratingInput = document.getElementById("rating-input");
const starButtons = document.querySelectorAll(".star-btn");
const statusInputs = document.querySelectorAll('input[name="fruitingStatus"]');
const reviewText = document.getElementById("review-text");
const charCount = document.getElementById("char-count");
const submitBtn = document.getElementById("submit-btn");
const uploadArea = document.getElementById("upload-area");
const photoInput = document.getElementById("photo-input");
const photoPreview = document.getElementById("photo-preview");
const previewImg = document.getElementById("preview-img");
const removePhotoBtn = document.getElementById("remove-photo");
const aiStatus = document.getElementById("ai-status");
const aiError = document.getElementById("ai-error");
const aiErrorText = aiError.querySelector("p");

let previewUrl = null;
let photoStatus = "empty";
let photoValidationRequestId = 0;

function selectedStatus() {
  return (
    document.querySelector('input[name="fruitingStatus"]:checked')?.value || ""
  );
}

function updateRating(value) {
  const rating = Number(value) || 0;
  ratingInput.value = rating;

  starButtons.forEach((button) => {
    const isActive = Number(button.dataset.value) <= rating;
    button.classList.toggle("border-brand-star", isActive);
    button.classList.toggle("text-brand-star", isActive);
    button.classList.toggle("text-brand-muted", !isActive);
  });

  updateSubmitState();
}

function updateCharCount() {
  charCount.textContent = `${reviewText.value.length} / 500`;
}

function updateSubmitState() {
  const requiredFieldsReady =
    Number(ratingInput.value) > 0 && Boolean(selectedStatus());
  const photoIsReady = photoStatus !== "checking" && photoStatus !== "failed";
  const isReady = requiredFieldsReady && photoIsReady;

  submitBtn.disabled = !isReady;
  submitBtn.classList.toggle("bg-brand-border", !isReady);
  submitBtn.classList.toggle("text-brand-muted", !isReady);
  submitBtn.classList.toggle("cursor-not-allowed", !isReady);
  submitBtn.classList.toggle("bg-brand-green", isReady);
  submitBtn.classList.toggle("text-white", isReady);
  submitBtn.classList.toggle("cursor-pointer", isReady);
}

ratingHelpBtn.addEventListener("click", () => {
  ratingTooltip.classList.toggle("hidden");
});

document.addEventListener("click", (event) => {
  if (
    !event.target.closest("#rating-help-btn") &&
    !event.target.closest("#rating-tooltip")
  ) {
    ratingTooltip.classList.add("hidden");
  }
});

starButtons.forEach((button) => {
  button.addEventListener("click", () => {
    updateRating(button.dataset.value);
  });
});

statusInputs.forEach((input) => {
  input.addEventListener("change", () => {
    updateSubmitState();
  });
});

reviewText.addEventListener("input", () => {
  updateCharCount();
});

form.addEventListener("submit", (event) => {
  if (
    submitBtn.disabled ||
    photoStatus === "checking" ||
    photoStatus === "failed"
  ) {
    event.preventDefault();
  }
});

updateCharCount();
updateSubmitState();
