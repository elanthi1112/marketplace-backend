// Shared in-memory store for all model mocks
const store = {
  users: new Map(),
  products: new Map(),
  orders: new Map(),
  clear() {
    this.users.clear();
    this.products.clear();
    this.orders.clear();
  },
};

module.exports = store;
