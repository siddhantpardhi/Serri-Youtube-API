import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import startVideoPolling from './youtubeApi.js';
import { DB_NAME } from './constants.js';
import connectDB from "./database/database.js"

dotenv.config({
  path: "./.env"
});

const app = express();
app.use(express.json());

import videoRoutes from "./routes/video.route.js"

app.use("/api/v1/videos", videoRoutes)

app.get('/', (req, res) => {
  res.send('YouTube Video API is running');
});

// Connect to MongoDB and start polling
connectDB()
  .then((connectionInstance) => {
    console.log(`MongoDB connected DB Host: ${connectionInstance.connection.host}`)
    startVideoPolling();
    const PORT = process.env.PORT
    app.listen(PORT, () => {
      console.log(`App is listening on ${PORT}`);

    })
  })
  .catch((err) => {
    console.log("Error while connecting to database: ", err.message)
  })

app.use((req, res) => {
  res.status(404).send('Route not found');
});  
