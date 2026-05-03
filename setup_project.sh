#!/bin/bash

# SmartVex Monorepo Structure Initializer
echo "🚀 Initializing SmartVex Project Structure..."

# Create Main Directories
mkdir -p frontend/app frontend/components/ui frontend/hooks frontend/services frontend/store
mkdir -p backend/api/v1 backend/core/config backend/models backend/workers backend/utils/ffmpeg
mkdir -p docker

# Frontend Initialization (Conceptual)
touch frontend/app/layout.tsx frontend/app/page.tsx
touch frontend/components/Dashboard.tsx

# Backend Initialization
touch backend/main.py backend/api/v1/router.py backend/core/config/settings.py
touch backend/models/video_job.py backend/workers/tasks.py backend/utils/ffmpeg/enhancer.py

# Docker Files
touch docker/Dockerfile.frontend docker/Dockerfile.backend
touch docker-compose.yml

echo "✅ Structure created successfully!"
chmod +x $0
