import { Video } from "../models/video.model.js"

export const getAllVideos = async (req, res) => {

    try {
        const page = Math.max(parseInt(req.query.page) || 0, 1)
        let parsedLimit = parseInt(req.query.limit);
        const limit = Math.min(Math.max(!isNaN(parsedLimit) ? parsedLimit : 10, 1), 50);

        const skip = (page - 1) * limit

        const videosPromise = Video.find({})
            .sort({ publishedAt: -1 })
            .skip(skip)
            .limit(limit)
            .select("-_id -__v")
            .lean()

        const totalCountPromise = Video.countDocuments()

        const [videos, totalCount] = await Promise.all([videosPromise, totalCountPromise])

        res.status(200).json({
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            videos,
            videosLength: videos.length
        })
    } catch (error) {
        console.error("Error while listing all videos: ", error)

    }
}

export const searchVideo = async (req, res) => {
    const { q } = req.query;

    const page = Math.max(parseInt(req.query.page) || 0, 1)
    let parsedLimit = parseInt(req.query.limit);
    const limit = Math.min(Math.max(!isNaN(parsedLimit) ? parsedLimit : 10, 1), 50);


    if (!q) return res.status(400).json({ error: 'Missing search query (q)' })

    try {
        const skip = (page - 1) * limit
        const filter = { $text: { $search: q } };

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

        res.status(200).json({
            page,
            totalPages: Math.ceil(totalCount / limit),
            totalCount,
            results: videos,
            resultLength: videos.length
        })
    } catch (err) {
        res.status(500).json({ error: 'Search failed', details: err.message })
    }
}