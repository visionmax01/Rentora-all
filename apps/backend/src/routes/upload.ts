import { Hono } from 'hono';
import { z } from 'zod';
import { authMiddleware } from '../middleware/auth.js';
import { uploadFile } from '../lib/minio.js';
import { v4 as uuidv4 } from 'uuid';

const app = new Hono();

// Upload single file
app.post('/', authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const file = body.file as File;

  if (!file) {
    return c.json({
      success: false,
      error: { code: 'NO_FILE', message: 'No file provided' },
    }, 400);
  }

  // Validate file type
  const allowedTypes = ['image/jpeg', 'image/png', 'image/webp', 'application/pdf'];
  if (!allowedTypes.includes(file.type)) {
    return c.json({
      success: false,
      error: { code: 'INVALID_TYPE', message: 'Invalid file type' },
    }, 400);
  }

  // Validate file size (5MB)
  if (file.size > 5 * 1024 * 1024) {
    return c.json({
      success: false,
      error: { code: 'FILE_TOO_LARGE', message: 'File size must be less than 5MB' },
    }, 400);
  }

  try {
    const buffer = Buffer.from(await file.arrayBuffer());
    const fileName = `${uuidv4()}-${file.name}`;
    const url = await uploadFile(buffer, fileName, file.type);

    return c.json({
      success: true,
      data: { url, fileName },
    });
  } catch (err) {
    console.error('Upload error:', err);
    return c.json({
      success: false,
      error: { code: 'UPLOAD_FAILED', message: 'Failed to upload file' },
    }, 500);
  }
});

// Upload multiple files
app.post('/multiple', authMiddleware, async (c) => {
  const body = await c.req.parseBody();
  const files: File[] = [];

  // Collect all files
  for (const key in body) {
    if (key.startsWith('file')) {
      const file = body[key] as File;
      if (file) files.push(file);
    }
  }

  if (files.length === 0) {
    return c.json({
      success: false,
      error: { code: 'NO_FILES', message: 'No files provided' },
    }, 400);
  }

  if (files.length > 10) {
    return c.json({
      success: false,
      error: { code: 'TOO_MANY_FILES', message: 'Maximum 10 files allowed' },
    }, 400);
  }

  const results = [];
  const errors = [];

  for (const file of files) {
    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/png', 'image/webp'];
    if (!allowedTypes.includes(file.type)) {
      errors.push({ file: file.name, error: 'Invalid file type' });
      continue;
    }

    // Validate file size (5MB)
    if (file.size > 5 * 1024 * 1024) {
      errors.push({ file: file.name, error: 'File too large' });
      continue;
    }

    try {
      const buffer = Buffer.from(await file.arrayBuffer());
      const fileName = `${uuidv4()}-${file.name}`;
      const url = await uploadFile(buffer, fileName, file.type);
      results.push({ url, fileName, originalName: file.name });
    } catch (err) {
      errors.push({ file: file.name, error: 'Upload failed' });
    }
  }

  return c.json({
    success: errors.length === 0,
    data: { uploaded: results, errors },
  });
});

// Get presigned URL for direct upload
app.post('/presigned', authMiddleware, async (c) => {
  const { fileName, contentType } = await c.req.json();

  // Generate unique filename
  const uniqueFileName = `${uuidv4()}-${fileName}`;

  return c.json({
    success: true,
    data: {
      fileName: uniqueFileName,
      // Note: In production, implement proper presigned URL generation
      uploadUrl: `/api/v1/upload/direct/${uniqueFileName}`,
    },
  });
});

export default app;