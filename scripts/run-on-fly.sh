#!/bin/bash
# Run user password update on Fly.io production
# This script is meant to be executed via: fly ssh console -a chatbot-auspost-ai-support

cd /app 2>/dev/null || true
export NODE_ENV=production
npx tsx scripts/update-user-password.js sub.subham9574@gmail.com 12345678

