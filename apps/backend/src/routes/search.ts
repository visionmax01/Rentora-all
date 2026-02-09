import { Hono } from 'hono';
import { z } from 'zod';
import { searchProperties, typesenseClient } from '../lib/typesense.js';

const app = new Hono();

const searchSchema = z.object({
  q: z.string().default('*'),
  page: z.string().default('1'),
  per_page: z.string().default('20'),
  sort_by: z.string().optional(),
});

// Search properties
app.get('/properties', async (c) => {
  const query = c.req.query();
  const params = searchSchema.parse(query);

  const filterBy: string[] = [];
  
  if (query.type) filterBy.push(`type:=${query.type}`);
  if (query.city) filterBy.push(`city:=${query.city}`);
  if (query.min_price) filterBy.push(`price:>=${query.min_price}`);
  if (query.max_price) filterBy.push(`price:<=${query.max_price}`);
  if (query.bedrooms) filterBy.push(`bedrooms:=${query.bedrooms}`);
  if (query.furnished === 'true') filterBy.push('furnished:=true');
  if (query.amenities) {
    const amenities = query.amenities.split(',');
    amenities.forEach(a => filterBy.push(`amenities:=${a}`));
  }
  
  // Geo search
  if (query.lat && query.lng && query.radius) {
    filterBy.push(`location:(${query.lat}, ${query.lng}, ${query.radius} km)`);
  }

  const searchParams = {
    q: params.q,
    query_by: 'title,description,address,city,amenities',
    filter_by: filterBy.join(' && ') || undefined,
    sort_by: params.sort_by || 'createdAt:desc',
    page: parseInt(params.page),
    per_page: parseInt(params.per_page),
  };

  try {
    const results = await typesenseClient
      .collections('properties')
      .documents()
      .search(searchParams);

    return c.json({
      success: true,
      data: results.hits?.map(hit => hit.document) || [],
      meta: {
        page: results.page || 1,
        perPage: results.request_params?.per_page || 20,
        total: results.found || 0,
        searchTimeMs: results.search_time_ms || 0,
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    return c.json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Search failed' },
    }, 500);
  }
});

// Search marketplace
app.get('/marketplace', async (c) => {
  const query = c.req.query();
  const params = searchSchema.parse(query);

  const filterBy: string[] = ['status:=ACTIVE'];
  
  if (query.category) filterBy.push(`category:=${query.category}`);
  if (query.city) filterBy.push(`city:=${query.city}`);
  if (query.condition) filterBy.push(`condition:=${query.condition}`);
  if (query.min_price) filterBy.push(`price:>=${query.min_price}`);
  if (query.max_price) filterBy.push(`price:<=${query.max_price}`);
  if (query.is_negotiable === 'true') filterBy.push('isNegotiable:=true');

  const searchParams = {
    q: params.q,
    query_by: 'title,description,category',
    filter_by: filterBy.join(' && '),
    sort_by: params.sort_by || 'createdAt:desc',
    page: parseInt(params.page),
    per_page: parseInt(params.per_page),
  };

  try {
    const results = await typesenseClient
      .collections('marketplace_items')
      .documents()
      .search(searchParams);

    return c.json({
      success: true,
      data: results.hits?.map(hit => hit.document) || [],
      meta: {
        page: results.page || 1,
        perPage: results.request_params?.per_page || 20,
        total: results.found || 0,
        searchTimeMs: results.search_time_ms || 0,
      },
    });
  } catch (err) {
    console.error('Search error:', err);
    return c.json({
      success: false,
      error: { code: 'SEARCH_ERROR', message: 'Search failed' },
    }, 500);
  }
});

// Autocomplete suggestions
app.get('/suggestions', async (c) => {
  const { q, collection = 'properties' } = c.req.query();

  if (!q || q.length < 2) {
    return c.json({
      success: true,
      data: [],
    });
  }

  try {
    const results = await typesenseClient
      .collections(collection)
      .documents()
      .search({
        q,
        query_by: collection === 'properties' 
          ? 'title,city,address' 
          : 'title,category',
        per_page: 5,
      });

    const suggestions = results.hits?.map(hit => {
      const doc = hit.document as Record<string, string>;
      return {
        text: doc.title,
        highlight: hit.highlights?.[0]?.snippet || doc.title,
        type: collection === 'properties' ? 'property' : 'item',
      };
    }) || [];

    return c.json({
      success: true,
      data: suggestions,
    });
  } catch (err) {
    return c.json({
      success: true,
      data: [],
    });
  }
});

export default app;