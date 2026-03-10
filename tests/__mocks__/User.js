const bcrypt = require('bcryptjs');
const { Types } = require('mongoose');
const store = require('./store');

class UserDoc {
  constructor(data) {
    this._id = data._id ? data._id.toString() : new Types.ObjectId().toString();
    this.name = data.name;
    this.email = (data.email || '').toLowerCase().trim();
    this.password = data.password;
    this.role = data.role || 'buyer';
    this.createdAt = data.createdAt || new Date();
    this.updatedAt = data.updatedAt || new Date();
  }

  async comparePassword(candidate) {
    return bcrypt.compare(candidate, this.password);
  }

  toJSON() {
    const obj = this.toObject();
    delete obj.password;
    return obj;
  }

  toObject() {
    return {
      _id: this._id,
      name: this.name,
      email: this.email,
      password: this.password,
      role: this.role,
      createdAt: this.createdAt,
      updatedAt: this.updatedAt,
    };
  }
}

// Chainable query that resolves to a result; supports .select()
class UserQuery {
  constructor(resultPromise) {
    this._promise = Promise.resolve(resultPromise);
  }

  // .select('+password') is a no-op in the mock — password is always present internally
  select() {
    return this;
  }

  then(resolve, reject) {
    return this._promise.then(resolve, reject);
  }

  catch(reject) {
    return this._promise.catch(reject);
  }
}

function findAll() {
  return [...store.users.values()];
}

function matchQuery(user, query) {
  return Object.entries(query).every(([k, v]) => user[k] === v);
}

const User = {
  findOne(query) {
    const found = findAll().find(u => matchQuery(u, query)) || null;
    return new UserQuery(found);
  },

  findById(id) {
    if (!id) return new UserQuery(null);
    const user = store.users.get(id.toString()) || null;
    return new UserQuery(user);
  },

  async create(data) {
    const email = (data.email || '').toLowerCase().trim();
    const duplicate = findAll().find(u => u.email === email);
    if (duplicate) {
      const err = new Error(`Duplicate value for email`);
      err.code = 11000;
      err.keyValue = { email };
      throw err;
    }
    const hashedPassword = await bcrypt.hash(data.password, 12);
    const user = new UserDoc({ ...data, email, password: hashedPassword });
    store.users.set(user._id, user);
    return user;
  },

  async findByIdAndUpdate(id, updates, opts = {}) {
    const user = store.users.get(id.toString());
    if (!user) return null;
    if (updates.name !== undefined) user.name = updates.name;
    if (updates.email !== undefined) user.email = updates.email.toLowerCase().trim();
    user.updatedAt = new Date();
    store.users.set(user._id, user);
    return opts.new !== false ? user : user;
  },
};

module.exports = User;
