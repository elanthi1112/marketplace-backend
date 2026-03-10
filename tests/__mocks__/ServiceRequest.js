const { Types } = require('mongoose');
const store = require('./store');

function idOf(val) {
  if (!val) return null;
  if (typeof val === 'string') return val;
  if (val._id) return val._id.toString();
  return val.toString();
}

class ServiceRequestDoc {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new Types.ObjectId().toString();
    // preserve raw IDs independently of any display/populated value
    this._clientId = idOf(data.client);
    this._professionalId = idOf(data.professional);
    this._serviceId = idOf(data.service);
    this.client = this._clientId;
    this.professional = this._professionalId;
    this.service = this._serviceId;
    this.serviceTitle = data.serviceTitle || '';
    this.preferredDateTime = data.preferredDateTime || null;
    this.notes = data.notes || '';
    this.offeredPrice = data.offeredPrice || null;
    this.counterOffer = data.counterOffer || null;
    this.cancelReason = data.cancelReason || '';
    this.status = data.status || 'pending';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    // Reset to raw IDs before saving so future lookups work correctly
    this._clientId = idOf(this.client);
    this._professionalId = idOf(this.professional);
    this._serviceId = idOf(this.service);
    this.client = this._clientId;
    this.professional = this._professionalId;
    this.service = this._serviceId;
    this.updatedAt = new Date();
    store.serviceRequests.set(this._id, this);
    return this;
  }

  async populate(paths) {
    const pathList = Array.isArray(paths) ? paths : [{ path: paths }];
    for (const p of pathList) {
      const { path: field } = typeof p === 'string' ? { path: p } : p;
      this._populateField(field);
    }
    return this;
  }

  _populateField(field) {
    if (field === 'client') {
      const user = store.users.get(this._clientId);
      if (user) {
        const rawId = this._clientId;
        this.client = { _id: user._id, name: user.name, email: user.email, avatar: user.avatar || '', toString() { return rawId; } };
      }
    } else if (field === 'professional') {
      const user = store.users.get(this._professionalId);
      if (user) {
        const rawId = this._professionalId;
        this.professional = { _id: user._id, name: user.name, email: user.email, avatar: user.avatar || '', toString() { return rawId; } };
      }
    } else if (field === 'service') {
      const svc = this._serviceId ? store.services.get(this._serviceId) : null;
      if (svc) this.service = { _id: svc._id, title: svc.title, price: svc.price, priceType: svc.priceType };
    }
  }

  toJSON() { return this.toObject(); }

  toObject() {
    return {
      _id: this._id,
      client: this.client,
      professional: this.professional,
      service: this.service,
      serviceTitle: this.serviceTitle,
      preferredDateTime: this.preferredDateTime,
      notes: this.notes,
      offeredPrice: this.offeredPrice,
      counterOffer: this.counterOffer,
      cancelReason: this.cancelReason,
      status: this.status,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class ServiceRequestQuery {
  constructor(docsPromise) {
    this._promise = Promise.resolve(docsPromise);
    this._populateFields = [];
    this._sortBy = null;
  }

  populate(field) { this._populateFields.push({ field }); return this; }
  sort(by) { this._sortBy = by; return this; }

  then(resolve, reject) {
    return this._promise.then(docs => {
      if (this._sortBy) {
        const [key, dir] = Object.entries(this._sortBy)[0];
        docs = [...docs].sort((a, b) => dir === -1 ? (b[key] > a[key] ? 1 : -1) : (a[key] > b[key] ? 1 : -1));
      }
      for (const { field } of this._populateFields) {
        docs.forEach(doc => doc._populateField && doc._populateField(field));
      }
      return docs;
    }).then(resolve, reject);
  }

  catch(reject) { return this._promise.catch(reject); }
}

class SingleServiceRequestQuery {
  constructor(docPromise) {
    this._promise = Promise.resolve(docPromise);
    this._populateFields = [];
  }

  populate(field) { this._populateFields.push({ field }); return this; }

  then(resolve, reject) {
    return this._promise.then(doc => {
      if (!doc) return null;
      for (const { field } of this._populateFields) {
        doc._populateField && doc._populateField(field);
      }
      return doc;
    }).then(resolve, reject);
  }

  catch(reject) { return this._promise.catch(reject); }
}

const ServiceRequest = {
  find(filter = {}) {
    let requests = [...store.serviceRequests.values()];
    if (filter.$or) {
      requests = requests.filter(r =>
        filter.$or.some(cond => {
          if (cond.client) return r._clientId === cond.client.toString();
          if (cond.professional) return r._professionalId === cond.professional.toString();
          return false;
        })
      );
    }
    if (filter.status) requests = requests.filter(r => r.status === filter.status);
    return new ServiceRequestQuery(requests);
  },

  findById(id) {
    if (!id) return new SingleServiceRequestQuery(null);
    const req = store.serviceRequests.get(id.toString()) || null;
    return new SingleServiceRequestQuery(req);
  },

  async create(data) {
    const req = new ServiceRequestDoc(data);
    store.serviceRequests.set(req._id, req);
    return req;
  },
};

module.exports = ServiceRequest;
