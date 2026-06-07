const jwt = require('jsonwebtoken');

const generateAccessToken = (id) => {
    return jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '15m', // Short-lived
    });
};

const generateRefreshToken = (res, id) => {
    const refreshToken = jwt.sign({ id }, process.env.JWT_SECRET, {
        expiresIn: '7d', // Long-lived
    });

    return refreshToken;
};

const clearRefreshToken = (res, cookieName = 'jwt') => {
    const secure = process.env.COOKIE_SECURE === 'true';
    const sameSite = process.env.SameSite || undefined;

    res.cookie(cookieName, '', {
         httpOnly: true,
         expires: new Date(0),
         secure,
         sameSite,
    });
}

module.exports = { generateAccessToken, generateRefreshToken, clearRefreshToken };
