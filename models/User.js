const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const UserSchema = new mongoose.Schema({
  firstName:        { type: String, required: true },
  lastName:         { type: String, required: true },
  email:            { type: String, required: true, unique: true },
  password:         { type: String },
  role:             { type: String, enum: ['user', 'admin'], default: 'user' }, //maybe delete later
  googleId:         { type: String, sparse: true },
  twoFactorSecret:  { type: String }, //maybe delete later
  twoFactorEnabled: { type: Boolean, default: false }, //maybe delete later
  favoritePlants:   [{ type: mongoose.Schema.Types.ObjectId, ref: 'Plant' }], //Plant id
}, { timestamps: true });

UserSchema.pre('save', async function () {
  if (!this.isModified('password') || !this.password) return;
  this.password = await bcrypt.hash(this.password, 12);
});

UserSchema.methods.comparePassword = function (candidate) {
  return bcrypt.compare(candidate, this.password);
};

module.exports = mongoose.model('User', UserSchema);