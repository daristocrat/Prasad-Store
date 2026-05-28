import seedProducts from '../data/products.json';

const STORAGE_KEY = 'prasad-store-products-v1';
const CATEGORY_KEY = 'prasad-store-categories-v1';

export const defaultCategories = [
  'Rice & Grains',
  'Atta & Flour',
  'Pulses & Dal',
  'Cooking Oil & Ghee',
  'Dairy Products',
  'Biscuits & Snacks',
  'Tea & Coffee',
  'Sugar & Salt',
  'Masala & Spices',
  'Beverages',
  'Dry Fruits',
  'Personal Care',
  'Cleaning & Household',
  'Baby Care',
  'Frozen Foods',
  'Instant Foods',
  'Bakery Items'
];

export function calculateDiscount(ourPrice, marketPrice) {
  const our = Number(ourPrice);
  const market = Number(marketPrice);
  if (!market || market <= our) return 0;
  return Math.round(((market - our) / market) * 100);
}

export function normalizeProduct(product) {
  const ourPrice = Number(product.ourPrice || 0);
  const marketPrice = Number(product.marketPrice || 0);
  return {
    id: product.id || Date.now(),
    name: product.name?.trim() || 'New Product',
    category: product.category || 'Rice & Grains',
    brand: product.brand?.trim() || 'Prasad Store',
    unit: product.unit?.trim() || '1 unit',
    image: product.image?.trim() || 'https://images.unsplash.com/photo-1542838132-92c53300491e?auto=format&fit=crop&w=700&q=80',
    ourPrice,
    marketPrice,
    stock: product.stock || 'In Stock',
    discount: calculateDiscount(ourPrice, marketPrice),
    description: product.description?.trim() || 'Daily grocery essential available at Prasad Store wholesale pricing.',
    bestSeller: Boolean(product.bestSeller),
    discounted: Boolean(product.discounted || calculateDiscount(ourPrice, marketPrice) > 0),
    homepageFeatured: Boolean(product.homepageFeatured || product.featured),
    todaysDeal: Boolean(product.todaysDeal),
    lastUpdated: product.lastUpdated || new Date().toISOString()
  };
}

export function loadProducts() {
  const saved = localStorage.getItem(STORAGE_KEY);
  if (!saved) {
    const normalized = seedProducts.map(normalizeProduct);
    saveProducts(normalized);
    return normalized;
  }

  try {
    return JSON.parse(saved).map(normalizeProduct);
  } catch {
    return seedProducts.map(normalizeProduct);
  }
}

export function saveProducts(products) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(products.map(normalizeProduct)));
}

export function loadCategories() {
  const saved = localStorage.getItem(CATEGORY_KEY);
  if (!saved) return defaultCategories;

  try {
    const parsed = JSON.parse(saved);
    return parsed.length ? parsed : defaultCategories;
  } catch {
    return defaultCategories;
  }
}

export function saveCategories(categories) {
  localStorage.setItem(CATEGORY_KEY, JSON.stringify([...new Set(categories.filter(Boolean))]));
}

export function parseCsvProducts(csvText) {
  const rows = csvText
    .split(/\r?\n/)
    .map((row) => row.trim())
    .filter(Boolean);

  if (rows.length < 2) return [];

  const headers = rows[0].split(',').map((header) => header.trim().toLowerCase());
  return rows.slice(1).map((row, index) => {
    const values = row.split(',').map((value) => value.trim());
    const record = headers.reduce((acc, header, headerIndex) => {
      acc[header] = values[headerIndex] || '';
      return acc;
    }, {});

    return normalizeProduct({
      id: Date.now() + index,
      name: record.name || record['product name'],
      category: record.category,
      brand: record.brand,
      unit: record.unit || record.weight || record.quantity || record['weight/quantity'],
      image: record.image || record['product image'],
      ourPrice: record.ourprice || record['our price'],
      marketPrice: record.marketprice || record['market price'] || record['jiomart price'],
      stock: record.stock || record['stock availability'],
      description: record.description,
      bestSeller: record.bestseller === 'true',
      discounted: record.discounted === 'true',
      homepageFeatured: record.homepagefeatured === 'true',
      todaysDeal: record.todaysdeal === 'true'
    });
  });
}
