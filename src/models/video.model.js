import mongoose from "mongoose"

const videoSchema = new mongoose.Schema(
    {
        videoId: {
            type: String,
            required: true,
            trim: true,
            unique: true,
        },
        title: {
            type: String,
            required: true,
            trim: true,
            index: true
        },
        description: {
            type: String,
            trim: true
        },
        url: {
            type: String,
            required: true,
            trim: true
        },
        publishedAt: {
            type: Date,
            required: true,
            trim: true,
            index: true
        },
        thumbnails: {
            high: {
                url: String,
                width: Number,
                height: Number,
            }
        }


    })

videoSchema.index({ title: 'text', description: 'text' });

export const Video = mongoose.model("Video", videoSchema)