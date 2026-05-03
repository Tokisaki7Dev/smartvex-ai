#!/bin/bash
# SmartVex Project Structure Automator

# Root dirs
mkdir -p frontend/app frontend/components/ui frontend/hooks frontend/services frontend/store
mkdir -p backend/api/v1 backend/core backend/models backend/workers backend/utils/ffmpeg/presets
mkdir -p docker

# Placeholder files to maintain structure
touch frontend/app/layout.tsx frontend/app/page.tsx
touch backend/main.py backend/core/config.py
touch docker/docker-compose.yml docker/Dockerfile.frontend docker/Dockerfile.backend

echo "SmartVex Architecture: INITIALIZED"
