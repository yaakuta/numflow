#!/bin/bash

# LLM Chat API 테스트 스크립트

echo "========================================"
echo "LLM Chat API Test Script"
echo "========================================"
echo ""

# Colors
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
NC='\033[0m' # No Color

API_URL="http://localhost:3000"

# 1. Health Check
echo -e "${YELLOW}1. Health Check${NC}"
curl -s "$API_URL/" | json_pp
echo ""
echo ""

# 2. Basic Chat
echo -e "${YELLOW}2. Basic Chat (Default Provider)${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello, how are you?"}' | json_pp
echo ""
echo ""

# 3. Chat with OpenAI
echo -e "${YELLOW}3. Chat with OpenAI${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is the capital of France?","provider":"openai"}' | json_pp
echo ""
echo ""

# 4. Chat with OpenRouter
echo -e "${YELLOW}4. Chat with OpenRouter${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"What is 2 + 2?","provider":"openrouter"}' | json_pp
echo ""
echo ""

# 5. Chat with Gemini
echo -e "${YELLOW}5. Chat with Gemini${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Tell me a short joke","provider":"gemini"}' | json_pp
echo ""
echo ""

# 6. Invalid Provider (Should fail gracefully)
echo -e "${YELLOW}6. Invalid Provider (Should return 400)${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"message":"Hello","provider":"invalid"}' | json_pp
echo ""
echo ""

# 7. Missing Message (Should return 400)
echo -e "${YELLOW}7. Missing Message (Should return 400)${NC}"
curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d '{"provider":"openai"}' | json_pp
echo ""
echo ""

# 8. Long Message (Should work)
echo -e "${YELLOW}8. Long Message${NC}"
LONG_MESSAGE="This is a longer message that tests the API's ability to handle more text. "
LONG_MESSAGE+="We're checking if the validation and processing work correctly with extended input. "
LONG_MESSAGE+="The system should handle this without any issues."

curl -s -X POST "$API_URL/api/chat" \
  -H "Content-Type: application/json" \
  -d "{\"message\":\"$LONG_MESSAGE\"}" | json_pp
echo ""
echo ""

echo -e "${GREEN}========================================"
echo "Tests Completed!"
echo "========================================${NC}"
