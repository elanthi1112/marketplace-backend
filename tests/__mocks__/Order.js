const { Types } = require('mongoose');
const store = require('./store');

class OrderDoc {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new Types.ObjectId().toString();
    this.buyer = data.buyer ? data.buyer.toString() : null;
    this.items = (data.items || []).map(item => ({
      _id: new Types.ObjectId().toString(),
      product: item.product ? item.product.toString() : null,
      quantity: item.quantity,
      price: item.price,
    }));
    this.totalAmount = data.totalAmount;
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this.updatedAt = new Date();
    store.orders.set(this._id, this);
    return this;
  }

  async populate(paths) {
    const pathList = Array.isArray(paths) ? paths : [{ path: paths }];
    for (const p of pathList) {
      const { path: field, select } = typeof p === 'string' ? { path: p } : p;
      this._populateField(field, select);
    }
    return this;
  }

  _populateField(field, select) {
    if (field === 'buyer') {
      const buyer = store.users.get(this.buyer);
      if (buyer) {
        this.buyer = { _id: buyer._id, name: buyer.name, email: buyer.email };
      }
    } else if (field === 'items.product') {
      this.items = this.items.map(item => {
        const product = store.products.get(
          typeof item.product === 'string' ? item.product : item.product?._id?.toString?.() || String(item.product)
        );
        if (product) {
          const populated = {
            _id: product._id,
            title: product.title,
            price: product.price,
          };
          if (select && select.includes('imageUrl')) populated.imageUrl = product.imageUrl;
          if (select && select.includes('seller')) populated.seller = product.seller;
          return { ...item, product: populated };
        }
        return item;
      });
    }
  }

  toJSON() {
    return this.toObject();
  }

  toObject() {
    return {
      _id: this._id,
      buyer: this.buyer,
      items: this.items,
      totalAmount: this.totalAmount,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class OrderQuery {
  constructor(docsPromise) {
    this._promise = Promise.resolve(docsPromise);
    this._populateFields = [];
    this._sortBy = null;
  }

  populate(field, select) {
    this._populateFields.push({ field, select });
    return this;
  }

  sort(by) {
    this._sortBy = by;
    return this;
  }

  then(resolve, reject) {
    return this._promise
      .then(docs => {
        if (this._sortBy) {
          const [key, dir] = Object.entries(this._sortBy)[0];
          docs = [...docs].sort((a, b) => {
            if (dir === -1) return b[key] > a[key] ? 1 : -1;
            return a[key] > b[key] ? 1 : -1;
          });
        }
        for (const { field, select } of this._populateFields) {
          docs.forEach(doc => doc._populateField && doc._populateField(field, select));
        }
        return docs;
      })
      .then(resolve, reject);
  }

  catch(reject) {
    return this._promise.catch(reject);
  }
}

class SingleOrderQuery {
  constructor(docPromise) {
    this._promise = Promise.resolve(docPromise);
    this._populateFields = [];
  }

  populate(field, select) {
    this._populateFields.push({ field, select });
    return this;
  }

  then(resolve, reject) {
    return this._promise
      .then(doc => {
        if (!doc) return null;
        for (const { field, select } of this._populateFields) {
          doc._populateField && doc._populateField(field, select);
        }
        return doc;
      })
      .then(resolve, reject);
  }

  catch(reject) {
    return this._promise.catch(reject);
  }
}

const Order = {
  find(filter = {}) {
    let orders = [...store.orders.values()];

    if (filter.buyer) {
      const buyerId = filter.buyer.toString();
      orders = orders.filter(o => {
        const ordBuyer = typeof o.buyer === 'string' ? o.buyer : o.buyer?._id?.toString?.() || String(o.buyer);
        return ordBuyer === buyerId;
      });
    }

    if (filter['items.product'] && filter['items.product']['$in']) {
      const ids = filter['items.product']['$in'].map(id => id.toString());
      orders = orders.filter(o =>
        o.items.some(item => {
          const prodId = typeof item.product === 'string' ? item.product : item.product?._id?.toString?.() || String(item.product);
          return ids.includes(prodId);
        })
      );
    }

    return new OrderQuery(orders);
  },

  findById(id) {
    if (!id) return new SingleOrderQuery(null);
    const order = store.orders.get(id.toString()) || null;
    return new SingleOrderQuery(order);
  },

  async create(data) {
    const order = new OrderDoc(data);
    store.orders.set(order._id, order);
    return order;
  },
};

module.exports = Order;
