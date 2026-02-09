import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';

const app = new Hono();

const contactSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  phone: z.string().optional(),
  subject: z.string().min(5),
  message: z.string().min(20),
});

// Submit contact form
app.post('/', async (c) => {
  const body = await c.req.json();
  const data = contactSchema.parse(body);

  const submission = await prisma.contactSubmission.create({
    data,
  });

  // TODO: Send email notification to admin

  return c.json({
    success: true,
    data: { message: 'Thank you for your message. We will get back to you soon.' },
  }, 201);
});

export default app;