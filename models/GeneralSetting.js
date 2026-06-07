const mongoose = require('mongoose');

const generalSettingSchema = mongoose.Schema({
    storeName: { type: String, default: 'Mershai' },
    supportEmail: { type: String, default: 'support@mershai.com' },
    contactPhone: { type: String, default: '+91 98765 43210' },
    address: { // Legacy - moving to addresses array
        line1: { type: String, default: '123 Jewelry Lane' },
        line2: { type: String, default: 'Fashion Street' },
        city: { type: String, default: 'Mumbai' },
        pincode: { type: String, default: '400001' },
        googleMapsUrl: { type: String, default: '' }
    },
    addresses: [
        {
            line1: String,
            line2: String,
            city: String,
            pincode: String,
            country: { type: String, default: 'India' },
            googleMapsUrl: String
        }
    ],
    socialLinks: {
        instagram: { type: String, default: '#' },
        facebook: { type: String, default: '#' },
        youtube: { type: String, default: '#' }
    },
    uiLabels: {
        search: {
            placeholder: { type: String, default: 'Search for jewellery...' },
            popularTerms: [{ type: String }],
            noResults: { type: String, default: 'No results found' }
        },
        cart: {
            emptyMessage: { type: String, default: 'Your bag is empty.' },
            startShoppingBtn: { type: String, default: 'Start Shopping' },
            disclaimer: { type: String, default: 'Shipping and taxes calculated at checkout.' }
        },
        auth: {
            loginTitle: { type: String, default: 'Welcome Back' },
            loginSubtitle: { type: String, default: 'Login to access your personalized shopping experience' },
            registerTitle: { type: String, default: 'Join the Club' },
            registerSubtitle: { type: String, default: 'Create an account to unlock exclusive benefits' }
        },
        product: {
            relatedTitle: { type: String, default: 'You May Also Like' },
            reviewsTitle: { type: String, default: 'Customer Reviews' }
        }
    },
    taxRate: { type: Number, default: 18 },
    currency: { type: String, default: 'INR' },
    enableReviews: { type: Boolean, default: true },
    footerLinks: [
        {
            title: { type: String, required: true },
            links: [
                { label: String, url: String }
            ]
        }
    ],
    openingHours: [
        {
            label: { type: String, default: 'Mon - Sat' },
            value: { type: String, default: '11:00 AM - 8:00 PM' }
        }
    ],
    contactSubjects: { type: [String], default: ['General Inquiry', 'Custom Order', 'Appointment Request', 'Feedback'] },
    announcement: {
        text: { type: String, default: 'Unlock Joy with Extra Discounts on eGift Cards' },
        link: { type: String, default: '/shop' }
    },
    productPolicies: {
        shipping: { type: String, default: 'Free shipping on orders. Easy 7-day returns.' },
        care: { type: String, default: 'Keep away from perfumes.' }
    },
    seo: {
        defaultTitle: { type: String, default: 'Mershai' },
        defaultDescription: { type: String, default: 'Mershai offers a curated collection of dark luxury jewelry.' }
    },
    identity: {
        logo: { type: String },
        favicon: { type: String },
        brandName: { type: String, default: 'Mershai' },
        footerLogo: { type: String }
    }
}, {
    timestamps: true,
});

// Singleton helper
generalSettingSchema.statics.getSingleton = async function () {
    const doc = await this.findOne();
    if (doc) return doc;
    return await this.create({});
};

const GeneralSetting = mongoose.model('GeneralSetting', generalSettingSchema);

module.exports = GeneralSetting;
