const express = require("express");
const mongoose = require("mongoose");
require("dotenv").config();

const app = express();
const PORT = process.env.PORT || 3000;
const plantRoutes = require("./routes/plantRoutes");

async function main() {
  try {
    await connectDB();
    app.set("view engine", "ejs");
    app.use(express.static("public"));
    app.use(express.urlencoded({ extended: true }));
    app.use(express.json());
    app.use(plantRoutes);
    app.get("/", (req, res) => {
      res.render("index.ejs", {
        userPlaceholder: "UserPlaceHolder",
      });
    });
    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.log(error);
  }
}

async function connectDB() {
  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("MongoDB connected");
  } catch (error) {
    console.log(error);
  }
}

main();
