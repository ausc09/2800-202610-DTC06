const wtSteps = [
  {
    text: "This shows where the data comes from, so you can judge how much to trust it.",
    targetId: "api-source-badge",
    arrowSide: "top",
    arrowRight: "24px"
  },
  {
    text: "Check the season and access info before heading out to forage.",
    targetId: "details-card",
    arrowSide: "top",
    arrowRight: "50%"
  },
  {
    text: "Tried this plant? Share your experience to help other foragers stay safe 🌿",
    targetId: "add-yours-btn",
    arrowSide: "bottom",
    arrowRight: "24px",
    isLast: true
  }
];

let currentStep = 0;

const addReviewButton = document.getElementById("add-yours-btn");

function navigateToAddReview() {
  const targetUrl = addReviewButton?.dataset.addReviewHref;
  if (targetUrl) {
    window.location.href = targetUrl;
  }
}

const plantId = addReviewButton?.dataset.plantId;
const reviewsContainer = document.getElementById("reviews");
const noReviewsMessage = document.querySelector(".no-reviews-message");

if (addReviewButton) {
  addReviewButton.addEventListener("click", navigateToAddReview);
}

async function fetchReviews() {
  if (!plantId || !reviewsContainer) return;

  try {
    const response = await fetch(`/review/${plantId}`,{
      method: "GET",
      headers: {
        "Content-Type": "application/json"
      }
    });
    if (!response.ok) {
      throw new Error(`Failed to load reviews: ${response.status}`);
    }
    const reviews = await response.json();
    console.log("Fetched reviews:", reviews);
    renderReviews(reviews);
  } catch (error) {
    console.error(error);
    if (noReviewsMessage) {
      noReviewsMessage.textContent = "Unable to load reviews.";
    }
  }
}

function renderReviewCard(review) {
  const card = document.createElement("div");
  card.className = "mb-4 p-5 bg-brand-surface border border-brand-border rounded-3xl shadow-sm";
  const username = (review.username || "Anonymous").trim();
  const initial = username ? username[0].toUpperCase() : "A";
  const rating = Math.min(5, Math.max(0, Number(review.rating) || 0));
  const starHtml = Array.from({ length: 5 }, (_, index) => {
    return index < rating
      ? '<i class="fa-solid fa-star text-brand-orange text-xs"></i>'
      : '<i class="fa-regular fa-star text-brand-border text-xs"></i>';
  }).join("");

  card.innerHTML = `
    <div class="flex items-start justify-between gap-4 mb-4">
      <div class="flex items-start gap-3">
        <div class="w-10 h-10 rounded-full bg-brand-greenPale flex items-center justify-center text-brand-green font-semibold">${initial}</div>
        <div>
          <p class="text-sm font-semibold text-brand-text">${review.username || "Anonymous"}</p>
          <div class="flex gap-1 mt-2">${starHtml}</div>
        </div>
      </div>
      <div class="text-[11px] text-brand-muted">${new Date(review.date).toLocaleDateString()}</div>
    </div>
    <p class="text-sm text-brand-text leading-relaxed">${review.comment || "No comment provided."}</p>
    ${review.foodSafetyNotes ? `<p class="text-[11px] text-brand-muted mt-3"><span class="font-semibold">Safety:</span> ${review.foodSafetyNotes}</p>` : ""}
  `;
  return card;
}

function renderReviews(reviews) {
  if (!reviewsContainer) return;
  reviewsContainer.innerHTML = "";

  if (!Array.isArray(reviews)) {
    if (reviews?.message && noReviewsMessage) {
      noReviewsMessage.textContent = reviews.message;
    }
    return;
  }

  if (reviews.length === 0) {
    if (noReviewsMessage) {
      noReviewsMessage.textContent = "No reviews yet.";
    }
    return;
  }

  if (noReviewsMessage) {
    noReviewsMessage.remove();
  }

  reviews.forEach((review) => {
    reviewsContainer.appendChild(renderReviewCard(review));
  });
}

fetchReviews();

function showStep(index) {
  const step     = wtSteps[index];
  const tooltip  = document.getElementById("wt-tooltip");
  const text     = document.getElementById("wt-text");
  const arrow    = document.getElementById("wt-arrow");
  const nextBtn  = document.getElementById("wt-next-btn");
  const target   = document.getElementById(step.targetId);

  if (!target) { nextStep(); return; }

  const rect = target.getBoundingClientRect();
  text.textContent = step.text;
  nextBtn.textContent = step.isLast ? "Done" : "Next";

  // Position tooltip
  if (step.arrowSide === "top") {
    tooltip.style.top  = (rect.bottom + 12) + "px";
    tooltip.style.bottom = "auto";
    arrow.style.top    = "-6px";
    arrow.style.bottom = "auto";
  } else {
    tooltip.style.bottom = (window.innerHeight - rect.top + 12) + "px";
    tooltip.style.top    = "auto";
    arrow.style.bottom   = "-6px";
    arrow.style.top      = "auto";
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
  document.getElementById("wt-tooltip").classList.add("opacity-0", "pointer-events-none", "hidden");
  document.getElementById("wt-overlay").classList.add("hidden");
}



document.addEventListener("DOMContentLoaded", () => {
  if (!localStorage.getItem("hint_plant_walkthrough")) {
    document.getElementById("wt-overlay").classList.remove("hidden");
    setTimeout(() => showStep(0), 500);
  }
});
