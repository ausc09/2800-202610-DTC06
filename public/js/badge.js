(() => {
  if (!BADGE_TIER) return;

  const badgeData = {
    1: { icon: "🌱", name: "Sprout", title: "First Review!", subtitle: "You planted your first seed in the community", emoji: "🌱", count: 1 },
    2: { icon: "🌿", name: "Plant Scout", title: "5 Reviews!", subtitle: "You're becoming a seasoned forager", emoji: "🌿", count: 5 },
    3: { icon: "🏆", name: "Master Forager", title: "10 Reviews!", subtitle: "Your knowledge is helping the community thrive", emoji: "🏆", count: 10 },
    4: { icon: "🧑‍🔬", name: "Botanist", title: "25 Reviews!", subtitle: "You're a true plant expert", emoji: "🧑‍🔬", count: 25 },
  };

  const data = badgeData[BADGE_TIER];
  if (!data) return;

  document.getElementById("badge-circle").textContent = data.icon;
  document.getElementById("badge-name-pill").textContent = data.name;
  document.getElementById("badge-title").textContent = data.title;
  document.getElementById("badge-subtitle").textContent = data.subtitle;
  document.getElementById("badge-stats").innerHTML =
    data.emoji + " " + data.count + (data.count === 1 ? " review" : " reviews") + " completed";

  // Tier dot indicator
  for (let i = 1; i <= 4; i++) {
    const dot = document.getElementById("badge-dot-" + i);
    if (i <= BADGE_TIER) {
      dot.classList.remove("bg-gray-300");
      dot.classList.add(BADGE_TIER >= 3 ? "bg-brand-brown" : "bg-brand-green");
    }
  }

  // Brown theme for tier 3-4
  if (BADGE_TIER >= 3) {
    document.getElementById("badge-circle").classList.remove("bg-brand-greenPale");
    document.getElementById("badge-circle").classList.add("bg-[#EEEAE4]");
    document.getElementById("badge-name-pill").classList.remove("bg-brand-greenPale", "text-brand-green");
    document.getElementById("badge-name-pill").classList.add("bg-[#EEEAE4]", "text-brand-brown");
  }

  // Show modal
  document.getElementById("badge-overlay").style.display = "block";

  // Leaf animation
  startLeafAnimation();

  function startLeafAnimation() {
    const canvas = document.getElementById("leaf-canvas");
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight;
    const ctx = canvas.getContext("2d");

    const leaves = ["🍃", "🌿", "☘️", "🍀", "🌱"];
    const particles = [];

    for (let i = 0; i < 35; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: -Math.random() * canvas.height,
        size: 16 + Math.random() * 12,
        speed: 1.5 + Math.random() * 2,
        sway: Math.random() * 2 - 1,
        leaf: leaves[Math.floor(Math.random() * leaves.length)],
        rotation: Math.random() * 360,
        rotSpeed: (Math.random() - 0.5) * 3,
      });
    }

    const start = Date.now();

    function draw() {
    const allDone = particles.every(p => p.y > canvas.height + 50);
    if (allDone) return;

      ctx.clearRect(0, 0, canvas.width, canvas.height);

      particles.forEach((p) => {
        p.y += p.speed;
        p.x += Math.sin(p.y / 40) * p.sway;
        p.rotation += p.rotSpeed;

        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate((p.rotation * Math.PI) / 180);
        ctx.font = p.size + "px serif";
        ctx.textAlign = "center";
        ctx.fillText(p.leaf, 0, 0);
        ctx.restore();
      });

      requestAnimationFrame(draw);
    }

    draw();
  }
})();

function closeBadgeModal() {
  const overlay = document.getElementById("badge-overlay");
  overlay.style.opacity = "0";
  overlay.style.transition = "opacity 0.3s";
  setTimeout(() => {
    overlay.style.display = "none";
  }, 300);

  // Clean URL
  const url = new URL(window.location);
  url.searchParams.delete("badge");
  history.replaceState(null, "", url.pathname + url.search);
}