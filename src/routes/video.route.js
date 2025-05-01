import { Router } from "express"
import { getAllVideos, searchVideo } from "../controllers/videos.controllers.js"

const router = Router()

router.route("/").get(getAllVideos)
router.route("/search").get(searchVideo)

export default router