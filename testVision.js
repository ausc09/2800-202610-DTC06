require("dotenv").config();
const fs = require("fs");
const path = require("path");

const API_KEY = process.env.GOOGLE_VISION_API_KEY;

async function testVision() {
  const imagePath = path.join(__dirname, "testImage.jpg");
  const imageData = fs.readFileSync(imagePath);
  const base64Image = imageData.toString("base64");

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
  const labels = data.responses[0].labelAnnotations;
  console.log("Labels found:");
  labels.forEach((label) => {
    console.log(`- ${label.description} (${Math.round(label.score * 100)}%)`);
  });
}

testVision();
