require('dotenv').config({ path: '.env' });

// Default env for tests so mongo/jwt don't need real values
process.env.DB_NAME = process.env.DB_NAME || 'test_db';
process.env.AUTH0_DOMAIN = process.env.AUTH0_DOMAIN || 'test.auth0.com';
process.env.AUTH0_AUDIENCE = process.env.AUTH0_AUDIENCE || 'test-audience';
process.env.MONGO_URI = process.env.MONGO_URI || 'mongodb://localhost:27017';
