# SmartVex Deployment Guide

This guide explains how to deploy the SmartVex application to **Vercel** and configure **Supabase**.

## 1. Supabase Setup

1.  **Create a Project**: Go to [Supabase](https://supabase.com/) and create a new project.
2.  **Database Setup**: 
    - Open the **SQL Editor** in your Supabase dashboard.
    - Copy the contents of `SUPABASE_SCHEMA.sql` and run it. This creates the `video_jobs` table and sets up security rules (RLS).
3.  **Authentication**:
    - Go to **Authentication > Providers**.
    - Enable **Google** (or any other provider you wish).
    - Note: You will need to set up Google Cloud Console credentials for Google Login.
4.  **API Keys**:
    - Go to **Project Settings > API**.
    - Copy the `Project URL` and `anon` public key.

## 2. Environment Variables

Create exactly these variables in your Vercel project settings:

```env
VITE_SUPABASE_URL=your_supabase_url
VITE_SUPABASE_PUBLISHABLE_KEY=your_supabase_anon_key
VITE_SUPABASE_ANON_KEY=your_supabase_anon_key
```

## 3. Vercel Deployment

1.  **Push to GitHub**: Push this code to a GitHub repository.
2.  **Import to Vercel**: Connect your GitHub account to [Vercel](https://vercel.com/) and import the repository.
3.  **Configure Framework**: Vercel should automatically detect **Vite**.
4.  **Deploy**: Hit deploy!

## Features

- **Guest Mode**: Allows users to test the UI using LocalStorage without an account.
- **AI Processing Simulation**: Simulates the viral clipping process for the demo.
- **Supabase Integration**: Stores user data securely and provides real-time updates.
- **Ultra Dark Design**: Absolute black and purple neon aesthetic.

---
*Created by SmartVex Core*
