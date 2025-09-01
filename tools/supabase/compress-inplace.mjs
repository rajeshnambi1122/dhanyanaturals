import 'dotenv/config';
import { createClient } from '@supabase/supabase-js';
import sharp from 'sharp';
import prettyBytes from 'pretty-bytes';

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const BUCKET = process.env.SUPABASE_IMAGE_BUCKET || 'product-images';
const PREFIX = process.env.SUPABASE_PREFIX || '';
const QUALITY = parseInt(process.env.QUALITY) || 80;
const LIMIT = parseInt(process.env.LIMIT) || 50;

console.log(`[compress-inplace] bucket=${BUCKET} prefix='${PREFIX}' quality=${QUALITY}`);

async function listImages() {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .list(PREFIX, {
      limit: LIMIT,
      offset: 0
    });

  if (error) {
    console.error('Error listing files:', error);
    return [];
  }

  return data.filter(file => 
    /\.(jpg|jpeg|png|webp)$/i.test(file.name) && 
    !file.name.includes('-compressed')
  );
}

async function downloadImage(path) {
  const { data, error } = await supabase.storage
    .from(BUCKET)
    .download(path);

  if (error) {
    console.error(`Error downloading ${path}:`, error);
    return null;
  }

  return data;
}

async function compressImage(imageBuffer, originalName) {
  try {
    // Debug: check what we're receiving
    console.log(`  Debug: imageBuffer type: ${typeof imageBuffer}, length: ${imageBuffer?.length}, isBuffer: ${Buffer.isBuffer(imageBuffer)}`);
    
    const metadata = await sharp(imageBuffer).metadata();
    console.log(`  Original: ${metadata.width}x${metadata.height} ${prettyBytes(imageBuffer.length)}`);

    // Determine optimal size - keep original if under 1600px, otherwise resize
    const maxWidth = Math.min(metadata.width || 1600, 1600);
    
    // Compress based on original format
    let compressed;
    if (originalName.toLowerCase().includes('.png')) {
      // PNG: convert to WebP for better compression
      compressed = await sharp(imageBuffer)
        .resize(maxWidth, null, { withoutEnlargement: true })
        .webp({ quality: QUALITY })
        .toBuffer();
    } else {
      // JPG/JPEG: keep as JPEG but compress
      compressed = await sharp(imageBuffer)
        .resize(maxWidth, null, { withoutEnlargement: true })
        .jpeg({ quality: QUALITY, progressive: true })
        .toBuffer();
    }

    const savings = ((imageBuffer.length - compressed.length) / imageBuffer.length * 100).toFixed(1);
    console.log(`  Compressed: ${prettyBytes(compressed.length)} (${savings}% reduction)`);

    return compressed;
  } catch (error) {
    console.error(`Error compressing image:`, error);
    return null;
  }
}

async function uploadCompressed(path, compressedBuffer, originalName) {
  try {
    // Determine the content type based on the compressed format
    const contentType = originalName.toLowerCase().includes('.png') 
      ? 'image/webp'  // PNG was converted to WebP
      : 'image/jpeg'; // JPEG stays as JPEG

    // Upload with the same path (overwrites original)
    const { error } = await supabase.storage
      .from(BUCKET)
      .upload(path, compressedBuffer, {
        contentType,
        upsert: true, // This overwrites the existing file
        cacheControl: '3600'
      });

    if (error) {
      console.error(`Error uploading compressed ${path}:`, error);
      return false;
    }

    return true;
  } catch (error) {
    console.error(`Error in upload process:`, error);
    return false;
  }
}

async function main() {
  console.log('🔍 Listing images...');
  const images = await listImages();
  
  if (images.length === 0) {
    console.log('No images found to compress.');
    return;
  }

  console.log(`📦 Found ${images.length} images to compress`);

  let totalOriginalSize = 0;
  let totalCompressedSize = 0;
  let successCount = 0;

  for (const [index, image] of images.entries()) {
    const imagePath = PREFIX ? `${PREFIX}${image.name}` : image.name;
    console.log(`\n[${index + 1}/${images.length}] Processing: ${image.name}`);

    // Download original
    const originalBuffer = await downloadImage(imagePath);
    if (!originalBuffer) continue;

    const originalArrayBuffer = await originalBuffer.arrayBuffer();
    const originalBufferNode = Buffer.from(originalArrayBuffer);
    
    totalOriginalSize += originalBufferNode.length;

    // Compress
    const compressed = await compressImage(originalBufferNode, image.name);
    if (!compressed) continue;

    totalCompressedSize += compressed.length;

    // Upload compressed (overwrites original)
    const success = await uploadCompressed(imagePath, compressed, image.name);
    if (success) {
      successCount++;
      console.log(`  ✅ Successfully compressed and uploaded`);
    } else {
      console.log(`  ❌ Failed to upload compressed version`);
    }
  }

  // Summary
  console.log(`\n📊 Compression Summary:`);
  console.log(`   Images processed: ${successCount}/${images.length}`);
  console.log(`   Original total size: ${prettyBytes(totalOriginalSize)}`);
  console.log(`   Compressed total size: ${prettyBytes(totalCompressedSize)}`);
  const totalSavings = totalOriginalSize > 0 
    ? ((totalOriginalSize - totalCompressedSize) / totalOriginalSize * 100).toFixed(1)
    : 0;
  console.log(`   Total savings: ${totalSavings}%`);
}

main().catch(console.error);
