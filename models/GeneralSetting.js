const { DataTypes } = require('sequelize');
const { sequelize } = require('../config/db');

const GeneralSetting = sequelize.define('GeneralSetting', {
    id: {
        type: DataTypes.UUID,
        defaultValue: DataTypes.UUIDV4,
        primaryKey: true,
    },
    storeName: {
        type: DataTypes.STRING,
        defaultValue: 'Clarysays',
    },
    supportEmail: {
        type: DataTypes.STRING,
        defaultValue: 'support@clarysays.com',
    },
    contactPhone: {
        type: DataTypes.STRING,
        defaultValue: '+91 98765 43210',
    },
    address: {
        type: DataTypes.JSONB,
        defaultValue: {
            line1: '123 Herbal Garden Road',
            line2: 'Green Sector',
            city: 'Mumbai',
            pincode: '400001',
            googleMapsUrl: '',
        },
    },
    addresses: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    socialLinks: {
        type: DataTypes.JSONB,
        defaultValue: {
            instagram: '#',
            facebook: '#',
            youtube: '#',
        },
    },
    uiLabels: {
        type: DataTypes.JSONB,
        defaultValue: {
            search: {
                placeholder: 'Search for herbal products...',
                popularTerms: ['Hair Oil', 'Shampoo', 'Conditioner'],
                noResults: 'No products found',
            },
            cart: {
                emptyMessage: 'Your bag is empty.',
                startShoppingBtn: 'Start Shopping',
                disclaimer: 'Shipping and taxes calculated at checkout.',
            },
            auth: {
                loginTitle: 'Welcome Back',
                loginSubtitle: 'Login to access your personalized shopping experience',
                registerTitle: 'Join the Club',
                registerSubtitle: 'Create an account to unlock exclusive benefits',
            },
            product: {
                relatedTitle: 'You May Also Like',
                reviewsTitle: 'Customer Reviews',
            },
        },
    },
    taxRate: {
        type: DataTypes.FLOAT,
        defaultValue: 18,
    },
    currency: {
        type: DataTypes.STRING,
        defaultValue: 'INR',
    },
    enableReviews: {
        type: DataTypes.BOOLEAN,
        defaultValue: true,
    },
    footerLinks: {
        type: DataTypes.JSONB,
        defaultValue: [],
    },
    openingHours: {
        type: DataTypes.JSONB,
        defaultValue: [
            {
                label: 'Mon - Sat',
                value: '11:00 AM - 8:00 PM',
            },
        ],
    },
    contactSubjects: {
        type: DataTypes.JSONB,
        defaultValue: ['General Inquiry', 'Order Status', 'Product Advice', 'Feedback'],
    },
    announcement: {
        type: DataTypes.JSONB,
        defaultValue: {
            text: 'Unlock Joy with Extra Discounts on eGift Cards',
            link: '/shop',
        },
    },
    productPolicies: {
        type: DataTypes.JSONB,
        defaultValue: {
            shipping: 'Free shipping on orders above ₹499. Easy returns.',
            care: 'Store in a cool, dry place. For external use only.',
        },
    },
    seo: {
        type: DataTypes.JSONB,
        defaultValue: {
            defaultTitle: 'Clarysays',
            defaultDescription: 'Clarysays offers premium herbal hair care products crafted with natural ingredients for healthy, beautiful hair.',
        },
    },
    identity: {
        type: DataTypes.JSONB,
        defaultValue: {
            logo: '',
            favicon: '',
            brandName: 'Clarysays',
            footerLogo: '',
        },
    },
    _id: {
        type: DataTypes.VIRTUAL,
        get() {
            return this.id;
        },
    },
}, {
    timestamps: true,
});

// Singleton helper static method
GeneralSetting.getSingleton = async function () {
    const doc = await this.findOne();
    if (doc) return doc;
    return await this.create({});
};

GeneralSetting.prototype.toJSON = function () {
    const values = { ...this.get() };
    values._id = values.id;
    return values;
};

module.exports = GeneralSetting;
