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