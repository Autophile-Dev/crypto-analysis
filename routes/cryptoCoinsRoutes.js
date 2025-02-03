const express = require("express");
const axios = require("axios");
const CryptoCoins = require("../models/CryptoCoins");
const CryptoCoins7Days = require("../models/cryptoCoins7Days");
const cron = require("node-cron"); // For daily cron job

const router = express.Router();

// Function to fetch and update crypto coins every second
const fetchCryptoData = async () => {
  try {
    const API_URL =
      "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,TRUMP,SOL,DOGE&tsyms=USD";
    const API_KEY =
      "57b04e3783f71d174ce961d98f8e84d7a8b37a58e67757819ea22c8fbd32517f";

    // Fetch data from the API
    const response = await axios.get(API_URL, {
      headers: { authorization: `Apikey ${API_KEY}` },
    });

    const coins = response.data.DISPLAY;

    // Process and update each coin
    for (const symbol in coins) {
      const coinData = {
        coinName: symbol,
        coinSymbol: response.data.RAW[symbol].USD.FROMSYMBOL,
        coinImage: `https://www.cryptocompare.com${response.data.RAW[symbol].USD.IMAGEURL}`,
        coinPrice: response.data.RAW[symbol].USD.PRICE,
        totalVol: response.data.DISPLAY[symbol].USD.TOTALVOLUME24HTO,
        topTierVol: response.data.DISPLAY[symbol].USD.TOTALTOPTIERVOLUME24HTO,
        marketCap: response.data.DISPLAY[symbol].USD.MKTCAP,
        _24HPCT: response.data.DISPLAY[symbol].USD.CHANGEPCT24HOUR,
      };

      // Update the crypto_coins table
      await CryptoCoins.updateOne({ coinSymbol: symbol }, coinData, {
        upsert: true,
      });
    }

    console.log("Data updated successfully.");
  } catch (error) {
    console.error("Error fetching data from CryptoCompare API:", error.message);
  }
};

// Run fetchCryptoData every second
setInterval(fetchCryptoData, 1000);

// Schedule a daily cron job to store data in crypto_coins_7days at 11:59 PM
cron.schedule("59 23 * * *", async () => {
  try {
    const coins = await CryptoCoins.find();

    for (const coin of coins) {
      const dailyData = {
        cryptoCoinID: coin._id,
        priceAt12Am: coin.coinPrice,
        date: new Date(),
      };

      await CryptoCoins7Days.create(dailyData);
    }

    console.log("Daily data stored in crypto_coins_7days at 11:59 PM.");
  } catch (error) {
    console.error("Error storing daily data:", error.message);
  }
});
const fetchAllCoinsData = async () => {
  try {
    await fetchCryptoData(); // Update latest data

    const allCoins = await CryptoCoins.find();

    const allCoinsWithHistory = await Promise.all(
      allCoins.map(async (coin) => {
        const historicalData = await CryptoCoins7Days.find({
          cryptoCoinID: coin._id,
        }).sort({ date: -1 });

        return {
          ...coin.toObject(),
          historicalData,
        };
      })
    );

    console.log("Fetched all coins data with historical records.");
    return allCoinsWithHistory;
  } catch (error) {
    console.error("Error fetching all coins data:", error.message);
    throw error;
  }
};
router.get("/test", (req, res) => {
  res.status(200).json({ message: "Crypto fetching service is running!" });
});
router.get("/all-coins", async (req, res) => {
  try {
    const allCoinsData = await fetchAllCoinsData();
    return res.status(200).json({
      message: "All coins data fetched successfully.",
      allCoinsData,
    });
  } catch (error) {
    return res
      .status(500)
      .json({ message: "Error fetching data.", error: error.message });
  }
});

module.exports = router;
