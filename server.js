const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const productionRoutes = require("./routes/productionRoutes");

const app = express();
app.use(bodyParser.json());
app.use(cors());


// Use routes
app.use("/production", productionRoutes);

const PORT = 3000;
app.listen(PORT, "0.0.0.0", () => {
  console.log(`Server running on port ${PORT}`);
});



