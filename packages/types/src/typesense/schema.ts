import Typesense from 'typesense';

const TYPESENSE_CONFIG = {
  apiKey: process.env.TYPESENSE_API_KEY || 'rentora-typesense-api-key',
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: (process.env.TYPESENSE_PROTOCOL || 'http') as 'http' | 'https',
    },
  ],
  connectionTimeoutSeconds: 2,
};

const client = new Typesense.Client(TYPESENSE_CONFIG);

// ============================================
// Property Search Schema
// ============================================
export const propertySchema = {
  name: 'properties',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'type', type: 'string' as const, facet: true },
    { name: 'price', type: 'float' as const, sort: true },
    { name: 'priceUnit', type: 'string' as const, facet: true },
    { name: 'bedrooms', type: 'int32' as const, optional: true, facet: true },
    { name: 'bathrooms', type: 'int32' as const, optional: true, facet: true },
    { name: 'areaSqFt', type: 'int32' as const, optional: true, sort: true },
    { name: 'city', type: 'string' as const, facet: true },
    { name: 'address', type: 'string' as const },
    { name: 'amenities', type: 'string[]' as const, facet: true },
    { name: 'furnished', type: 'bool' as const, facet: true },
    { name: 'isFeatured', type: 'bool' as const },
    { name: 'isVerified', type: 'bool' as const, facet: true },
    { name: 'rating', type: 'float' as const, sort: true },
    { name: 'reviewCount', type: 'int32' as const, sort: true },
    { name: 'createdAt', type: 'int64' as const, sort: true },
    { name: 'location', type: 'geopoint' as const },
    { name: 'status', type: 'string' as const, facet: true },
  ],
  default_sorting_field: 'createdAt',
};

// ============================================
// Marketplace Search Schema
// ============================================
export const marketplaceSchema = {
  name: 'marketplace_items',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'title', type: 'string' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'condition', type: 'string' as const, facet: true },
    { name: 'price', type: 'float' as const, sort: true },
    { name: 'isNegotiable', type: 'bool' as const, facet: true },
    { name: 'city', type: 'string' as const, facet: true },
    { name: 'status', type: 'string' as const, facet: true },
    { name: 'createdAt', type: 'int64' as const, sort: true },
  ],
  default_sorting_field: 'createdAt',
};

// ============================================
// Service Search Schema
// ============================================
export const serviceSchema = {
  name: 'services',
  fields: [
    { name: 'id', type: 'string' as const },
    { name: 'name', type: 'string' as const },
    { name: 'description', type: 'string' as const, optional: true },
    { name: 'category', type: 'string' as const, facet: true },
    { name: 'priceRangeMin', type: 'float' as const, optional: true, sort: true },
    { name: 'priceRangeMax', type: 'float' as const, optional: true, sort: true },
    { name: 'isActive', type: 'bool' as const },
  ],
};

// ============================================
// Setup Functions
// ============================================
export async function setupPropertyCollection() {
  try {
    await client.collections('properties').delete();
    console.log('Deleted existing properties collection');
  } catch (e) {
    // Collection might not exist
  }

  await client.collections().create(propertySchema);
  console.log('✅ Created properties collection');
}

export async function setupMarketplaceCollection() {
  try {
    await client.collections('marketplace_items').delete();
    console.log('Deleted existing marketplace_items collection');
  } catch (e) {
    // Collection might not exist
  }

  await client.collections().create(marketplaceSchema);
  console.log('✅ Created marketplace_items collection');
}

export async function setupServiceCollection() {
  try {
    await client.collections('services').delete();
    console.log('Deleted existing services collection');
  } catch (e) {
    // Collection might not exist
  }

  await client.collections().create(serviceSchema);
  console.log('✅ Created services collection');
}

export async function setupAllCollections() {
  await setupPropertyCollection();
  await setupMarketplaceCollection();
  await setupServiceCollection();
  console.log('🎉 All Typesense collections created successfully!');
}

// Run if executed directly
if (require.main === module) {
  setupAllCollections().catch(console.error);
}