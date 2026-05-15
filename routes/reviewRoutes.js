const express = require("express");
const router = express.Router();
const multer = require("multer");

const { validatePlantImage } = require("../helpers/visionHelpers");

const upload = multer({ storage: multer.memoryStorage() });

router.post("/api/validate-photo", upload.single("photo"), async (req, res) => {
  try {
    if (!req.file) {
      return res
        .status(400)
        .json({ passed: false, message: "No image uploaded" });
    }

    const base64Image = req.file.buffer.toString("base64");
    const result = await validatePlantImage(base64Image);

    if (result.passed) {
      res.json({
        passed: true,
        message: "Image validated!",
        matchedLabel: result.matchedLabel,
      });
    } else {
      res.json({
        passed: false,
        message: "Please upload a photo of a plant only.",
      });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Something went wrong" });
  }
});

module.exports = router;
