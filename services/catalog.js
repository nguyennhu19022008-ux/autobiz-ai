const fs = require('fs');
const path = require('path');

const PRODUCTS_FILE = path.join(__dirname, '..', 'data', 'products.json');

function ensureFile() {
  const dir = path.dirname(PRODUCTS_FILE);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (!fs.existsSync(PRODUCTS_FILE)) fs.writeFileSync(PRODUCTS_FILE, '[]', 'utf8');
}

function readProducts() {
  ensureFile();
  try {
    const raw = fs.readFileSync(PRODUCTS_FILE, 'utf8');
    const parsed = JSON.parse(raw);
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

function writeProducts(products) {
  ensureFile();
  fs.writeFileSync(PRODUCTS_FILE, JSON.stringify(products, null, 2), 'utf8');
}

/**
 * List products with optional category and search query filters
 */
function listProducts({ category = 'all', search = '' } = {}) {
  let items = readProducts();
  if (category && category !== 'all') {
    items = items.filter((p) => p.category === category);
  }
  if (search && search.trim() !== '') {
    const q = search.trim().toLowerCase();
    items = items.filter((p) =>
      String(p.name || '').toLowerCase().includes(q) ||
      String(p.sku || '').toLowerCase().includes(q) ||
      (Array.isArray(p.specs) && p.specs.some((s) => String(s).toLowerCase().includes(q)))
    );
  }
  return items;
}

function getProductById(id) {
  return readProducts().find((p) => p.id === id || p.sku === id) || null;
}

function createProduct(payload) {
  const products = readProducts();
  const sku = String(payload.sku || `SP${String(products.length + 1).padStart(2, '0')}`).toUpperCase().trim();
  const id = `prod_${sku.toLowerCase().replace(/[^a-z0-9]/g, '')}_${Date.now().toString().slice(-4)}`;

  const newProduct = {
    id,
    sku,
    name: String(payload.name || 'Sản phẩm mới').trim(),
    category: payload.category || 'accessories',
    price_retail: Number(payload.price_retail) || 0,
    commission_rate: Number(payload.commission_rate) || 10,
    affiliate_base_url: String(payload.affiliate_base_url || '').trim(),
    specs: Array.isArray(payload.specs)
      ? payload.specs.filter(Boolean)
      : String(payload.specs || '')
          .split('\n')
          .map((s) => s.trim())
          .filter(Boolean),
    status: payload.status || 'active',
    created_at: new Date().toISOString()
  };

  products.unshift(newProduct);
  writeProducts(products);
  return newProduct;
}

function updateProduct(id, payload) {
  const products = readProducts();
  const idx = products.findIndex((p) => p.id === id);
  if (idx === -1) return null;

  const existing = products[idx];
  const updated = {
    ...existing,
    ...payload,
    id: existing.id,
    price_retail: payload.price_retail !== undefined ? Number(payload.price_retail) : existing.price_retail,
    commission_rate: payload.commission_rate !== undefined ? Number(payload.commission_rate) : existing.commission_rate,
    updated_at: new Date().toISOString()
  };
  products[idx] = updated;
  writeProducts(products);
  return updated;
}

function deleteProduct(id) {
  const products = readProducts();
  const next = products.filter((p) => p.id !== id);
  if (next.length === products.length) return false;
  writeProducts(next);
  return true;
}

module.exports = {
  listProducts,
  getProductById,
  createProduct,
  updateProduct,
  deleteProduct
};
