# 🔧 Cloudinary Configuration Debug

## Current Setup

### Frontend `.env`:
- Cloud Name: `djp423xyr`
- API Key: `858647214159638`
- Upload Preset: `Unsigned`
- API URL: `http://localhost:4000`

### Server `/server/.env`:
- Parsed from CLOUDINARY_URL
- Cloud Name: `djp423xyr`
- API Key: `858647214159638`
- API Secret: `NmVkY2EwNWJkMTZlNjU2ZTc0M2ZhZTczNWQ1YzdjMWY@` (base64-encoded OR plain text?)

## Issues

1. **Unsigned Upload Preset Not Found**
   - The preset "Unsigned" doesn't exist or can't be accessed
   - Check Cloudinary Dashboard → Settings → Upload
   - Verify the exact preset name (case-sensitive)

2. **Signed Upload Signature Invalid**
   - API Secret may be incorrectly decoded/parsed
   - Test signature: `timestamp=1770047561` generates: `a686bccc2e51d5de7ac086ff11a1e5c6dd910c8d`
   - This signature is being rejected by Cloudinary

## How to Fix

### Option 1: Verify Preset Name
```bash
# Go to: https://cloudinary.com/console/settings/upload
# Check the exact name of your unsigned preset (not "Unsigned" if it's different)
# Update VITE_CLOUDINARY_UPLOAD_PRESET in .env
```

### Option 2: Fix API Secret
```bash
# Go to: https://cloudinary.com/console/settings/account/api-keys
# Copy your API SECRET (full 40-character hex string)
# Paste below and run:

API_SECRET="YOUR_40_CHAR_SECRET_HERE"
echo "CLOUDINARY_URL=cloudinary://858647214159638:$API_SECRET@djp423xyr" > server/.env
echo "PORT=3001" >> server/.env

# Restart server:
pkill -f "node.*index.js"
cd server && nohup node index.js > server.log 2>&1 &
sleep 2

# Test:
cd .. && node test-document-upload.mjs
```

### Option 3: Try with Different Preset
```bash
# Use the "papa" preset (which you confirmed exists as "Signed")
sed -i 's/Unsigned/papa/g' .env

# Test:
node test-document-upload.mjs
```

## Current Presets in Your Account

According to your earlier output:
- **Unsigned** (from your first message)
- **papa** (Signed preset with folder: kya)

