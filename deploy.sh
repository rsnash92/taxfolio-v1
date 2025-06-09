#!/bin/bash
echo "Pulling latest changes..."
git pull origin main
echo "Installing dependencies..."
npm install
echo "Building app..."
npm run build
echo "Deployment complete!"
