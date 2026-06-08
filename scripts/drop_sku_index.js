const mongoose = require('mongoose');
const dotenv = require('dotenv');
const path = require('path');

// Adjust path to .env file if necessary (assuming script is in Clarysays_api/scripts/)
dotenv.config({ path: path.join(__dirname, '../.env') });

const dropIndex = async () => {
    try {
        if (!process.env.MONGO_URI) {
            throw new Error('MONGO_URI is not defined in .env');
        }

        console.log('Connecting to MongoDB...');
        await mongoose.connect(process.env.MONGO_URI);
        console.log('Connected.');

        const collection = mongoose.connection.collection('products');
        
        console.log('Checking indexes...');
        const indexes = await collection.indexes();
        console.log('Found indexes:', indexes.map(i => i.name));

        const skuIndex = indexes.find(idx => idx.name === 'sku_1');
        
        if (skuIndex) {
            console.log('Found "sku_1" index. Dropping it...');
            await collection.dropIndex('sku_1');
            console.log('✅ Successfully dropped unique index: sku_1');
            console.log('Duplicate SKUs are now allowed.');
        } else {
            console.log('ℹ️ Index "sku_1" not found. It may have already been removed.');
        }

        process.exit(0);
    } catch (error) {
        console.error('❌ Error:', error.message);
        process.exit(1);
    }
};

dropIndex();
