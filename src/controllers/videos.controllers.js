import { Video } from "../models/video.model.js"
import redisClient from "../utils/redisClient.js";

export const getAllVideos = async (req, res) => {

    try {
        const page = Math.max(parseInt(req.query.page) || 0, 1) // making sure even if user passes NaN, 0 or negative value, it gets 1 by default
        let parsedLimit = parseInt(req.query.limit);
        const limit = Math.min(Math.max(!isNaN(parsedLimit) ? parsedLimit : 10, 1), 50);

        const skip = (page - 1) * limit

       try {
         const cacheKey = `videos:all:page=${page}&limit=${limit}`;
         const cachedData = await redisClient.get(cacheKey); // retrieving redis cache
 
         if (cachedData) {
             console.log("Hello Redis Cache Get All Videos")
             return res.status(200).json(JSON.parse(cachedData)); // if cache exists, returning it 
         }
       } catch (error) {
        console.error("Redis Get Error: ", error);
        
       }

        const videosPromise = Video.find({}) 
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-_id -__v")
            .lean()

        const totalCountPromise = Video.countDocuments()

        const [videos, totalCount] = await Promise.all([videosPromise, totalCountPromise])

        const response = {
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            videos,
            videosLength: videos.length
        }

        try {
            await redisClient.setEx(cacheKey, 600, JSON.stringify(response)) //setting redis cache 
        } catch (error) {
            console.error("Redis Set Error: ", error)
        }

        res.status(200).json(response)
    } catch (error) {
        console.error("Error while listing all videos: ", error)
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error})

    }
}

export const searchVideo = async (req, res) => {
    try {
        const { q } = req.query;

        const page = Math.max(parseInt(req.query.page) || 0, 1)
        let parsedLimit = parseInt(req.query.limit);
        const limit = Math.min(Math.max(!isNaN(parsedLimit) ? parsedLimit : 10, 1), 50);


        if (!q || q.trim() === "") return res.status(400).json({ error: 'Missing search query (q)' }) // making sure q is not a falsy value or an empty string with spaces


        const skip = (page - 1) * limit
        const filter = { $text: { $search: q } };

        const cacheKey = `videos:search:q=${q}&page=${page}&limit=${limit}`;
        const cachedData = await redisClient.get(cacheKey);

        if (cachedData) {
            console.log("Hello Redis Cache Search Video")
            return res.status(200).json(JSON.parse(cachedData));
        }

        const videosPromise = Video.find(
            filter,
            { score: { $meta: 'textScore' } }
        )
            .sort({ score: { $meta: 'textScore' } })
            .skip(skip)
            .limit(limit)
            .select("-_id -__v")
            .lean()

        const totalCountPromise = Video.countDocuments(filter)

        const [videos, totalCount] = await Promise.all([videosPromise, totalCountPromise])

        const response = {
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            results: videos,
            resultLength: videos.length
        }

        await redisClient.setEx(cacheKey, 600, JSON.stringify(response)); // setting redis cache

        res.status(200).json(response)
    } catch (error) {
        console.error("Error while searching user: ", error);
        res.status(500).json({ status: 500, message: "Internal Server Error", error: error})
        
    }

}