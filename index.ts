import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";
import { authRouter } from "./auth";


dotenv.config();

const app = express();
const PORT = process.env.PORT;
const MONGODB_URI = process.env.MONGODB_URI;


const connectDB = async () => {
  try {
    await mongoose.connect(MONGODB_URI as string);
    console.log("DB Connected Successfully");
  } catch (error) {
    console.log("DB Connect Failed:", error)
  }
};

app.use(cors());
app.use(express.json());
app.use("/api/auth", authRouter);


app.get("/", (req, res) => {
  res.send("AI Political Poster Maker Backend is running!");
});

app.listen(PORT, () => {
  connectDB();
  console.log(`Server is running on port ${PORT}`);
});
