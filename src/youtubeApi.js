import axios from 'axios';
import * as rax from 'retry-axios';
import { Video } from './models/video.model.js';
import schedule from "node-schedule"
import { SEARCH_QUERY, INTERVAL, YT_API_URL } from './constants.js';

const axiosInstance = axios.create();
axiosInstance.defaults.raxConfig = {
  instance: axiosInstance,
  retry: 5, // total attempts = 1 original + 4 retries
  noResponseRetries: 2,
  retryDelay: 1000, // base delay in ms
  backoffType: 'exponential',
  httpMethodsToRetry: ['GET', 'POST'],
  statusCodesToRetry: [[429, 429], [500, 599]],
  onRetryAttempt: err => {
    const cfg = rax.getConfig(err);
    console.warn(`Retry attempt #${cfg?.currentRetryAttempt}`);
  }
};

rax.attach(axiosInstance);

async function fetchYouTubeVideos() {
  try {

    const latestVideo = await Video.findOne().sort({ publishedAt: -1 });

    // console.log("🚀 ~ fetchYouTubeVideos ~ latestVideo:", latestVideo)
    const publishedAfter = latestVideo ? latestVideo.publishedAt.toISOString() : new Date(Date.now() - 1000 * 60 * 60 * 24).toISOString();
    // console.log("🚀 ~ fetchYouTubeVideos ~ publishedAfter:", publishedAfter)

    const response = await axiosInstance.get(YT_API_URL, {
      timeout: 5000,
      params: {
        key: process.env.YOUTUBE_API_KEY,
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
    }

    console.log('Fetched and saved videos');
  } catch (err) {
    console.error('Error fetching videos:', err.message);
  }
}

export default function startVideoPolling() {
  // setInterval(fetchYouTubeVideos, INTERVAL);

  schedule.scheduleJob(`*/${INTERVAL} * * * * *`, () => {
    fetchYouTubeVideos()
  })
}
