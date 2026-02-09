import { Queue, Worker } from 'bullmq';
import { redis } from './redis.js';

// Email queue
export const emailQueue = new Queue('email', { connection: redis });

// Notification queue
export const notificationQueue = new Queue('notification', { connection: redis });

// Search indexing queue
export const searchIndexQueue = new Queue('search-index', { connection: redis });

// Image processing queue
export const imageQueue = new Queue('image-processing', { connection: redis });

// Define workers
export function initializeWorkers() {
  // Email worker
  new Worker('email', async (job) => {
    console.log('Processing email job:', job.id, job.data);
    // Implement email sending logic here
  }, { connection: redis });

  // Notification worker
  new Worker('notification', async (job) => {
    console.log('Processing notification job:', job.id, job.data);
    // Implement notification logic here
  }, { connection: redis });

  // Search index worker
  new Worker('search-index', async (job) => {
    console.log('Processing search index job:', job.id, job.data);
    // Implement search indexing logic here
  }, { connection: redis });

  // Image processing worker
  new Worker('image-processing', async (job) => {
    console.log('Processing image job:', job.id, job.data);
    // Implement image resizing/optimization logic here
  }, { connection: redis });

  console.log('✅ Queue workers initialized');
}

// Helper functions to add jobs
export async function sendEmailJob(data: {
  to: string;
  subject: string;
  template: string;
  variables: Record<string, unknown>;
}) {
  await emailQueue.add('send-email', data, {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
  });
}

export async function sendNotificationJob(data: {
  userId: string;
  type: string;
  title: string;
  message: string;
}) {
  await notificationQueue.add('send-notification', data, {
    attempts: 3,
  });
}

export async function indexSearchJob(data: {
  entity: 'property' | 'marketplace' | 'service';
  action: 'create' | 'update' | 'delete';
  id: string;
  data?: Record<string, unknown>;
}) {
  await searchIndexQueue.add('index-search', data, {
    attempts: 3,
  });
}