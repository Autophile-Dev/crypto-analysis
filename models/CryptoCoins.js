const mongoose = require("mongoose");

const cryptoCoinsSchema = new mongoose.Schema({
  coinName: String,
  coinSymbol: String,
  coinImage: String,
  coinPrice: String, // Keep this as Number since it's already a numeric value
  totalVol: String, // Change to String
  topTierVol: String, // Change to String
  marketCap: String, // Change to String
  _24HPCT: Number, // Keep this as Number
});

const CryptoCoins = mongoose.model("crypto_coins", cryptoCoinsSchema);

module.exports = CryptoCoins;
