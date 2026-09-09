#!/bin/bash

# API Test Script for Sapho Growth Inbox
# Tests /api/generate and /api/event endpoints

API_BASE="http://localhost:3000"

echo "=== Testing POST /api/generate ==="
echo ""

echo "Test 1: Generate comment for first post"
curl -X POST "${API_BASE}/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001",
    "config": {
      "goal": "comment",
      "brandVoice": "professional-friendly",
      "instructions": "Keep it encouraging and mention our rapid testing platform"
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

echo "Test 2: Generate DM for post about compliance"
curl -X POST "${API_BASE}/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-002",
    "config": {
      "goal": "dm",
      "brandVoice": "authoritative",
      "instructions": "Reference our USP 1223 validation"
    }
  }' | jq '.'

echo ""
echo "---"
echo ""

echo "Test 3: Missing config (should error)"
curl -X POST "${API_BASE}/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001"
  }' | jq '.'

echo ""
echo "---"
echo ""

echo "Test 4: Invalid post ID (should 404)"
curl -X POST "${API_BASE}/api/generate" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "invalid-post",
    "config": {
      "goal": "comment",
      "brandVoice": "professional-friendly",
      "instructions": ""
    }
  }' | jq '.'

echo ""
echo "=== Testing POST /api/event ==="
echo ""

echo "Test 5: Log a 'copied' event"
curl -X POST "${API_BASE}/api/event" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001",
    "action": "copied"
  }' | jq '.'

echo ""
echo "---"
echo ""

echo "Test 6: Log a 'posted' event with full metadata"
curl -X POST "${API_BASE}/api/event" \
  -H "Content-Type: application/json" \
  -d '{
    "postId": "post-001",
    "action": "posted",
    "config": {
      "goal": "comment",
      "brandVoice": "professional-friendly",
      "instructions": ""
    },
    "model": "gemini-3.6-flash",
    "provider": "gemini",
    "latencyMs": 1250,
    "outputText": "Great insights! Environmental monitoring truly is the foundation..."
  }' | jq '.'

echo ""
echo "=== Tests Complete ==="
