import axios from 'axios';
import * as rax from 'retry-axios';
import { Video } from './models/video.model.js';
import schedule from "node-schedule"
import { SEARCH_QUERY, INTERVAL, YT_API_URL } from './constants.js';
import redisClient from './utils/redisClient.js';

const axiosInstance = axios.create(); // creating an axios Instance
axiosInstance.defaults.raxConfig = { // setting retry configuration for axios instance using rax(retry axios)
  instance: axiosInstance,
  retry: 5, // total attempts = 1 original + 4 retries
  noResponseRetries: 2, // allows 2 retries even if there’s no response from the server 
  retryDelay: 1000, // base delay between retries
  backoffType: 'exponential', // retry delay will increase exponentially
  httpMethodsToRetry: ['GET', 'POST'], // only GET and POST requests will be retried.
  statusCodesToRetry: [[429, 429], [500, 599]], // only 429(too many requests) and 5xx server error will be retried
  onRetryAttempt: err => { // function runs on each retry attempt
    const cfg = rax.getConfig(err);
    console.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
  }
};

rax.attach(axiosInstance); // this attaches retry-axios logic to the axios instance
let currentKeyIndex = 0

async function fetchYouTubeVideos() {
  try {

    const apiKeys = process.env.YOUTUBE_API_KEY.split(",")
    console.log("🚀 ~ fetchYouTubeVideos ~ apiKeys:", apiKeys.length)
    const apiKey = apiKeys[currentKeyIndex];
    currentKeyIndex = (currentKeyIndex + 1) % apiKeys.length;
    console.log("🚀 ~ fetchYouTubeVideos ~ apiKey:", apiKey)

    const latestVideo = await Video.findOne().sort({ publishedAt: -1 });

    // console.log("🚀 ~ fetchYouTubeVideos ~ latestVideo:", latestVideo)
    const publishedAfter = latestVideo ? latestVideo.publishedAt.toISOString() : new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    // console.log("🚀 ~ fetchYouTubeVideos ~ publishedAfter:", publishedAfter)

    const response = await axiosInstance.get(YT_API_URL, { // fetching videos that are published after latestVideo
      timeout: 5000,
      params: {
        key: apiKey,
        q: SEARCH_QUERY,
        part: 'snippet',
        type: 'video',
        order: 'date',
        maxResults: 10,
        publishedAfter
      }
    });
    // console.log("🚀 ~ fetchYouTubeVideos ~ response:", JSON.stringify(response.data.items))

    const videos = response.data.items.filter((item) => item.id && item.id.videoId);
    // console.log("🚀 ~ fetchYouTubeVideos ~ videos:", videos)

    const operations = videos.map((video) => ({
      updateOne: {
        filter: { videoId: video.id.videoId },
        update: {
          $setOnInsert: {
            videoId: video.id.videoId,
            url: `https://www.youtube.com/watch?v=${video.id.videoId}`,
            title: video.snippet.title,
            description: video.snippet.description,
            publishedAt: video.snippet.publishedAt,
            thumbnails: video.snippet.thumbnails
          }
        },
        upsert: true
      }
    }));

    if (operations.length > 0) {
      await Video.bulkWrite(operations);
      const keys = await redisClient.keys('videos:*'); // retrieving redis cache data if it exists
      if (keys.length > 0) {
        console.log("Deleting cache: ", keys)
        await redisClient.del(keys); // deleting cache data if it exists
      }
      console.log('Fetched and saved videos');
    }

  } catch (err) {
    console.error('Error fetching videos:', err.message);
  }
}

export default function startVideoPolling() {
  // setInterval(fetchYouTubeVideos, INTERVAL);

  schedule.scheduleJob(`*/${INTERVAL} * * * * *`, () => { // using scheduler over setInterval because scheduler is more flexible if tomorrow requirements change and it is asked that the function should run at a particular time of the day or something like that, it will be helpful
    fetchYouTubeVideos()
  })
}
