/**
 * Document Upload Test Script
 * Tests the full document upload flow to Cloudinary
 */

import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// Load environment variables
const loadEnv = () => {
  const envPath = path.join(__dirname, '.env')
  if (fs.existsSync(envPath)) {
    const envContent = fs.readFileSync(envPath, 'utf-8')
    envContent.split('\n').forEach((line) => {
      const trimmed = line.trim()
      if (trimmed && !trimmed.startsWith('#')) {
        const [key, ...values] = trimmed.split('=')
        if (key && values.length) {
          process.env[key.trim()] = values.join('=').trim()
        }
      }
    })
  }
}

loadEnv()

const CLOUDINARY_CLOUD_NAME = process.env.VITE_CLOUDINARY_CLOUD_NAME || 'djp423xyr'
const CLOUDINARY_API_KEY = process.env.VITE_CLOUDINARY_API_KEY || '858647214159638'
const CLOUDINARY_UPLOAD_PRESET = process.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'
const API_BASE = process.env.VITE_API_URL || 'http://localhost:4000'

console.log('='.repeat(60))
console.log('📄 DOCUMENT UPLOAD TEST')
console.log('='.repeat(60))
console.log(`Cloud Name: ${CLOUDINARY_CLOUD_NAME}`)
console.log(`Upload Preset: ${CLOUDINARY_UPLOAD_PRESET}`)
console.log(`API Base: ${API_BASE}`)
console.log('='.repeat(60))

// Create a test document (simple text file)
const testDocPath = path.join(__dirname, 'test-document.pdf')
fs.writeFileSync(testDocPath, 'Test document content for upload verification')
console.log('✅ Test document created')

async function testDocumentUpload() {
  try {
    console.log('\n📤 Testing document upload...')

    // Read the test document
    const fileBuffer = fs.readFileSync(testDocPath)
    const blob = new Blob([fileBuffer], { type: 'application/pdf' })

    // Create FormData for Cloudinary upload
    const formData = new FormData()
    formData.append('file', blob, 'test-document.pdf')
    formData.append('upload_preset', CLOUDINARY_UPLOAD_PRESET)
    formData.append('cloud_name', CLOUDINARY_CLOUD_NAME)

    const uploadUrl = `https://api.cloudinary.com/v1_1/${CLOUDINARY_CLOUD_NAME}/raw/upload`

    console.log(`⬆️  Uploading to: ${uploadUrl}`)
    let response = await fetch(uploadUrl, {
      method: 'POST',
      body: formData,
    })

    if (!response.ok) {
      // Try to parse error body safely
      let error = null
      try {
        error = await response.json()
      } catch (e) {
        error = { error: { message: response.statusText } }
      }
      console.log(`❌ Upload failed: ${error.error?.message || response.statusText}`)

      // If preset not found, attempt signed upload via local sign server
      if ((error.error?.message || '').toLowerCase().includes('upload preset not found')) {
        console.log(
          '\n🔐 Detected missing unsigned preset — attempting signed upload via sign server...'
        )
        const SIGN_SERVER = process.env.SIGN_SERVER || 'http://localhost:3001'
        try {
          const signRes = await fetch(`${SIGN_SERVER}/sign`, { method: 'POST' })
          if (!signRes.ok) {
            console.log(`❌ Sign server responded with ${signRes.statusText}`)
            return false
          }
          const sign = await signRes.json()

          // Build new form data for signed upload
          const signedForm = new FormData()
          signedForm.append('file', blob, 'test-document.pdf')
          signedForm.append('api_key', sign.api_key)
          signedForm.append('timestamp', String(sign.timestamp))
          signedForm.append('signature', sign.signature)
          // Optionally set folder (the Signed preset used folder 'kya')
          signedForm.append('folder', 'kya')

          console.log(`⬆️  Uploading signed to: ${uploadUrl}`)
          response = await fetch(uploadUrl, { method: 'POST', body: signedForm })
          if (!response.ok) {
            let err2 = null
            try {
              err2 = await response.json()
            } catch (e) {
              err2 = { error: { message: response.statusText } }
            }
            console.log(`❌ Signed upload failed: ${err2.error?.message || response.statusText}`)
            return false
          }
          const result = await response.json()

          console.log(`✅ Signed upload successful!`)
          console.log(`   Public ID: ${result.public_id}`)
          console.log(`   Secure URL: ${result.secure_url}`)
          console.log(`   Format: ${result.format}`)
          console.log(`   Bytes: ${result.bytes}`)

          // continue with saving record below
          var uploadResult = result
        } catch (signErr) {
          console.log(`❌ Unable to contact sign server: ${signErr.message}`)
          return false
        }
      } else {
        return false
      }
    } else {
      const result = await response.json()
      console.log(`✅ Upload successful!`)
      console.log(`   Public ID: ${result.public_id}`)
      console.log(`   Secure URL: ${result.secure_url}`)
      console.log(`   Format: ${result.format}`)
      console.log(`   Bytes: ${result.bytes}`)

      var uploadResult = result
    }

    // Test saving to json-server
    console.log('\n💾 Testing save to json-server...')
    const docRecord = {
      id: Math.random().toString(36).substring(2, 10),
      name: 'test-document.pdf',
      url: uploadResult.secure_url,
      type: 'test',
      uploadedAt: new Date().toISOString(),
    }

    const docResponse = await fetch(`${API_BASE}/documents`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(docRecord),
    })

    if (!docResponse.ok) {
      console.log(`❌ Failed to save document record: ${docResponse.statusText}`)
    } else {
      const savedDoc = await docResponse.json()
      console.log(`✅ Document record saved!`)
      console.log(`   ID: ${savedDoc.id}`)
      console.log(`   Name: ${savedDoc.name}`)
    }

    // Clean up
    fs.unlinkSync(testDocPath)
    console.log('✅ Test file cleaned up')

    return true
  } catch (error) {
    console.log(`❌ Error: ${error.message}`)
    return false
  }
}

async function runTests() {
  console.log('\n🚀 Running document upload tests...\n')

  const result = await testDocumentUpload()

  console.log('\n' + '='.repeat(60))
  console.log('📊 RESULT')
  console.log('='.repeat(60))
  console.log(`Document Upload: ${result ? '✅ PASS' : '❌ FAIL'}`)
  console.log('='.repeat(60))

  if (!result) {
    console.log('\n💡 Tips:')
    console.log('1. Make sure Cloudinary upload preset is configured')
    console.log('2. Go to Cloudinary Dashboard → Settings → Upload')
    console.log('3. Add upload preset with name: ' + CLOUDINARY_UPLOAD_PRESET)
    console.log('4. Set Signing Mode to: Unsigned')
  }

  process.exit(result ? 0 : 1)
}

runTests()
