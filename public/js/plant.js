const wtSteps = [
  {
    text: "This shows where the data comes from, so you can judge how much to trust it.",
    targetId: "api-source-badge",
    arrowSide: "top",
    arrowRight: "24px",
  },
  {
    text: "Check the season and access info before heading out to forage.",
    targetId: "details-card",
    arrowSide: "top",
    arrowRight: "50%",
  },
  {
    text: "Tried this plant? Share your experience to help other foragers stay safe 🌿",
    targetId: "add-yours-btn",
    arrowSide: "bottom",
    arrowRight: "24px",
    isLast: true,
  },
];

let currentStep = 0;

function showStep(index) {
  const step = wtSteps[index];
  const tooltip = document.getElementById("wt-tooltip");
  const text = document.getElementById("wt-text");
  const arrow = document.getElementById("wt-arrow");
  const nextBtn = document.getElementById("wt-next-btn");
  const target = document.getElementById(step.targetId);

  if (!target) {
    nextStep();
    return;
  }

  const rect = target.getBoundingClientRect();
  text.textContent = step.text;
  nextBtn.textContent = step.isLast ? "Done" : "Next";

  // Position tooltip
  if (step.arrowSide === "top") {
    tooltip.style.top = rect.bottom + 12 + "px";
    tooltip.style.bottom = "auto";
    arrow.style.top = "-6px";
    arrow.style.bottom = "auto";
  } else {
    tooltip.style.bottom = window.innerHeight - rect.top + 12 + "px";
    tooltip.style.top = "auto";
    arrow.style.bottom = "-6px";
    arrow.style.top = "auto";
  }

  arrow.style.right = step.arrowRight;
  if (step.arrowRight === "50%") {
    arrow.style.transform = "translateX(50%) rotate(45deg)";
  } else {
    arrow.style.transform = "rotate(45deg)";
  }

  // Fade in
  tooltip.classList.remove("opacity-0", "pointer-events-none");
  tooltip.classList.add("opacity-100");
}

function nextStep() {
  const tooltip = document.getElementById("wt-tooltip");
  tooltip.classList.add("opacity-0", "pointer-events-none");
  tooltip.classList.remove("opacity-100");

  setTimeout(() => {
    currentStep++;
    if (currentStep >= wtSteps.length) {
      endWalkthrough();
    } else {
      showStep(currentStep);
    }
  }, 400);
}

function skipWalkthrough() {
  endWalkthrough();
}

function endWalkthrough() {
  localStorage.setItem("hint_plant_walkthrough", "true");
  document
    .getElementById("wt-tooltip")
    .classList.add("opacity-0", "pointer-events-none", "hidden");
  document.getElementById("wt-overlay").classList.add("hidden");
}

document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("hint_plant_walkthrough")) {
    document.getElementById("wt-overlay").classList.remove("hidden");
    setTimeout(() => showStep(0), 500);
  }
});

// ── AI Foraging Tip ──

// Grab all the UI elements from plant.ejs
const aiUploadArea = document.getElementById("ai-upload-area");
const aiPhotoInput = document.getElementById("ai-photo-input");
const aiGalleryBtn = document.getElementById("ai-gallery-btn");
const aiCameraBtn = document.getElementById("ai-camera-btn");
const aiPreview = document.getElementById("ai-photo-preview");
const aiPreviewImg = document.getElementById("ai-preview-img");
const aiRemoveBtn = document.getElementById("ai-remove-photo");
const aiLoading = document.getElementById("ai-loading");
const aiResult = document.getElementById("ai-result");
const aiResultText = document.getElementById("ai-result-text");
const aiRetryBtn = document.getElementById("ai-retry-btn");

// ── USER CONTROL: Gallery vs Camera ──
// Gallery opens photo library
// Camera opens device camera directly
aiGalleryBtn?.addEventListener("click", () => {
  aiPhotoInput.removeAttribute("capture");
  aiPhotoInput.click();
});

aiCameraBtn?.addEventListener("click", () => {
  aiPhotoInput.setAttribute("capture", "environment");
  aiPhotoInput.click();
});

// ── Photo selected → validate + preview ──
aiPhotoInput?.addEventListener("change", async (e) => {
  const file = e.target.files[0];
  if (!file) return;

  // VALIDATION: reject files over 5MB
  if (file.size > 5 * 1024 * 1024) {
    alert("Image must be under 5MB");
    return;
  }

  // Show preview then auto-analyze
  const reader = new FileReader();
  reader.onload = (ev) => {
    aiPreviewImg.src = ev.target.result;
    aiUploadArea.classList.add("hidden");
    aiPreview.classList.remove("hidden");
    aiResult.classList.add("hidden");
    analyzePhoto(ev.target.result);
  };
  reader.readAsDataURL(file);
});

// ── USER CONTROL: remove photo ──
aiRemoveBtn?.addEventListener("click", () => {
  aiPreviewImg.src = "";
  aiPhotoInput.value = "";
  aiPreview.classList.add("hidden");
  aiUploadArea.classList.remove("hidden");
  aiResult.classList.add("hidden");
  aiLoading.classList.add("hidden");
});

// ── USER CONTROL: retry with new photo ──
aiRetryBtn?.addEventListener("click", () => {
  aiPreview.classList.add("hidden");
  aiResult.classList.add("hidden");
  aiUploadArea.classList.remove("hidden");
  aiPhotoInput.value = "";
});

// ── Core: send photo to backend ──
async function analyzePhoto(dataUrl) {
  const base64 = dataUrl.split(",")[1];

  // Show loading spinner
  aiLoading.classList.remove("hidden");
  aiLoading.classList.add("flex");
  aiResult.classList.add("hidden");

  try {
    const resp = await fetch("/api/ai-foraging-tip", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        imageBase64: base64,
        plantName: window.PLANT_DATA.name,
        scientificName: window.PLANT_DATA.scientificName,
        season: window.PLANT_DATA.season,
        location: window.PLANT_DATA.location,
      }),
    });

    // GUARDRAIL: handle rate limit (429)
    if (resp.status === 429) {
      const errData = await resp.json();
      aiLoading.classList.add("hidden");
      aiLoading.classList.remove("flex");
      aiResultText.innerHTML =
        '<span class="text-amber-600 font-semibold">' +
        '<i class="fa-solid fa-clock"></i> ' +
        errData.message +
        "</span>";
      aiResult.classList.remove("hidden");
      return;
    }

    const data = await resp.json();

    aiLoading.classList.add("hidden");
    aiLoading.classList.remove("flex");

    if (!data.success) {
      // VALIDATION: not a plant photo
      aiResultText.innerHTML =
        '<span class="text-red-500 font-semibold">' +
        '<i class="fa-solid fa-triangle-exclamation">' +
        "</i> No plant detected.</span><br>" +
        "Please upload a clear photo.";
    } else if (data.lowConfidence) {
      // GUARDRAIL: low confidence warning
      aiResultText.innerHTML =
        '<span class="text-amber-600 font-semibold">' +
        "⚠️ Low confidence</span><br>" +
        data.tip;
    } else {
      // Success: show the tip
      aiResultText.textContent = data.tip;
    }

    aiResult.classList.remove("hidden");
  } catch (err) {
    aiLoading.classList.add("hidden");
    aiLoading.classList.remove("flex");
    aiResultText.textContent = "Something went wrong. Please try again.";
    aiResult.classList.remove("hidden");
  }
}
