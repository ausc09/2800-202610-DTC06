// Rating guide tooltip
document.getElementById("rating-help-btn")?.addEventListener("click", () => {
  document.getElementById("rating-tooltip").classList.toggle("hidden");
});

document.addEventListener("click", (e) => {
  if (!e.target.closest("#rating-help-btn") && !e.target.closest("#rating-tooltip")) {
    document.getElementById("rating-tooltip")?.classList.add("hidden");
  }
});