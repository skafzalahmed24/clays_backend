const Admin = require('../models/Admin');
const jwt = require('jsonwebtoken');
const { generateAccessToken, generateRefreshToken } = require('../utils/generateToken');
const { Op } = require('sequelize');

// @desc    Auth admin & get token
// @route   POST /api/admin/login
// @access  Public
const loginAdmin = async (req, res) => {
    const { email, password } = req.body;

    try {
        const admin = await Admin.findOne({ where: { email: email ? email.toLowerCase() : '' } });

        if (admin && (await admin.matchPassword(password))) {
            // Generate Refresh Token
            const refreshToken = generateRefreshToken(res, admin.id);

            res.json({
                _id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                token: generateAccessToken(admin.id),
                refreshToken,
            });
        } else {
            res.status(401).json({ message: 'Invalid email or password' });
        }
    } catch (_error) {
        res.status(500).json({ message: _error.message });
    }
};

// @desc    Register a new admin
// @route   POST /api/admin
// @access  Private/SuperAdmin (Initially public for seeding/setup if needed, but best restricted)
const registerAdmin = async (req, res) => {
    const { name, email, password } = req.body;

    try {
        const adminExists = await Admin.findOne({ where: { email: email ? email.toLowerCase() : '' } });

        if (adminExists) {
            res.status(400);
            throw new Error('Admin already exists');
        }

        const admin = await Admin.create({
            name,
            email,
            password,
        });

        if (admin) {
            // Generate Refresh Token
            const refreshToken = generateRefreshToken(res, admin.id);

            res.status(201).json({
                _id: admin.id,
                name: admin.name,
                email: admin.email,
                role: admin.role,
                token: generateAccessToken(admin.id),
                refreshToken,
            });
        } else {
            res.status(400);
            throw new Error('Invalid admin data');
        }
    } catch (_error) {
        res.status(500).json({ message: _error.message });
    }
};

// @desc    Logout admin / clear cookie
// @route   POST /api/admin/logout
// @access  Public
const logoutAdmin = (req, res) => {
    res.status(200).json({ 
        status: 1,
        message: 'Logged out successfully',
        data: null
    });
};

// @desc    Get new access token using refresh token (Admin)
// @route   POST /api/admin/refresh
// @access  Public
const refreshToken = async (req, res) => {
    const { refreshToken: token } = req.body; // Expecting refreshToken in body

    if (!token) {
        return res.status(401).json({ message: 'Not authorized, no refresh token' });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);
        // Check if admin exists
        const admin = await Admin.findByPk(decoded.id);
        if (!admin) {
             return res.status(401).json({ message: 'Not authorized, admin not found' });
        }

        const accessToken = generateAccessToken(decoded.id);

        res.json({
            status: 1,
            message: 'success',
            data: { token: accessToken }
        });

    } catch {
        res.status(401).json({ message: 'Not authorized, token failed' });
    }
};

// @desc    Forgot Password (Admin)
// @route   POST /api/admin/forgot-password
// @access  Public
const forgotPasswordAdmin = async (req, res) => {
    const { email } = req.body;

    try {
        const admin = await Admin.findOne({ where: { email: email ? email.toLowerCase() : '' } });

        if (!admin) {
            res.status(404).json({ message: 'Admin not found' });
            return;
        }

        const otp = '123456'; 
        
        admin.otp = otp;
        admin.otpExpires = new Date(Date.now() + 10 * 60 * 1000); // 10 mins

        await admin.save();

        // Send Email
        try {
            const { sendEmail } = require('../utils/emailService');
            // Reuse email service
            await sendEmail({
                email: admin.email,
                subject: 'Admin Password Reset OTP',
                message: `Your OTP for admin password reset is: ${otp}`
            });
            
            res.status(200).json({ message: 'OTP sent to email' });
        } catch {
             admin.otp = null;
             admin.otpExpires = null;
             await admin.save();
             res.status(500).json({ message: 'Email could not be sent' });
        }

    } catch (_error) {
        res.status(500).json({ message: _error.message });
    }
};

// @desc    Reset Password (Admin)
// @route   POST /api/admin/reset-password
// @access  Public
const resetPasswordAdmin = async (req, res) => {
    const { email, otp, newPassword } = req.body;

    try {
        const admin = await Admin.findOne({
            where: {
                email: email ? email.toLowerCase() : '',
                otp,
                otpExpires: { [Op.gt]: new Date() },
            }
        });

        if (!admin) {
            res.status(400).json({ message: 'Invalid OTP or expired' });
            return;
        }

        admin.password = newPassword;
        admin.otp = null;
        admin.otpExpires = null;

        await admin.save();

        res.status(200).json({ message: 'Password reset successful' });
    } catch (_error) {
        res.status(500).json({ message: _error.message });
    }
};

module.exports = {
    loginAdmin,
    registerAdmin,
    logoutAdmin,
    refreshToken,
    forgotPasswordAdmin,
    resetPasswordAdmin
};
