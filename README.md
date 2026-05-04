# SmartVex - AI Video Content Engine

SmartVex is a high-performance SaaS platform built for creators who want to dominate social media. Using advanced AI, SmartVex transforms long-form content into viral clips for TikTok, Reels, and Shorts.

## 🚀 Experience
- **Ultra-Fast Clipping**: AI automatically identifies the most engaging hooks in your videos.
- **Viral Captions**: Dynamic, animated captions that keep viewers glued to the screen.
- **Face Tracking**: Smart reframe that keeps the speaker centered in 9:16 format.
- **Audio Intelligence**: Level up your sound with AI cleaning and synthesis.

## 🛠 Tech Stack
- **Frontend & Backend**: Next.js 15 (App Router) + Express + Socket.io
- **Engine**: SmartVex Adaptive Core (FFmpeg-based)
- **Styling**: Tailwind CSS 4 + Motion
- **Deployment**: Optimized for Render Web Services (Node.js)

## Deploying to Render (Web Service)

1. **Service Type**: Web Service
2. **Build Command**: `npm install && npm run build`
3. **Start Command**: `npm start`
4. **Environment Variables**:
   - `PORT`: 3000 (standard)
   - `NODE_ENV`: production
- **Styling**: Tailwind CSS 4 + Motion (Framer Motion)
- **Database/Auth**: Supabase (PostgreSQL + Auth)
- **Realtime**: Supabase Live Channels

## 📦 Getting Started

### 1. Requirements
- Node.js 20+
- A Supabase Project

### 2. Installation
```bash
npm install
```

### 3. Setup
1. Copy `.env.example` to `.env` (Vite will load these).
2. Configure your Supabase credentials.
3. Run the SQL script in `SUPABASE_SCHEMA.sql` in your Supabase dashboard.

### 4. Running Locally
```bash
npm run dev
```

## 🚢 Deployment
See [README_DEPLOY.md](./README_DEPLOY.md) for step-by-step instructions on deploying to Vercel and Supabase.

---
© 2026 SmartVex Core. Built for the future of content.
