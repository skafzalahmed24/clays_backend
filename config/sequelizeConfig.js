require('dotenv').config();

const config = {
  dialect: 'postgres',
  logging: false,
};

if (process.env.DATABASE_URL) {
  config.url = process.env.DATABASE_URL;
} else {
  config.username = process.env.DB_USER || 'postgres';
  config.password = process.env.DB_PASSWORD || 'postgres';
  config.database = process.env.DB_NAME || 'ecommerce';
  config.host = process.env.DB_HOST || '127.0.0.1';
  config.port = process.env.DB_PORT || 5432;
}

module.exports = {
  development: config,
  test: config,
  production: config,
};
