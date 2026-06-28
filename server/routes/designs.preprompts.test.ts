import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import request from 'supertest';
import express from 'express';
import { designsRouter } from './designs';
import { prisma } from '../db/prisma';

const app = express();
app.use(express.json());
app.use('/api/designs', designsRouter);

describe('GET /api/designs/pre-prompts', () => {
  beforeAll(async () => {
    // Clean up test data
    await prisma.prePrompt.deleteMany({
      where: {
        title: {
          startsWith: 'Test',
        },
      },
    });

    // Create test pre-prompts
    await prisma.prePrompt.createMany({
      data: [
        {
          title: 'Test Space Prompt',
          prompt: 'A test space scene',
          category: 'Space',
          previewUrl: 'https://example.com/space.jpg',
          isActive: true,
          sortOrder: 1,
        },
        {
          title: 'Test Nature Prompt',
          prompt: 'A test nature scene',
          category: 'Nature',
          previewUrl: 'https://example.com/nature.jpg',
          isActive: true,
          sortOrder: 2,
        },
        {
          title: 'Test Inactive Prompt',
          prompt: 'An inactive prompt',
          category: 'Space',
          previewUrl: 'https://example.com/inactive.jpg',
          isActive: false,
          sortOrder: 3,
        },
      ],
    });
  });

  afterAll(async () => {
    // Clean up test data
    await prisma.prePrompt.deleteMany({
      where: {
        title: {
          startsWith: 'Test',
        },
      },
    });
  });

  it('should return all active pre-prompts without category filter', async () => {
    const response = await request(app)
      .get('/api/designs/pre-prompts')
      .expect(200);

    expect(response.body).toHaveProperty('prePrompts');
    expect(response.body).toHaveProperty('categories');
    expect(Array.isArray(response.body.prePrompts)).toBe(true);
    expect(Array.isArray(response.body.categories)).toBe(true);

    // Should only include active prompts
    const testPrompts = response.body.prePrompts.filter((p: any) =>
      p.title.startsWith('Test')
    );
    expect(testPrompts.length).toBe(2);
    expect(testPrompts.every((p: any) => p.isActive)).toBe(true);
  });

  it('should filter pre-prompts by category', async () => {
    const response = await request(app)
      .get('/api/designs/pre-prompts?category=Space')
      .expect(200);

    expect(response.body).toHaveProperty('prePrompts');
    const testPrompts = response.body.prePrompts.filter((p: any) =>
      p.title.startsWith('Test')
    );

    // Should only include Space category (and only active ones)
    expect(testPrompts.length).toBe(1);
    expect(testPrompts[0].category).toBe('Space');
    expect(testPrompts[0].title).toBe('Test Space Prompt');
  });

  it('should return empty array for non-existent category', async () => {
    const response = await request(app)
      .get('/api/designs/pre-prompts?category=NonExistent')
      .expect(200);

    expect(response.body).toHaveProperty('prePrompts');
    const testPrompts = response.body.prePrompts.filter((p: any) =>
      p.title.startsWith('Test')
    );
    expect(testPrompts.length).toBe(0);
  });

  it('should return pre-prompts sorted by sortOrder', async () => {
    const response = await request(app)
      .get('/api/designs/pre-prompts')
      .expect(200);

    const testPrompts = response.body.prePrompts.filter((p: any) =>
      p.title.startsWith('Test')
    );

    // Check if sorted by sortOrder
    for (let i = 1; i < testPrompts.length; i++) {
      expect(testPrompts[i].sortOrder).toBeGreaterThanOrEqual(
        testPrompts[i - 1].sortOrder
      );
    }
  });

  it('should include all required fields in pre-prompt objects', async () => {
    const response = await request(app)
      .get('/api/designs/pre-prompts')
      .expect(200);

    const testPrompts = response.body.prePrompts.filter((p: any) =>
      p.title.startsWith('Test')
    );

    expect(testPrompts.length).toBeGreaterThan(0);

    testPrompts.forEach((prePrompt: any) => {
      expect(prePrompt).toHaveProperty('id');
      expect(prePrompt).toHaveProperty('title');
      expect(prePrompt).toHaveProperty('prompt');
      expect(prePrompt).toHaveProperty('category');
      expect(prePrompt).toHaveProperty('previewUrl');
      expect(prePrompt).toHaveProperty('isActive');
      expect(prePrompt).toHaveProperty('sortOrder');
      expect(prePrompt).toHaveProperty('createdAt');
    });
  });

  it('should return unique categories list', async () => {
    const response = await request(app)
      .get('/api/designs/pre-prompts')
      .expect(200);

    expect(response.body).toHaveProperty('categories');
    const categories = response.body.categories;

    // Check uniqueness
    const uniqueCategories = [...new Set(categories)];
    expect(categories.length).toBe(uniqueCategories.length);

    // Should include our test categories
    expect(categories).toContain('Space');
    expect(categories).toContain('Nature');
  });
});
