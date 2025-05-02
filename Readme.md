# YouTube Video Fetcher API

This project fetches the latest YouTube videos for a predefined search query, stores them in MongoDB, and provides REST APIs to view and search videos.

## 🚀 Features

- Polls YouTube API every 10(user can customize this) seconds to fetch the latest videos.
- Stores video details (title, description, thumbnails, publishedAt) in MongoDB.
- REST API to retrieve videos in paginated form (sorted by published date).
- Full-text search API on title and description.
- Redis caching for faster API responses.
- Dockerized for easy deployment.
- Supports multiple API keys with automatic rotation on quota exhaustion.

---

## 📦 Requirements

- Node.js (v18+ recommended)
- MongoDB (local or cloud)
- Redis
- Docker (optional, for containerized deployment)
- YouTube Data API v3 Key(s)

---

## 🛠️ Setup Instructions

### 1. Clone the Repository

```bash
git clone https://github.com/siddhantpardhi/Serri-Youtube-API.git
```
### 2. Install Dependencies

```bash
cd Serri-Youtube-API
npm install
```
### 3. Configure Environment Variables

Create a .env file in the root directory with the following contents:

```env
PORT=3000
YOUTUBE_API_KEYS=your_key_1,your_key_2,your_key_3   # comma-separated if using multiple keys
MONGODB_URI=mongodb://localhost:27017/database_name
```

## ▶️ Running the Project Locally

```bash
npm run start
```

## 🧪 Testing the API
### 1. Get All Videos
``` bash
GET /api/v1/videos?page=1&limit=10
curl "http://localhost:3000/api/videos?page=1&limit=10"
```

### 2. Search Videos
```bash
GET /api/v1/videos/search?q=keyword&page=1&limit=10
curl "http://localhost:3000/api/videos/search?q=keyword&page=1&limit=10"
```
## 🐳 Docker Usage
### 1. Build Docker Image
```bash
docker build -t youtube-video-api .
```

### 2. Run the Container
```bash
docker run -p 3000:3000 --env-file .env youtube-video-api
```

## 📈 Optimization Notes
- Uses bulkWrite to reduce DB write overhead.

- Redis caching is used for both listing and search APIs.

- Full-text indexes are used on title and description.

- Polling is fault-tolerant with retry logic and key rotation.

## 📂 Folder Structure

```
.
├── src/
│   ├── controllers/
│   ├── models/
│   ├── routes/
│   ├── utils/
│   ├── poller.js
│   └── index.js
├── Dockerfile
├── .dockerignore
├── .env
├── package.json
├── package-lock.json
└── README.md
```
## 📬 Author
Developed by [Siddhant Pardhi](https://www.linkedin.com/in/siddhant-pardhi-2773aa225/)
 — feel free to contribute or suggest improvements!



