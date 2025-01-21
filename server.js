require("dotenv").config();
const express = require("express");
const mongoose = require("mongoose");
const taskRoutes = require("./routes/taskRoutes");
const authRoutes = require("./routes/authRoutes");

const app = express();
app.use(express.json());
const PORT = process.env.PORT || 5000;

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => console.log("MongoDB Connected"))
  .catch((err) => console.error("Error connection: ", err));
app.get("/", (req, res) => {
  res.send("Welcome to Task Manager API!");
});

app.use("/api", authRoutes);
app.use("/api", taskRoutes);

app.listen(PORT, () => console.log(`Server is running on port ${PORT}`));
