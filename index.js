const express = require("express");
const fetch = require("node-fetch");
const connectDB = require("./db");
const cryptoRoute=require("./routes/cryptoCoinsRoutes")
const app = express();
const PORT = 5000;

// Middleware

app.use(express.json());
app.use("/new-api/crypto", cryptoRoute);
// Connect to MongoDB Atlas
connectDB();



// Start the server
app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});
