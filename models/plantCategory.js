const mongoose = require('mongoose');

const plantCategorySchema = new mongoose.Schema({
    fallingFruitTypeId: { type: Number, required: true, unique: true },
    name: String,
    scientificName: String,
});

const PlantCategory = mongoose.model('PlantCategory', plantCategorySchema);

module.exports = PlantCategory;