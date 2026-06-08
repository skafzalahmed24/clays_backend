const { Sequelize } = require('sequelize');

const databaseUrl = process.env.DATABASE_URL || 'postgres://postgres:postgres@127.0.0.1:5432/ecommerce';

const sequelize = new Sequelize(databaseUrl, {
    dialect: 'postgres',
    logging: false, // Set to console.log if SQL log output is preferred
    pool: {
        max: 5,
        min: 0,
        acquire: 30000,
        idle: 10000
    }
});

const connectDB = async () => {
    try {
        await sequelize.authenticate();
        console.log('PostgreSQL Connected successfully via Sequelize');
    } catch (error) {
        console.error(`PostgreSQL connection error: ${error.message}`);
        process.exit(1);
    }
};

module.exports = {
    sequelize,
    connectDB
};
