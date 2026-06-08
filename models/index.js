const { sequelize } = require('../config/db');

// Import all models to ensure they are registered with Sequelize
const Admin = require('./Admin');
const Attribute = require('./Attribute');
const Blog = require('./Blog');
const Category = require('./Category');
const Contact = require('./Contact');
const Coupon = require('./Coupon');
const FAQ = require('./FAQ');
const GeneralSetting = require('./GeneralSetting');
const Heritage = require('./Heritage');
const HeroSlide = require('./HeroSlide');
const MegaMenu = require('./MegaMenu');
const Order = require('./Order');
const Page = require('./Page');
const Product = require('./Product');
const SocialPost = require('./SocialPost');
const StockRequest = require('./StockRequest');
const Testimonial = require('./Testimonial');
const TrustBadge = require('./TrustBadge');
const User = require('./User');

// Define database associations
// Product belongs to User/Admin who created it
Product.belongsTo(User, { foreignKey: 'userId', as: 'creator' });
User.hasMany(Product, { foreignKey: 'userId', as: 'products' });

// Order belongs to User
Order.belongsTo(User, { foreignKey: 'userId', as: 'user' });
User.hasMany(Order, { foreignKey: 'userId', as: 'orders' });

// StockRequest belongs to Product
StockRequest.belongsTo(Product, { foreignKey: 'productId', as: 'product' });
Product.hasMany(StockRequest, { foreignKey: 'productId', as: 'stockRequests' });

const db = {
    Admin,
    Attribute,
    Blog,
    Category,
    Contact,
    Coupon,
    FAQ,
    GeneralSetting,
    Heritage,
    HeroSlide,
    MegaMenu,
    Order,
    Page,
    Product,
    SocialPost,
    StockRequest,
    Testimonial,
    TrustBadge,
    User,
    sequelize
};

module.exports = db;
