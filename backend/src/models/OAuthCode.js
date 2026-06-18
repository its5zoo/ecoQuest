const mongoose = require('mongoose');
const crypto = require('crypto');

const oauthCodeSchema = new mongoose.Schema({
  code:     { type: String, required: true, unique: true },
  userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  expiresAt: { type: Date, required: true },
}, { timestamps: true });

oauthCodeSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

oauthCodeSchema.statics.createForUser = async function (userId) {
  const code = crypto.randomBytes(32).toString('hex');
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  await this.create({ code, userId, expiresAt });
  return code;
};

oauthCodeSchema.statics.consume = async function (code) {
  const doc = await this.findOneAndDelete({ code, expiresAt: { $gt: new Date() } });
  return doc;
};

module.exports = mongoose.model('OAuthCode', oauthCodeSchema);
