import { Hono } from 'hono';
import { z } from 'zod';
import { prisma } from '@rentora/database';
import { authMiddleware } from '../middleware/auth.js';

const app = new Hono();

// Get my conversations
app.get('/conversations', authMiddleware, async (c) => {
  const user = c.get('user');

  const conversations = await prisma.conversation.findMany({
    where: {
      participants: {
        some: { userId: user.userId },
      },
    },
    orderBy: { updatedAt: 'desc' },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
      messages: {
        orderBy: { createdAt: 'desc' },
        take: 1,
      },
    },
  });

  return c.json({
    success: true,
    data: conversations,
  });
});

// Get or create conversation
app.post('/conversations', authMiddleware, async (c) => {
  const user = c.get('user');
  const { userId } = await c.req.json();

  if (userId === user.userId) {
    return c.json({
      success: false,
      error: { code: 'INVALID_REQUEST', message: 'Cannot create conversation with yourself' },
    }, 400);
  }

  // Check if conversation already exists
  const existing = await prisma.conversation.findFirst({
    where: {
      AND: [
        { participants: { some: { userId: user.userId } } },
        { participants: { some: { userId } } },
      ],
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  if (existing) {
    return c.json({
      success: true,
      data: existing,
    });
  }

  // Create new conversation
  const conversation = await prisma.conversation.create({
    data: {
      participants: {
        create: [
          { userId: user.userId },
          { userId },
        ],
      },
    },
    include: {
      participants: {
        include: {
          user: {
            select: { id: true, firstName: true, lastName: true, avatar: true },
          },
        },
      },
    },
  });

  return c.json({
    success: true,
    data: conversation,
  }, 201);
});

// Get messages in conversation
app.get('/conversations/:id/messages', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { page = '1', limit = '50' } = c.req.query();

  // Check if user is participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: id,
      userId: user.userId,
    },
  });

  if (!participant) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  const messages = await prisma.message.findMany({
    where: { conversationId: id },
    orderBy: { createdAt: 'desc' },
    skip: (parseInt(page) - 1) * parseInt(limit),
    take: parseInt(limit),
    include: {
      sender: {
        select: { id: true, firstName: true, lastName: true, avatar: true },
      },
    },
  });

  // Mark messages as read
  await prisma.message.updateMany({
    where: {
      conversationId: id,
      senderId: { not: user.userId },
      isRead: false,
    },
    data: { isRead: true, readAt: new Date() },
  });

  return c.json({
    success: true,
    data: messages.reverse(), // Return in chronological order
  });
});

// Send message
app.post('/conversations/:id/messages', authMiddleware, async (c) => {
  const user = c.get('user');
  const { id } = c.req.param();
  const { content, attachments } = await c.req.json();

  if (!content || content.trim().length === 0) {
    return c.json({
      success: false,
      error: { code: 'INVALID_CONTENT', message: 'Message content required' },
    }, 400);
  }

  // Check if user is participant
  const participant = await prisma.conversationParticipant.findFirst({
    where: {
      conversationId: id,
      userId: user.userId,
    },
  });

  if (!participant) {
    return c.json({
      success: false,
      error: { code: 'FORBIDDEN', message: 'Not authorized' },
    }, 403);
  }

  const [message, updatedConversation] = await prisma.$transaction([
    prisma.message.create({
      data: {
        conversationId: id,
        senderId: user.userId,
        content,
        attachments: attachments || [],
      },
      include: {
        sender: {
          select: { id: true, firstName: true, lastName: true, avatar: true },
        },
      },
    }),
    prisma.conversation.update({
      where: { id },
      data: { updatedAt: new Date() },
    }),
  ]);

  return c.json({
    success: true,
    data: message,
  }, 201);
});

export default app;