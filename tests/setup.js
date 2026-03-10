// Use in-memory model mocks so tests run without a real MongoDB server.
// The mock implementations live in tests/__mocks/ and are wired up via
// moduleNameMapper in the jest config.
const store = require('./__mocks__/store');

beforeAll(() => {
  process.env.MONGODB_URI = 'mongodb://localhost:27017/test';
  process.env.JWT_SECRET = 'test_secret_key';
  process.env.JWT_EXPIRES_IN = '1d';
});

afterAll(() => {
  // nothing to tear down
});

afterEach(() => {
  store.clear();
});
