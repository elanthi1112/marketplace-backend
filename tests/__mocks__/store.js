// Shared in-memory store for all model mocks
const store = {
  users: new Map(),
  products: new Map(),
  orders: new Map(),
  services: new Map(),
  serviceRequests: new Map(),
  companies: new Map(),
  clear() {
    this.users.clear();
    this.products.clear();
    this.orders.clear();
    this.services.clear();
    this.serviceRequests.clear();
    this.companies.clear();
  },
};

module.exports = store;
