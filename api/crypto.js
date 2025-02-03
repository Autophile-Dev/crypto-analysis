const axios = require("axios");
const CryptoCoins = require("../models/CryptoCoins");
const CryptoCoins7Days = require("../models/cryptoCoins7Days");
const connectDB = require("./db");
// MongoDB connection
connectDB();
const updatedData = [];
const dailyDataList = [];
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
        coinPrice: response.data.RAW[symbol].USD.PRICE,
        totalVol: response.data.RAW[symbol].USD.TOTALVOLUME24HTO,
        topTierVol: response.data.RAW[symbol].USD.TOTALTOPTIERVOLUME24HTO,
        marketCap: response.data.RAW[symbol].USD.MKTCAP,
        _24HPCT: response.data.DISPLAY[symbol].USD.CHANGEPCT24HOUR,
      };

      await CryptoCoins.updateOne({ coinSymbol: symbol }, coinData, {
        upsert: true,
      });
      updatedData.push(coinData);
    }

    console.log("CryptoCoins table updated.");
    return updatedData;
  } catch (error) {
    console.error("Error fetching crypto data:", error.message);
  }
};
// Run fetchCryptoData every second
setInterval(fetchCryptoData, 1000);
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
      dailyDataList.push(dailyData);
    }

    console.log("Daily data stored in CryptoCoins7Days.");
    return dailyDataList;
  } catch (error) {
    console.error("Error storing daily data:", error.message);
  }
};
// Function to fetch all coins' data along with historical records
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

// API endpoint
module.exports = async (req, res) => {
  if (req.method === "GET") {
    const { type } = req.query;

    if (type === "fetchCryptoData") {
      await fetchCryptoData();
      return res.status(200).json({
        message: "Crypto data updated successfully.",
        updatedData,
      });
    } else if (type === "storeDailyData") {
      await storeDailyData();
      return res.status(200).json({
        message: "Daily data stored successfully.",
        dailyDataList,
      });
    } else if (type === "fetchAllCoinsData") {
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
    } else {
      return res.status(400).json({ message: "Invalid request type." });
    }
  } else {
    res.status(405).json({ message: "Method not allowed." });
  }
};
