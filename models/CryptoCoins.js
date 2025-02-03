const mongoose = require("mongoose");

const cryptoCoinsSchema = new mongoose.Schema({
  coinName: String,
  coinSymbol: String,
  coinImage: String,
  coinPrice: Number, // Keep this as Number since it's already a numeric value
  totalVol: Number, // Change to String
  topTierVol: Number, // Change to String
  marketCap: Number, // Change to String
  _24HPCT: Number, // Keep this as Number
});

const CryptoCoins = mongoose.model("crypto_coins", cryptoCoinsSchema);

module.exports = CryptoCoins;
