const xss = require('xss-clean/lib/xss');
const mongoSanitize = require('express-mongo-sanitize');

/**
 * Custom XSS Clean Middleware for Express 5
 * Express 5 makes req.query a getter, so we cannot reassign it (req.query = ...).
 * We must mutate the properties in place.
 */
const xssClean = (req, res, next) => {
    if (req.body) req.body = xss.clean(req.body);
    if (req.params) req.params = xss.clean(req.params);
    
    if (req.query) {
        const cleaned = xss.clean(req.query);
        
        // Remove all properties from original query object
        for (const key in req.query) {
            delete req.query[key];
        }
        
        // Copy cleaned properties back to original query object
        if (cleaned && typeof cleaned === 'object') {
            Object.assign(req.query, cleaned);
        }
    }
    
    next();
};

/**
 * Custom Mongo Sanitize Middleware for Express 5
 * express-mongo-sanitize's default middleware tries to reassign req.query, which fails.
 * However, its .sanitize() method mutates in-place, so we just call that.
 */
const mongoSanitizer = (req, res, next) => {
    ['body', 'params', 'headers', 'query'].forEach((key) => {
        if (req[key]) {
            mongoSanitize.sanitize(req[key]);
        }
    });
    next();
};

module.exports = { xssClean, mongoSanitizer };
