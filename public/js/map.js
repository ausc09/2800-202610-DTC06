// Greeting based on time of day
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

