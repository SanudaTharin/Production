const express = require("express");
const bodyParser = require("body-parser");
const cors = require("cors");

const productionRoutes = require("./routes/productionRoutes");

const app = express();
app.use(bodyParser.json());
app.use(cors());

//Use routes
app.use("/production", productionRoutes);

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));



