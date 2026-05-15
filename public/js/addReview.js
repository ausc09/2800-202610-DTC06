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

function removePhotoPreview() {
  photoValidationRequestId += 1;
  photoStatus = "empty";

  if (previewUrl) {
    URL.revokeObjectURL(previewUrl);
    previewUrl = null;
  }

  photoInput.value = "";
  previewImg.src = "";
  photoPreview.classList.add("hidden");
  aiStatus.innerHTML = "";
  aiError.classList.add("hidden");
  aiError.classList.remove("flex");
  updateSubmitState();
}

function showPhotoError(message) {
  photoStatus = "failed";
  aiErrorText.textContent = message;
  aiError.classList.remove("hidden");
  aiError.classList.add("flex");
  aiStatus.innerHTML = "";
  updateSubmitState();
}

function showPhotoStatus(message, className) {
  aiStatus.innerHTML = `<span class="text-[10px] px-2 py-1 rounded-full shadow-sm ${className}">${message}</span>`;
}

async function validateSelectedPhoto(file) {
  const requestId = ++photoValidationRequestId;
  const formData = new FormData();
  formData.append("photo", file);

  photoStatus = "checking";
  aiError.classList.add("hidden");
  aiError.classList.remove("flex");
  showPhotoStatus("Checking photo...", "bg-white text-brand-muted");
  updateSubmitState();

  try {
    const res = await fetch("/reviews/api/validate-photo", {
      method: "POST",
      body: formData,
    });

    const data = await res.json();

    if (requestId !== photoValidationRequestId) return;

    if (!res.ok || !data.passed) {
      showPhotoError(data.message || "Please upload plant image.");
      return;
    }

    photoStatus = "passed";
    showPhotoStatus("Verified photo", "bg-brand-greenPale text-brand-green");
    updateSubmitState();
  } catch (error) {
    if (requestId !== photoValidationRequestId) return;
    showPhotoError("Please upload plant image.");
  }
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

uploadArea.addEventListener("click", () => {
  photoInput.click();
});

photoInput.addEventListener("change", () => {
  const file = photoInput.files?.[0];
  if (!file) return;

  if (!file.type.startsWith("image/")) {
    removePhotoPreview();
    showPhotoError("Please upload plant image.");
    return;
  }

  if (previewUrl) URL.revokeObjectURL(previewUrl);

  previewUrl = URL.createObjectURL(file);
  previewImg.src = previewUrl;
  photoPreview.classList.remove("hidden");
  aiError.classList.add("hidden");
  aiError.classList.remove("flex");
  validateSelectedPhoto(file);
});

removePhotoBtn.addEventListener("click", removePhotoPreview);

updateCharCount();
updateSubmitState();
