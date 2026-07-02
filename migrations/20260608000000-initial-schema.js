'use strict';

module.exports = {
  up: async (queryInterface, Sequelize) => {
    // 1. Create Admins table
    await queryInterface.createTable('Admins', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, defaultValue: 'admin' },
      permissions: { type: Sequelize.JSONB, defaultValue: ['all'] },
      otp: { type: Sequelize.STRING },
      otpExpires: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 2. Create Users table
    await queryInterface.createTable('Users', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false, unique: true },
      password: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, defaultValue: 'user' },
      isVerified: { type: Sequelize.BOOLEAN, defaultValue: false },
      otp: { type: Sequelize.STRING },
      otpExpire: { type: Sequelize.DATE },
      addresses: { type: Sequelize.JSONB, defaultValue: [] },
      cart: { type: Sequelize.JSONB, defaultValue: [] },
      wishlist: { type: Sequelize.JSONB, defaultValue: [] },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 3. Create Products table
    await queryInterface.createTable('Products', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      reviews: { type: Sequelize.JSONB, defaultValue: [] },
      rating: { type: Sequelize.FLOAT, defaultValue: 0 },
      numReviews: { type: Sequelize.INTEGER, defaultValue: 0 },
      price: { type: Sequelize.FLOAT, allowNull: false },
      originalPrice: { type: Sequelize.FLOAT },
      category: { type: Sequelize.STRING, allowNull: false },
      subCategory: { type: Sequelize.STRING },
      img: { type: Sequelize.STRING, allowNull: false },
      images: { type: Sequelize.JSONB, defaultValue: [] },
      sku: { type: Sequelize.STRING },
      tags: { type: Sequelize.JSONB, defaultValue: [] },
      dimensions: { type: Sequelize.JSONB, defaultValue: {} },
      weight: { type: Sequelize.FLOAT },
      meta: { type: Sequelize.JSONB, defaultValue: {} },
      stock: { type: Sequelize.INTEGER, defaultValue: 0 },
      inStock: { type: Sequelize.BOOLEAN, defaultValue: true },
      attributes: { type: Sequelize.JSONB, defaultValue: {} },
      isFeatured: { type: Sequelize.BOOLEAN, defaultValue: false },
      isNewArrival: { type: Sequelize.BOOLEAN, defaultValue: false },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 4. Create Orders table
    await queryInterface.createTable('Orders', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      userId: { type: Sequelize.UUID, allowNull: false },
      orderItems: { type: Sequelize.JSONB, allowNull: false },
      shippingAddress: { type: Sequelize.JSONB, allowNull: false },
      paymentMethod: { type: Sequelize.STRING, allowNull: false },
      paymentResult: { type: Sequelize.JSONB },
      itemsPrice: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0.0 },
      taxPrice: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0.0 },
      shippingPrice: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0.0 },
      totalPrice: { type: Sequelize.FLOAT, allowNull: false, defaultValue: 0.0 },
      isPaid: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      paidAt: { type: Sequelize.DATE },
      isDelivered: { type: Sequelize.BOOLEAN, allowNull: false, defaultValue: false },
      deliveredAt: { type: Sequelize.DATE },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'Pending' },
      cancelledAt: { type: Sequelize.DATE },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 5. Create Attributes table
    await queryInterface.createTable('Attributes', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      type: { type: Sequelize.STRING, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false },
      value: { type: Sequelize.STRING },
      img: { type: Sequelize.STRING },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('Attributes', ['type', 'name'], { unique: true });

    // 6. Create Blogs table
    await queryInterface.createTable('Blogs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      excerpt: { type: Sequelize.TEXT, allowNull: false },
      content: { type: Sequelize.TEXT, allowNull: false },
      image: { type: Sequelize.STRING, allowNull: false },
      category: { type: Sequelize.STRING, allowNull: false },
      author: { type: Sequelize.STRING, defaultValue: 'Admin' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 7. Create Categories table
    await queryInterface.createTable('Categories', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      name: { type: Sequelize.STRING, allowNull: false, unique: true },
      img: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 8. Create Contacts table
    await queryInterface.createTable('Contacts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      firstName: { type: Sequelize.STRING, allowNull: false },
      lastName: { type: Sequelize.STRING, allowNull: false },
      email: { type: Sequelize.STRING, allowNull: false },
      subject: { type: Sequelize.STRING, allowNull: false },
      message: { type: Sequelize.TEXT, allowNull: false },
      status: { type: Sequelize.STRING, allowNull: false, defaultValue: 'New' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 9. Create Coupons table
    await queryInterface.createTable('Coupons', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      code: { type: Sequelize.STRING, allowNull: false, unique: true },
      type: { type: Sequelize.STRING, allowNull: false, defaultValue: 'percentage' },
      value: { type: Sequelize.FLOAT, allowNull: false },
      minOrderAmount: { type: Sequelize.FLOAT, defaultValue: 0 },
      expiryDate: { type: Sequelize.DATE, allowNull: false },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      usageLimit: { type: Sequelize.INTEGER, defaultValue: null },
      usedCount: { type: Sequelize.INTEGER, defaultValue: 0 },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 10. Create FAQs table
    await queryInterface.createTable('FAQs', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      question: { type: Sequelize.STRING, allowNull: false },
      answer: { type: Sequelize.TEXT, allowNull: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 11. Create GeneralSettings table
    await queryInterface.createTable('GeneralSettings', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      storeName: { type: Sequelize.STRING, defaultValue: 'Clarysays' },
      supportEmail: { type: Sequelize.STRING, defaultValue: 'support@Clarysays.com' },
      contactPhone: { type: Sequelize.STRING, defaultValue: '+91 98765 43210' },
      address: { type: Sequelize.JSONB },
      addresses: { type: Sequelize.JSONB, defaultValue: [] },
      socialLinks: { type: Sequelize.JSONB },
      uiLabels: { type: Sequelize.JSONB },
      taxRate: { type: Sequelize.FLOAT, defaultValue: 18 },
      currency: { type: Sequelize.STRING, defaultValue: 'INR' },
      enableReviews: { type: Sequelize.BOOLEAN, defaultValue: true },
      footerLinks: { type: Sequelize.JSONB, defaultValue: [] },
      openingHours: { type: Sequelize.JSONB },
      contactSubjects: { type: Sequelize.JSONB },
      announcement: { type: Sequelize.JSONB },
      productPolicies: { type: Sequelize.JSONB },
      seo: { type: Sequelize.JSONB },
      identity: { type: Sequelize.JSONB },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 12. Create Heritages table
    await queryInterface.createTable('Heritages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: false },
      subtitle: { type: Sequelize.STRING, allowNull: false },
      description: { type: Sequelize.TEXT, allowNull: false },
      image: { type: Sequelize.STRING, allowNull: false },
      link: { type: Sequelize.STRING, defaultValue: '/about' },
      linkText: { type: Sequelize.STRING, defaultValue: 'Read Our Story' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 13. Create HeroSlides table
    await queryInterface.createTable('HeroSlides', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      title: { type: Sequelize.STRING, allowNull: true },
      subtitle: { type: Sequelize.STRING, allowNull: true },
      media: { type: Sequelize.STRING, allowNull: false },
      link: { type: Sequelize.STRING, defaultValue: '/shop' },
      showButton: { type: Sequelize.BOOLEAN, defaultValue: true },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 14. Create MegaMenus table
    await queryInterface.createTable('MegaMenus', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      menuId: { type: Sequelize.STRING, allowNull: false, unique: true },
      categories: { type: Sequelize.JSONB, defaultValue: [] },
      featured: { type: Sequelize.JSONB, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 15. Create Pages table
    await queryInterface.createTable('Pages', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      slug: { type: Sequelize.STRING, allowNull: false, unique: true },
      modules: { type: Sequelize.JSONB, defaultValue: {} },
      seo: { type: Sequelize.JSONB, defaultValue: {} },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
    await queryInterface.addIndex('Pages', ['slug'], { unique: true });

    // 16. Create SocialPosts table
    await queryInterface.createTable('SocialPosts', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      media: { type: Sequelize.STRING, allowNull: false },
      platform: { type: Sequelize.STRING, defaultValue: 'Instagram' },
      link: { type: Sequelize.STRING, defaultValue: '#' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 17. Create StockRequests table
    await queryInterface.createTable('StockRequests', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      productId: { type: Sequelize.UUID, allowNull: false },
      productName: { type: Sequelize.STRING, allowNull: false },
      productImg: { type: Sequelize.STRING, allowNull: false },
      userEmail: { type: Sequelize.STRING, allowNull: false },
      status: { type: Sequelize.STRING, defaultValue: 'Pending' },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 18. Create Testimonials table
    await queryInterface.createTable('Testimonials', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      text: { type: Sequelize.TEXT, allowNull: false },
      author: { type: Sequelize.STRING, allowNull: false },
      role: { type: Sequelize.STRING, defaultValue: 'Customer' },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });

    // 19. Create TrustBadges table
    await queryInterface.createTable('TrustBadges', {
      id: { type: Sequelize.UUID, defaultValue: Sequelize.UUIDV4, primaryKey: true, allowNull: false },
      text: { type: Sequelize.STRING, allowNull: false },
      icon: { type: Sequelize.STRING, allowNull: false },
      order: { type: Sequelize.INTEGER, defaultValue: 0 },
      isActive: { type: Sequelize.BOOLEAN, defaultValue: true },
      createdAt: { type: Sequelize.DATE, allowNull: false },
      updatedAt: { type: Sequelize.DATE, allowNull: false }
    });
  },

  down: async (queryInterface, Sequelize) => {
    await queryInterface.dropTable('TrustBadges');
    await queryInterface.dropTable('Testimonials');
    await queryInterface.dropTable('StockRequests');
    await queryInterface.dropTable('SocialPosts');
    await queryInterface.dropTable('Pages');
    await queryInterface.dropTable('MegaMenus');
    await queryInterface.dropTable('HeroSlides');
    await queryInterface.dropTable('Heritages');
    await queryInterface.dropTable('GeneralSettings');
    await queryInterface.dropTable('FAQs');
    await queryInterface.dropTable('Coupons');
    await queryInterface.dropTable('Contacts');
    await queryInterface.dropTable('Categories');
    await queryInterface.dropTable('Blogs');
    await queryInterface.dropTable('Attributes');
    await queryInterface.dropTable('Orders');
    await queryInterface.dropTable('Products');
    await queryInterface.dropTable('Users');
    await queryInterface.dropTable('Admins');
  }
};
