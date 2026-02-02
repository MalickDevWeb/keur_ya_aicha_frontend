/**
 * Cloudinary Configuration Test Script
 * Tests the Cloudinary configuration and upload functionality
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

// Get the directory of the current module
const __dirname = path.dirname(fileURLToPath(import.meta.url));

// Load environment variables
const loadEnv = () => {
  const envPath = path.join(__dirname, '.env');
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8');
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim();
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=');
        if (key && values.length) {
          process.env[key.trim()] = values.join('=').trim();
        }
      }
    });
  }
};

loadEnv();

// Configuration
const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'djp423xyr';
const CLOUDINARY_API_KEY = process.env.VITE_CLOUDINARY_API_KEY || '858647214159638';
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default';

console.log('='.repeat(60));
console.log('🧪 CLOUDINARY CONFIGURATION TEST');
console.log('='.repeat(60));

// Test 1: Check environment variables
console.log('\n📋 Test 1: Environment Variables');
console.log('-'.repeat(40));

const envVars = {
  'VITE_CLOUDINARY_CLOUD_NAME': CLOUDINARY_CLOUD_NAME,
  'VITE_CLOUDINARY_API_KEY': CLOUDINARY_API_KEY,
  'VITE_CLOUDINARY_UPLOAD_PRESET': CLOUDINARY_UPLOAD_PRESET,
};

let envTestPassed = true;
for (const [key, value] of Object.entries(envVars)) {
  const isSet = value && value !== '';
  console.log(`${isSet ? '✅' : '❌'} ${key}: ${isSet ? value : 'NOT SET'}`);
  if (!isSet) envTestPassed = false;
}

// Test 2: Check Cloudinary URL format
console.log('\n📋 Test 2: Cloudinary URL Format');
console.log('-'.repeat(40));

const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/image/upload`;
console.log(`✅ Upload URL: ${uploadUrl}`);

// Test 3: Create a test image (1x1 pixel PNG)
console.log('\n📋 Test 3: Create Test Image');
console.log('-'.repeat(40));

const testImagePath = path.join(__dirname, 'test-upload.png');
// Create a minimal PNG file (1x1 pixel, red)
const minimalPng = Buffer.from([
  0x89, 0x50, 0x4E, 0x47, 0x0D, 0x0A, 0x1A, 0x0A, // PNG signature
  0x00, 0x00, 0x00, 0x0D, 0x49, 0x48, 0x44, 0x52, // IHDR chunk
  0x00, 0x00, 0x00, 0x01, 0x00, 0x00, 0x00, 0x01, // 1x1 dimensions
  0x08, 0x02, 0x00, 0x00, 0x00, 0x90, 0x77, 0x53, 0xDE, // bit depth, color type, etc.
  0x00, 0x00, 0x00, 0x0C, 0x49, 0x44, 0x41, 0x54, // IDAT chunk
  0x08, 0xD7, 0x63, 0xF8, 0x0F, 0x00, 0x00, 0x01, 0x01, 0x00, 0x05, 0xFE, 0xD4, // compressed data
  0x5D, 0xB6, 0x00, 0x00, 0x00, 0x00, 0x49, 0x45, 0x4E, 0x44, 0xAE, 0x42, 0x60, 0x82, // IEND chunk
]);

fs.writeFileSync(testImagePath, minimalPng);
console.log(`✅ Test image created: ${testImagePath}`);

// Test 4: Test upload to Cloudinary
console.log('\n📋 Test 4: Upload to Cloudinary');
console.log('-'.repeat(40));

async function testUpload() {
  try {
    const formData = new FormData();
    const fileBuffer = fs.readFileSync(testImagePath);
    const blob = new Blob([fileBuffer], { type: 'image/png' });
    formData.append('file', blob, 'test-upload.png');
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET);
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME);

    console.log('⏳ Uploading test image...');

    const response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    });

    if (!response.ok) {
      const errorData = await response.json();
      console.log(`❌ Upload failed: ${errorData.error?.message || response.statusText}`);
      return false;
    }

    const result = await response.json();
    console.log(`✅ Upload successful!`);
    console.log(`   Public ID: ${result.public_id}`);
    console.log(`   Secure URL: ${result.secure_url}`);
    console.log(`   Format: ${result.format}`);
    console.log(`   Dimensions: ${result.width}x${result.height}`);
    console.log(`   Bytes: ${result.bytes}`);

    // Clean up test file
    fs.unlinkSync(testImagePath);
    console.log(`✅ Test image cleaned up`);

    return true;
  } catch (error) {
    console.log(`❌ Upload error: ${error.message}`);
    return false;
  }
}

// Run tests
async function runTests() {
  console.log('\n' + '='.repeat(60));
  console.log('🚀 Running Cloudinary Tests...');
  console.log('='.repeat(60));

  const uploadResult = await testUpload();

  console.log('\n' + '='.repeat(60));
  console.log('📊 TEST SUMMARY');
  console.log('='.repeat(60));

  console.log(`\nEnvironment Variables: ${envTestPassed ? '✅ PASS' : '❌ FAIL'}`);
  console.log(`Upload Test: ${uploadResult ? '✅ PASS' : '❌ FAIL'}`);

  const allPassed = envTestPassed && uploadResult;
  console.log(`\n${allPassed ? '🎉 ALL TESTS PASSED!' : '⚠️  SOME TESTS FAILED'}`);
  console.log('='.repeat(60));

  process.exit(allPassed ? 0 : 1);
}

runTests();
