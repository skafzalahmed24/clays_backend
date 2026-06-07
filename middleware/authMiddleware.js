const jwt = require('jsonwebtoken');
const User = require('../models/User');

const protect = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            // Get token from header
            token = req.headers.authorization.split(' ')[1];

            // Verify token
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Get user from the token
            req.user = await User.findById(decoded.id).select('-password');

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
};

const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(401).json({ message: 'Not authorized as an admin' });
    }
};

const protectAdmin = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        try {
            token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            
            // Check Admin collection specificially
            const Admin = require('../models/Admin');
            req.user = await Admin.findById(decoded.id).select('-password');

            if (!req.user) {
                 return res.status(401).json({ message: 'Not authorized, admin not found' });
            }

            next();
        } catch (error) {
            console.error(error);
            return res.status(401).json({ message: 'Not authorized as admin, token failed' });
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized as admin, no token' });
    }
};

const protectPublic = async (req, res, next) => {
    let token;

    if (
        req.headers.authorization &&
        req.headers.authorization.startsWith('Bearer')
    ) {
        token = req.headers.authorization.split(' ')[1];

        // 1. Check if it matches the default public token
        if (process.env.DEFAULT_PUBLIC_TOKEN && token === process.env.DEFAULT_PUBLIC_TOKEN) {
            req.user = { role: 'public' }; // or just allow access
            return next();
        }

        // 2. If not public token, try to verify as a user token
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            req.user = await User.findById(decoded.id).select('-password');
             if (!req.user) {
                 // Try Admin if user not found (admins should also be able to view public data)
                 const Admin = require('../models/Admin');
                 req.user = await Admin.findById(decoded.id).select('-password');
            }
             
            if (req.user) {
                return next();
            }
        } catch (error) {
            // Token invalid or expired
            console.error('Public protect error:', error.message);
        }
    }

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no token' });
    }
    
    // If we have a token but it failed both checks
    return res.status(401).json({ message: 'Not authorized, invalid token' });
};

module.exports = { protect, admin, protectAdmin, protectPublic };
