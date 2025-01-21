const mongoose = require("mongoose");

const cryptoCoins7DaysSchema = new mongoose.Schema({
  cryptoCoinID: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "crypto_coins",
    required: true,
  },
  priceAt12Am: { type: Number, required: true },
  date: { type: Date, required: true },
});

const CryptoCoins7Days = mongoose.model(
  "crypto_coins_7days",
  cryptoCoins7DaysSchema
);

module.exports = CryptoCoins7Days;
