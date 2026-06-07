const mongoose = require('mongoose');

const socialPostSchema = mongoose.Schema({
  media: {
    type: String,
    required: true,
  },
  platform: {
    type: String,
    default: 'Instagram',
  },
  link: {
    type: String,
    default: '#',
  },
  isActive: {
    type: Boolean,
    default: true,
  }
}, {
  timestamps: true,
});

module.exports = mongoose.model('SocialPost', socialPostSchema);
