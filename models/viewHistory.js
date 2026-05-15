const mongoose = require('mongoose');

const viewHistorySchema = new mongoose.Schema({
  userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  fallingFruitId: { type: Number, required: true },
  plantName: { type: String, required: true },
  viewedAt: { type: Date, default: Date.now },
});

module.exports = mongoose.model('ViewHistory', viewHistorySchema);