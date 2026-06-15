const express = require('express');
const router = express.Router();
const {
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
  getFAQs,
  addFAQ,
  deleteFAQ,
  getSettings,
  updateSettings,
  getPage,
  updatePage,
  getMegaMenusList,
  getMegaMenu,
  updateMegaMenu
} = require('../controllers/contentController');
const { admin, protectAdmin, protectPublic } = require('../middleware/authMiddleware');

router.route('/hero').get(protectPublic, getHeroSlides).post(protectAdmin, admin, addHeroSlide);
router.route('/hero/:id')
  .put(protectAdmin, admin, updateHeroSlide)
  .delete(protectAdmin, admin, deleteHeroSlide);

router.route('/testimonials').get(protectPublic, getTestimonials).post(protectAdmin, admin, addTestimonial);
router.route('/testimonials/:id').delete(protectAdmin, admin, deleteTestimonial);

router.route('/social').get(protectPublic, getSocialFeed).post(protectAdmin, admin, addSocialPost);
router.route('/social/:id').delete(protectAdmin, admin, deleteSocialPost);

router.route('/heritage').get(protectPublic, getHeritage).put(protectAdmin, admin, updateHeritage);

router.route('/trust-badges').get(protectPublic, getTrustBadges).post(protectAdmin, admin, addTrustBadge);
router.route('/trust-badges/:id').delete(protectAdmin, admin, deleteTrustBadge);

router.route('/faq').get(protectPublic, getFAQs).post(protectAdmin, admin, addFAQ);
router.route('/faq/:id').delete(protectAdmin, admin, deleteFAQ);

router.route('/settings').get(protectPublic, getSettings).put(protectAdmin, admin, updateSettings);

router.route('/pages/:slug').get(protectPublic, getPage).put(protectAdmin, admin, updatePage);

router.route('/mega-menu').get(protectPublic, getMegaMenusList);
router.route('/mega-menu/:id').get(protectPublic, getMegaMenu).put(protectAdmin, admin, updateMegaMenu);

module.exports = router;
