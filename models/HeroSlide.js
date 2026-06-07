const mongoose = require('mongoose');

const heroSlideSchema = mongoose.Schema({
  title: {
    type: String,
    required: true,
  },
  subtitle: {
    type: String,
    required: true,
  },
  media: {
    type: String,
    required: true,
  },
  link: {
    type: String,
    default: '/shop',
  },
  order: {
    type: Number,
    default: 0,
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('HeroSlide', heroSlideSchema);
