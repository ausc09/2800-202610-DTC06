const PLANT_LABELS = [
  "plant",
  "fruit tree",
  "woody plant",
  "flowering plant",
  "tree",
  "herb",
  "leaf",
  "flower",
  "shrub",
  "herbaceous plant",
  "wildflower",
  "petal",
  "passion flowers",
  "purple passionflower",
  "branch",
  "twig",
  "root",
  "garden",
];

const FOOD_LABELS = [
  "food",
  "tableware",
  "dish",
  "meal",
  "recipe",
  "salad",
  "cuisine",
  "ingredient",
];

async function validatePlantImage(base64Image) {
  const API_KEY = process.env.GOOGLE_VISION_API_KEY;

  const response = await fetch(
    `https://vision.googleapis.com/v1/images:annotate?key=${API_KEY}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        requests: [
          {
            image: { content: base64Image },
            features: [{ type: "LABEL_DETECTION", maxResults: 10 }],
          },
        ],
      }),
    },
  );

  const data = await response.json();
  const labels = data.responses[0].labelAnnotations || [];

  const matched = labels.find(
    (label) =>
      PLANT_LABELS.includes(label.description.toLowerCase()) &&
      label.score >= 0.7,
  );

  const isFood = labels.some((label) =>
    FOOD_LABELS.includes(label.description.toLowerCase()),
  );

  // fail only if food detected AND no plant labels found
  if (isFood && !matched) {
    return {
      passed: false,
      matchedLabel: null,
      allLabels: labels.map((l) => l.description),
    };
  }

  return {
    passed: !!matched,
    matchedLabel: matched ? matched.description : null,
    allLabels: labels.map((l) => l.description),
  };
}

module.exports = { validatePlantImage };
