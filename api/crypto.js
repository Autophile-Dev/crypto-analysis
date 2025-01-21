const axios = require("axios");
const CryptoCoins = require("../models/CryptoCoins");
const CryptoCoins7Days = require("../models/cryptoCoins7Days");
const connectDB = require("./db");
// MongoDB connection
connectDB();


// Function to fetch and update crypto data
const fetchCryptoData = async () => {
  const API_URL =
    "https://min-api.cryptocompare.com/data/pricemultifull?fsyms=BTC,ETH,TRUMP,SOL,DOGE&tsyms=USD";
  const API_KEY =
    "57b04e3783f71d174ce961d98f8e84d7a8b37a58e67757819ea22c8fbd32517f";

  try {
    const response = await axios.get(API_URL, {
      headers: { authorization: `Apikey ${API_KEY}` },
    });

    const coins = response.data.DISPLAY;

    // Update CryptoCoins table
    for (const symbol in coins) {
      const coinData = {
        coinName: symbol,
        coinSymbol: response.data.RAW[symbol].USD.FROMSYMBOL,
        coinImage: `https://www.cryptocompare.com${response.data.RAW[symbol].USD.IMAGEURL}`,
        coinPrice: response.data.DISPLAY[symbol].USD.PRICE,
        totalVol: response.data.DISPLAY[symbol].USD.TOTALVOLUME24HTO,
        topTierVol: response.data.DISPLAY[symbol].USD.TOTALTOPTIERVOLUME24HTO,
        marketCap: response.data.DISPLAY[symbol].USD.MKTCAP,
        _24HPCT: response.data.DISPLAY[symbol].USD.CHANGEPCT24HOUR,
      };

      await CryptoCoins.updateOne({ coinSymbol: symbol }, coinData, {
        upsert: true,
      });
    }

    console.log("CryptoCoins table updated.");
  } catch (error) {
    console.error("Error fetching crypto data:", error.message);
  }
};

// Function to store data daily at 11:59 PM in CryptoCoins7Days
const storeDailyData = async () => {
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

    console.log("Daily data stored in CryptoCoins7Days.");
  } catch (error) {
    console.error("Error storing daily data:", error.message);
  }
};

// API endpoint
module.exports = async (req, res) => {
  if (req.method === "POST") {
    const { type } = req.body;

    if (type === "fetchCryptoData") {
      await fetchCryptoData();
      return res
        .status(200)
        .json({ message: "Crypto data updated successfully." });
    } else if (type === "storeDailyData") {
      await storeDailyData();
      return res
        .status(200)
        .json({ message: "Daily data stored successfully." });
    } else {
      return res.status(400).json({ message: "Invalid request type." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
};
