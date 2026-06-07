const HeroSlide = require('../models/HeroSlide');
const fs = require('fs');
const path = require('path');
const Testimonial = require('../models/Testimonial');
const SocialPost = require('../models/SocialPost');
const Heritage = require('../models/Heritage');
const TrustBadge = require('../models/TrustBadge');
const FAQ = require('../models/FAQ');
const GeneralSetting = require('../models/GeneralSetting');
const Page = require('../models/Page');
const MegaMenu = require('../models/MegaMenu');

// Helper to delete file
const deleteFile = (filePath) => {
  if (!filePath) return;
  // filePath comes as "/uploads/media-..." from DB
  const absolutePath = path.join(__dirname, '..', filePath);
  fs.unlink(absolutePath, (err) => {
    if (err) console.error(`Failed to delete file: ${absolutePath}`, err);
  });
};

// @desc    Get all hero slides
// @route   GET /api/content/hero
// @access  Public
const getHeroSlides = async (req, res) => {
  try {
    const slides = await HeroSlide.find({ isActive: true }).sort({ order: 1 });
    res.json(slides);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a hero slide
// @route   POST /api/content/hero
// @access  Private/Admin
const addHeroSlide = async (req, res) => {
  const { title, subtitle, media, link, order } = req.body;

  try {
    const slide = new HeroSlide({
      title,
      subtitle,
      media,
      link,
      order,
    });

    const createdSlide = await slide.save();
    res.status(201).json(createdSlide);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a hero slide
// @route   DELETE /api/content/hero/:id
// @access  Private/Admin
const deleteHeroSlide = async (req, res) => {
  try {
    const slide = await HeroSlide.findById(req.params.id);

    if (slide) {
      if (slide.media) deleteFile(slide.media);
      await slide.deleteOne();
      res.json({ message: 'Slide removed' });
    } else {
      res.status(404).json({ message: 'Slide not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Update a hero slide
// @route   PUT /api/content/hero/:id
// @access  Private/Admin
const updateHeroSlide = async (req, res) => {
  const { title, subtitle, media, link, order, isActive } = req.body;

  try {
    const slide = await HeroSlide.findById(req.params.id);

    if (slide) {
      // If a new media is provided and it's different from the old one, delete the old file
      if (media && slide.media && media !== slide.media) {
        deleteFile(slide.media);
      }

      slide.title = title || slide.title;
      slide.subtitle = subtitle || slide.subtitle;
      slide.media = media || slide.media;
      slide.link = link !== undefined ? link : slide.link;
      slide.order = order !== undefined ? order : slide.order;
      slide.isActive = isActive !== undefined ? isActive : slide.isActive;

      const updatedSlide = await slide.save();
      res.json(updatedSlide);
    } else {
      res.status(404).json({ message: 'Slide not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};


// @desc    Get all testimonials
// @route   GET /api/content/testimonials
// @access  Public
const getTestimonials = async (req, res) => {
  try {
    const testimonials = await Testimonial.find({ isActive: true });
    res.json(testimonials);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a testimonial
// @route   POST /api/content/testimonials
// @access  Private/Admin
const addTestimonial = async (req, res) => {
  const { text, author, role } = req.body;

  try {
    const testimonial = new Testimonial({
      text,
      author,
      role,
    });

    const createdTestimonial = await testimonial.save();
    res.status(201).json(createdTestimonial);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a testimonial
// @route   DELETE /api/content/testimonials/:id
// @access  Private/Admin
const deleteTestimonial = async (req, res) => {
  try {
    const testimonial = await Testimonial.findById(req.params.id);

    if (testimonial) {
      await testimonial.deleteOne();
      res.json({ message: 'Testimonial removed' });
    } else {
      res.status(404).json({ message: 'Testimonial not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get social feed
// @route   GET /api/content/social
// @access  Public
const getSocialFeed = async (req, res) => {
  try {
    const posts = await SocialPost.find({ isActive: true });
    res.json(posts);
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Add a social post
// @route   POST /api/content/social
// @access  Private/Admin
const addSocialPost = async (req, res) => {
  const { media, platform, link } = req.body;

  try {
    const post = new SocialPost({
      media,
      platform,
      link,
    });

    const createdPost = await post.save();
    res.status(201).json(createdPost);
  } catch (error) {
    res.status(400).json({ message: error.message });
  }
};

// @desc    Delete a social post
// @route   DELETE /api/content/social/:id
// @access  Private/Admin
const deleteSocialPost = async (req, res) => {
  try {
    const post = await SocialPost.findById(req.params.id);

    if (post) {
      if (post.media) deleteFile(post.media);
      await post.deleteOne();
      res.json({ message: 'Post removed' });
    } else {
      res.status(404).json({ message: 'Post not found' });
    }
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

// @desc    Get heritage content (singleton)
// @route   GET /api/content/heritage
// @access  Public
const getHeritage = async (req, res) => {
    try {
        const heritage = await Heritage.getSingleton();
        res.json(heritage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update heritage content
// @route   PUT /api/content/heritage
// @access  Private/Admin
const updateHeritage = async (req, res) => {
    try {
        const heritage = await Heritage.getSingleton();
        const { title, subtitle, description, image, link, linkText } = req.body;

        heritage.title = title || heritage.title;
        heritage.subtitle = subtitle || heritage.subtitle;
        heritage.description = description || heritage.description;
        heritage.image = image || heritage.image;
        heritage.link = link || heritage.link;
        heritage.linkText = linkText || heritage.linkText;

        const updatedHeritage = await heritage.save();
        res.json(updatedHeritage);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get trust badges
// @route   GET /api/content/trust-badges
// @access  Public
const getTrustBadges = async (req, res) => {
    try {
        const badges = await TrustBadge.find({ isActive: true }).sort({ order: 1 });
        res.json(badges);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add trust badge
// @route   POST /api/content/trust-badges
// @access  Private/Admin
const addTrustBadge = async (req, res) => {
    const { text, icon, order } = req.body;
    try {
        const badge = new TrustBadge({ text, icon, order });
        const createdBadge = await badge.save();
        res.status(201).json(createdBadge);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete trust badge
// @route   DELETE /api/content/trust-badges/:id
// @access  Private/Admin
const deleteTrustBadge = async (req, res) => {
    try {
        const badge = await TrustBadge.findById(req.params.id);
        if (badge) {
            await badge.deleteOne();
            res.json({ message: 'Badge removed' });
        } else {
            res.status(404).json({ message: 'Badge not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};


// ==================================================================================
// FAQ CONTROLLERS
// ==================================================================================

// @desc    Get FAQs
// @route   GET /api/content/faq
// @access  Public
const getFAQs = async (req, res) => {
    try {
        const faqs = await FAQ.find({ isActive: true }).sort({ order: 1, createdAt: -1 });
        res.json(faqs);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Add FAQ
// @route   POST /api/content/faq
// @access  Private/Admin
const addFAQ = async (req, res) => {
    const { question, answer, order } = req.body;
    try {
        const faq = new FAQ({ question, answer, order });
        const createdFAQ = await faq.save();
        res.status(201).json(createdFAQ);
    } catch (error) {
        res.status(400).json({ message: error.message });
    }
};

// @desc    Delete FAQ
// @route   DELETE /api/content/faq/:id
// @access  Private/Admin
const deleteFAQ = async (req, res) => {
    try {
        const faq = await FAQ.findById(req.params.id);
        if (faq) {
            await faq.deleteOne();
            res.json({ message: 'FAQ removed' });
        } else {
            res.status(404).json({ message: 'FAQ not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// ==================================================================================
// SETTINGS CONTROLLERS
// ==================================================================================

// @desc    Get general settings
// @route   GET /api/content/settings
// @access  Public
const getSettings = async (req, res) => {
    try {
        const settings = await GeneralSetting.getSingleton();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update general settings
// @route   PUT /api/content/settings
// @access  Private/Admin
const updateSettings = async (req, res) => {
    try {
        const settings = await GeneralSetting.getSingleton();
        
        // Update fields if they exist in request body
        // We use spread/assign or manual check to avoid overwriting with null
        // Since it's a settings object, we might want to allow partial updates deeply, 
        // but for now, simple top-level updates.
        
        if (req.body.storeName) settings.storeName = req.body.storeName;
        if (req.body.supportEmail) settings.supportEmail = req.body.supportEmail;
        if (req.body.contactPhone) settings.contactPhone = req.body.contactPhone;
        if (req.body.taxRate) settings.taxRate = req.body.taxRate;
        if (req.body.currency) settings.currency = req.body.currency;
        if (req.body.enableReviews !== undefined) settings.enableReviews = req.body.enableReviews;
        
        // Deep objects update - simple merge
        if (req.body.address) {
            settings.address = { ...settings.address, ...req.body.address };
        }
        if (req.body.addresses) {
            settings.addresses = req.body.addresses;
        }
        if (req.body.socialLinks) {
            settings.socialLinks = { ...settings.socialLinks, ...req.body.socialLinks };
        }

        // Consolidated Settings Updates
        if (req.body.footerLinks) settings.footerLinks = req.body.footerLinks;
        if (req.body.openingHours) settings.openingHours = req.body.openingHours;
        if (req.body.contactSubjects) settings.contactSubjects = req.body.contactSubjects;
        if (req.body.announcement) settings.announcement = { ...settings.announcement, ...req.body.announcement };
        if (req.body.productPolicies) settings.productPolicies = { ...settings.productPolicies, ...req.body.productPolicies };
        if (req.body.seo) settings.seo = { ...settings.seo, ...req.body.seo };
        if (req.body.identity) settings.identity = { ...settings.identity, ...req.body.identity };
        if (req.body.uiLabels) settings.uiLabels = req.body.uiLabels;

        const updatedSettings = await settings.save();
        res.json(updatedSettings);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};



const { successResponse } = require('../utils/responseHelper');

// @desc    Get Page by Slug
// @route   GET /api/content/pages/:slug
// @access  Public
const getPage = async (req, res) => {
    try {
        const page = await Page.findOne({ slug: req.params.slug });
        // If not found, return null or an empty object structure, don't 404 so frontend can handle graceful fallback
        if (!page) {
             return successResponse(res, { slug: req.params.slug, modules: {} });
        }
        successResponse(res, page);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update Page
// @route   PUT /api/content/pages/:slug
// @access  Private/Admin
const updatePage = async (req, res) => {
    try {
        const { modules, seo } = req.body;
        
        let page = await Page.findOne({ slug: req.params.slug });

        if (page) {
            if (modules) {
                page.modules = modules;
                page.markModified('modules');
            }
            if (seo) page.seo = seo;
            
            const updatedPage = await page.save();
            res.json(updatedPage);
        } else {
            // Create if doesn't exist
            page = await Page.create({
                slug: req.params.slug,
                modules: modules || {},
                seo: seo || {}
            });
            res.status(201).json(page);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// --- Mega Menu ---
const getMegaMenusList = async (req, res) => {
    try {
        // Return only the menuIds
        const menus = await MegaMenu.find({}).select('menuId -_id');
        res.json(menus.map(m => m.menuId));
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const getMegaMenu = async (req, res) => {
    try {
        const { id } = req.params; // menuId e.g. 'New Arrivals'
        // Find by menuId not _id
        let menu = await MegaMenu.findOne({ menuId: id });
        
        // If not found, return empty structure or null
        // Optionally, if it doesn't exist, we could return a 404, but for this use case 
        // returning null lets the frontend fallback to hardcoded data initially.
        if (!menu) {
             return res.status(404).json({ message: 'Menu not found' });
        }
        res.json(menu);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

const updateMegaMenu = async (req, res) => {
    try {
        const { id } = req.params; // menuId
        const { categories, featured } = req.body;

        let menu = await MegaMenu.findOne({ menuId: id });

        if (menu) {
            menu.categories = categories || menu.categories;
            menu.featured = featured || menu.featured;
            const updatedMenu = await menu.save();
            res.json(updatedMenu);
        } else {
            // Create new if doesn't exist
            const newMenu = await MegaMenu.create({
                menuId: id,
                categories,
                featured
            });
            res.status(201).json(newMenu);
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
  getHeroSlides,
  addHeroSlide,
  updateHeroSlide,
  deleteHeroSlide,
  getTestimonials,
  addTestimonial,
  deleteTestimonial,
  getSocialFeed,
  addSocialPost,
  deleteSocialPost,
  getHeritage,
  updateHeritage,
  getTrustBadges,
  addTrustBadge,
  deleteTrustBadge,
  // FAQ
  getFAQs,
  addFAQ,
  deleteFAQ,
  // Settings
  getSettings,
  updateSettings,
  // Pages
  getPage,
  updatePage,
  // Mega Menu
  getMegaMenusList,
  getMegaMenu,
  updateMegaMenu
};
