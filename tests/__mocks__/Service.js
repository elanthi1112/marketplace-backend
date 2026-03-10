const { Types } = require('mongoose');
const store = require('./store');

function professionalIdOf(professional) {
  if (!professional) return null;
  if (typeof professional === 'string') return professional;
  if (professional._id) return professional._id.toString();
  return professional.toString();
}

class ServiceDoc {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new Types.ObjectId().toString();
    this.title = data.title;
    this.description = data.description;
    this.price = data.price;
    this.priceType = data.priceType || 'fixed';
    this.minimumCharge = data.minimumCharge || 0;
    this.travelFee = data.travelFee || 0;
    this.category = data.category;
    this._professionalId = professionalIdOf(data.professional);
    this.professional = this._professionalId;
    this.isActive = data.isActive !== undefined ? data.isActive : true;
    this.imageUrl = data.imageUrl || '';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async save() {
    this._professionalId = professionalIdOf(this.professional);
    this.professional = this._professionalId;
    this.updatedAt = new Date();
    store.services.set(this._id, this);
    return this;
  }

  async deleteOne() {
    store.services.delete(this._id);
  }

  async populate(field) {
    if (typeof field === 'string') this._populateField(field);
    else if (typeof field === 'object' && !Array.isArray(field)) this._populateField(field.path || field);
    return this;
  }

  _populateField(field) {
    if (field === 'professional' || field === 'professional name email avatar') {
      const profId = this._professionalId || professionalIdOf(this.professional);
      const profData = store.users.get(profId);
      if (profData) {
        const rawId = profId;
        this.professional = {
          _id: profData._id,
          name: profData.name,
          email: profData.email,
          avatar: profData.avatar || '',
          toString() { return rawId; },
        };
      }
    }
  }

  toJSON() { return this.toObject(); }

  toObject() {
    return {
      _id: this._id,
      title: this.title,
      description: this.description,
      price: this.price,
      priceType: this.priceType,
      minimumCharge: this.minimumCharge,
      travelFee: this.travelFee,
      category: this.category,
      professional: this.professional,
      isActive: this.isActive,
      imageUrl: this.imageUrl,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

class ServiceQuery {
  constructor(docs) {
    this._promise = Promise.resolve(docs);
    this._populateFields = [];
    this._skipN = 0;
    this._limitN = Infinity;
    this._sortBy = null;
  }

  populate(field) { this._populateFields.push(field); return this; }
  skip(n) { this._skipN = n; return this; }
  limit(n) { this._limitN = n; return this; }
  sort(by) { this._sortBy = by; return this; }
  select() { return this; }

  then(resolve, reject) {
    return this._promise.then(docs => {
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
    }).then(resolve, reject);
  }

  catch(reject) { return this._promise.catch(reject); }
}

class SingleServiceQuery {
  constructor(doc) {
    this._promise = Promise.resolve(doc);
    this._populateFields = [];
  }

  populate(field) { this._populateFields.push(field); return this; }

  then(resolve, reject) {
    return this._promise.then(doc => {
      if (!doc) return null;
      for (const field of this._populateFields) {
        doc._populateField && doc._populateField(field);
      }
      return doc;
    }).then(resolve, reject);
  }

  catch(reject) { return this._promise.catch(reject); }
}

function applyFilter(services, filter) {
  return services.filter(s => {
    if (filter.isActive !== undefined && s.isActive !== filter.isActive) return false;
    if (filter.category && s.category !== filter.category) return false;
    if (filter.professional) {
      const fId = professionalIdOf(filter.professional);
      if (s._professionalId !== fId && professionalIdOf(s.professional) !== fId) return false;
    }
    if (filter.$text) {
      const search = filter.$text.$search.toLowerCase();
      return (s.title || '').toLowerCase().includes(search) ||
             (s.description || '').toLowerCase().includes(search);
    }
    return true;
  });
}

const Service = {
  find(filter = {}) {
    const filtered = applyFilter([...store.services.values()], filter);
    return new ServiceQuery(filtered);
  },

  findById(id) {
    if (!id) return new SingleServiceQuery(null);
    const service = store.services.get(id.toString()) || null;
    return new SingleServiceQuery(service);
  },

  async create(data) {
    const service = new ServiceDoc(data);
    store.services.set(service._id, service);
    return service;
  },

  async countDocuments(filter = {}) {
    return applyFilter([...store.services.values()], filter).length;
  },
};

module.exports = Service;
