import Typesense from 'typesense';

const typesenseClient = new Typesense.Client({
  nodes: [
    {
      host: process.env.TYPESENSE_HOST || 'localhost',
      port: parseInt(process.env.TYPESENSE_PORT || '8108'),
      protocol: (process.env.TYPESENSE_PROTOCOL || 'http') as 'http' | 'https',
    },
  ],
  apiKey: process.env.TYPESENSE_API_KEY || 'rentora-typesense-api-key',
  connectionTimeoutSeconds: 2,
});

export async function indexProperty(property: {
  id: string;
  title: string;
  description: string;
  type: string;
  price: number;
  priceUnit: string;
  bedrooms?: number | null;
  bathrooms?: number | null;
  areaSqFt?: number | null;
  city: string;
  address: string;
  amenities: string[];
  furnished: boolean;
  isFeatured: boolean;
  isVerified: boolean;
  rating: number;
  reviewCount: number;
  createdAt: Date;
  latitude?: number | null;
  longitude?: number | null;
  status: string;
}) {
  try {
    await typesenseClient.collections('properties').documents().create({
      ...property,
      createdAt: Math.floor(property.createdAt.getTime() / 1000),
      location: property.latitude && property.longitude 
        ? [property.latitude, property.longitude] 
        : undefined,
    });
  } catch (err) {
    console.error('Typesense index error:', err);
    throw err;
  }
}

export async function updatePropertyIndex(propertyId: string, data: Partial<{
  title: string;
  description: string;
  price: number;
  amenities: string[];
  isFeatured: boolean;
  isVerified: boolean;
  status: string;
}>) {
  try {
    await typesenseClient.collections('properties').documents(propertyId).update(data);
  } catch (err) {
    console.error('Typesense update error:', err);
  }
}

export async function deletePropertyIndex(propertyId: string) {
  try {
    await typesenseClient.collections('properties').documents(propertyId).delete();
  } catch (err) {
    console.error('Typesense delete error:', err);
  }
}

export async function indexMarketplaceItem(item: {
  id: string;
  title: string;
  description: string;
  category: string;
  condition: string;
  price: number;
  isNegotiable: boolean;
  city: string;
  status: string;
  createdAt: Date;
}) {
  try {
    await typesenseClient.collections('marketplace_items').documents().create({
      ...item,
      createdAt: Math.floor(item.createdAt.getTime() / 1000),
    });
  } catch (err) {
    console.error('Typesense marketplace index error:', err);
  }
}

export async function searchProperties(query: string, filters: Record<string, unknown> = {}) {
  try {
    const searchParameters = {
      q: query || '*',
      query_by: 'title,description,address,city,amenities',
      filter_by: Object.entries(filters)
        .filter(([, v]) => v !== undefined)
        .map(([k, v]) => `${k}:${v}`)
        .join(' && '),
      sort_by: 'createdAt:desc',
      per_page: 20,
    };

    const results = await typesenseClient
      .collections('properties')
      .documents()
      .search(searchParameters);

    return results;
  } catch (err) {
    console.error('Typesense search error:', err);
    return { hits: [], found: 0 };
  }
}

export { typesenseClient };