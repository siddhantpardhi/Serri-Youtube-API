import express from 'express';
import mongoose from 'mongoose';
import dotenv from 'dotenv';
import startVideoPolling from './youtubeApi.js';
import { DB_NAME } from './constants.js';

dotenv.config({
  path: "./.env"
});

const app = express();
app.use(express.json());

import videoRoutes from "./routes/video.route.js"

app.use("/api/v1/videos", videoRoutes )

// Placeholder route
app.get('/', (req, res) => {
  res.send('YouTube Video API is running');
});


// Connect to MongoDB and start polling
mongoose.connect(`${process.env.MONGODB_URI}/${DB_NAME}`)
  .then((data) => {
    console.log(`Connected to MongoDB at DB HOST: ${data.connection.host}`);
    startVideoPolling();
    const PORT = process.env.PORT || 5000;
    app.listen(PORT, () => console.log(`Server running on port: ${PORT}`));
  })
  .catch(err => {
    console.error('MongoDB connection error:', err.message);
  });

  app.use((req, res) => {
    res.status(404).send('Route not found');
  });  
