const { Types } = require('mongoose');
const store = require('./store');

// Normalize a seller value to a raw string ID
function sellerIdOf(seller) {
  if (!seller) return null;
  if (typeof seller === 'string') return seller;
  if (seller._id) return seller._id.toString();
  return seller.toString();
}

class ProductDoc {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new Types.ObjectId().toString();
    this.title = data.title;
    this.description = data.description;
    this.price = data.price;
    this.category = data.category;
    this._sellerId = sellerIdOf(data.seller); // raw ID always preserved
    this.seller = this._sellerId;             // display value; can be populated
    this.stock = data.stock !== undefined ? data.stock : 0;
    this.imageUrl = data.imageUrl || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    // Before saving back to store, reset seller to raw ID so future findById is clean
    this._sellerId = sellerIdOf(this.seller);
    this.seller = this._sellerId;
    this.updatedAt = new Date();
    store.products.set(this._id, this);
    return this;
  }

  async deleteOne() {
    store.products.delete(this._id);
  }

  async populate(field) {
    if (typeof field === 'string') {
      this._populateField(field);
    } else if (typeof field === 'object' && !Array.isArray(field)) {
      this._populateField(field.path || field);
    }
    return this;
  }

  _populateField(field) {
    if (field === 'seller' || field === 'seller name email') {
      const sellerId = this._sellerId || sellerIdOf(this.seller);
      const sellerData = store.users.get(sellerId);
      if (sellerData) {
        // Create object whose toString() returns the raw ID, so controller
        // comparisons like `product.seller.toString() !== req.user._id.toString()` work.
        const rawId = sellerId;
        const populated = {
          _id: sellerData._id,
          name: sellerData.name,
          email: sellerData.email,
          toString() { return rawId; },
        };
        this.seller = populated;
      }
    }
  }

  toJSON() {
    return this.toObject();
  }

  toObject() {
    return {
      _id: this._id,
      title: this.title,
      description: this.description,
      price: this.price,
      category: this.category,
      seller: this.seller,
      stock: this.stock,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Chainable list query
class ProductQuery {
  constructor(docs) {
    this._promise = Promise.resolve(docs);
    this._populateFields = [];
    this._skipN = 0;
    this._limitN = Infinity;
    this._sortBy = null;
  }

  populate(field) {
    this._populateFields.push(field);
    return this;
  }

  skip(n) { this._skipN = n; return this; }
  limit(n) { this._limitN = n; return this; }
  sort(by) { this._sortBy = by; return this; }
  select() { return this; }

  then(resolve, reject) {
    return this._promise
      .then(docs => {
        if (this._sortBy) {
          const [key, dir] = Object.entries(this._sortBy)[0];
          docs = [...docs].sort((a, b) =>
            dir === -1 ? (b[key] > a[key] ? 1 : -1) : (a[key] > b[key] ? 1 : -1)
          );
        }
        const end = this._limitN === Infinity ? undefined : this._skipN + this._limitN;
        docs = docs.slice(this._skipN, end);
        for (const field of this._populateFields) {
          docs.forEach(doc => doc._populateField && doc._populateField(field));
        }
        return docs;
      })
      .then(resolve, reject);
  }

  catch(reject) { return this._promise.catch(reject); }
}

// Single-doc query
class SingleProductQuery {
  constructor(doc) {
    this._promise = Promise.resolve(doc);
    this._populateFields = [];
  }

  populate(field) {
    this._populateFields.push(field);
    return this;
  }

  then(resolve, reject) {
    return this._promise
      .then(doc => {
        if (!doc) return null;
        for (const field of this._populateFields) {
          doc._populateField && doc._populateField(field);
        }
        return doc;
      })
      .then(resolve, reject);
  }

  catch(reject) { return this._promise.catch(reject); }
}

function applyFilter(products, filter) {
  return products.filter(p => {
    if (filter.category && p.category !== filter.category) return false;
    if (filter.seller) {
      const fId = sellerIdOf(filter.seller);
      if (p._sellerId !== fId && sellerIdOf(p.seller) !== fId) return false;
    }
    if (filter.$text) {
      const search = filter.$text.$search.toLowerCase();
      return (p.title || '').toLowerCase().includes(search) ||
             (p.description || '').toLowerCase().includes(search);
    }
    return true;
  });
}

const Product = {
  find(filter = {}) {
    const filtered = applyFilter([...store.products.values()], filter);
    return new ProductQuery(filtered);
  },

  findById(id) {
    if (!id) return new SingleProductQuery(null);
    const product = store.products.get(id.toString()) || null;
    return new SingleProductQuery(product);
  },

  async create(data) {
    const product = new ProductDoc(data);
    store.products.set(product._id, product);
    return product;
  },

  async countDocuments(filter = {}) {
    return applyFilter([...store.products.values()], filter).length;
  },

  async findByIdAndUpdate(id, update) {
    const product = store.products.get(id.toString());
    if (!product) return null;
    if (update.$inc) {
      for (const [field, delta] of Object.entries(update.$inc)) {
        product[field] = (product[field] || 0) + delta;
      }
    }
    product.updatedAt = new Date();
    return product;
  },
};

module.exports = Product;
