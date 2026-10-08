/**
 * OTP Configuration & Generation Helper
 *
 * Controls whether OTP is dynamic (generated randomly and dispatched via MSG91/Email)
 * or static (fixed to 123456 for development/testing).
 *
 * Controlled via .env:
 *   OTP_STATUS=false  -> Static OTP (123456)
 *   OTP_STATUS=true   -> Dynamic 6-digit OTP via MSG91 SMS & Email
 */

const isDynamicOtp = () => {
    return String(process.env.OTP_STATUS).trim().toLowerCase() === 'true';
};

const getStaticOtp = () => {
    return process.env.STATIC_OTP || '123456';
};

const generateOTP = () => {
    if (!isDynamicOtp()) {
        const staticCode = getStaticOtp();
        console.log(`[OTP Mode: STATIC] OTP_STATUS is false. Using static OTP: ${staticCode}`);
        return staticCode;
    }
    const dynamicCode = Math.floor(100000 + Math.random() * 900000).toString();
    console.log(`[OTP Mode: DYNAMIC] OTP_STATUS is true. Generated dynamic OTP: ${dynamicCode}`);
    return dynamicCode;
};

/**
 * Validates OTP against stored value and expiration, or accepts static OTP if OTP_STATUS=false.
 * 
 * @param {string} enteredOtp - OTP provided in request
 * @param {string} storedOtp - OTP stored in database
 * @param {Date|string} otpExpireDate - Expiration timestamp
 * @returns {boolean}
 */
const isOtpValid = (enteredOtp, storedOtp, otpExpireDate) => {
    if (!enteredOtp) return false;

    const trimmedInput = String(enteredOtp).trim();

    // 1. In static mode, always validate against static OTP
    if (!isDynamicOtp()) {
        const staticCode = getStaticOtp();
        if (trimmedInput === staticCode) {
            return true;
        }
    }

    // 2. Standard DB OTP check with expiration
    if (storedOtp && trimmedInput === String(storedOtp).trim()) {
        if (!otpExpireDate) return true;
        const expireTime = new Date(otpExpireDate).getTime();
        if (!isNaN(expireTime) && expireTime > Date.now()) {
            return true;
        }
    }

    return false;
};

module.exports = {
    isDynamicOtp,
    getStaticOtp,
    generateOTP,
    isOtpValid
};
