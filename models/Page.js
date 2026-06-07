const mongoose = require('mongoose');

const pageSchema = mongoose.Schema({
    slug: {
        type: String,
        required: true,
        unique: true,
        index: true
    },
    modules: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    },
    seo: {
        title: { type: String },
        description: { type: String }
    }
}, {
    timestamps: true
});

const Page = mongoose.model('Page', pageSchema);

module.exports = Page;
