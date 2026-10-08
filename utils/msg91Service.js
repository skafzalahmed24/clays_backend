const axios = require('axios');

/**
 * MSG91 Service configuration and helper methods.
 * Strictly enforces Indian (+91) phone numbers as per requirements.
 */

const MSG91_BASE_URL = 'https://control.msg91.com/api/v5';

/**
 * Validates and formats Indian mobile numbers (+91 only).
 * Valid formats include:
 *  - 10-digit Indian number: e.g., '9876543210' (starts with 6, 7, 8, 9)
 *  - With +91: e.g., '+919876543210', '+91 98765 43210'
 *  - With 91: e.g., '919876543210'
 *  - With leading 0: e.g., '09876543210'
 *
 * @param {string} phone 
 * @returns {{ isValid: boolean, error?: string, rawDigits?: string, internationalNumber?: string, formattedNumber?: string }}
 */
const validateAndFormatIndianMobile = (phone) => {
    if (!phone || typeof phone !== 'string') {
        return { isValid: false, error: 'Phone number is required' };
    }

    // Clean whitespace, dashes, parentheses
    const cleaned = phone.trim().replace(/[\s\-()]/g, '');

    // Check for non-Indian international prefixes (+1, +44, etc.)
    if (cleaned.startsWith('+') && !cleaned.startsWith('+91')) {
        return {
            isValid: false,
            error: 'Only Indian phone numbers with country code +91 are supported'
        };
    }

    // Extract digits only
    let digits = cleaned.replace(/\D/g, '');

    // Normalize +91 / 91 / 0 prefix
    if (digits.length === 12 && digits.startsWith('91')) {
        digits = digits.substring(2);
    } else if (digits.length === 11 && digits.startsWith('0')) {
        digits = digits.substring(1);
    }

    // Standard Indian mobile number validation: exactly 10 digits starting with 6, 7, 8, or 9
    if (!/^[6-9]\d{9}$/.test(digits)) {
        return {
            isValid: false,
            error: 'Invalid Indian mobile number. Must be a valid 10-digit number starting with 6, 7, 8, or 9'
        };
    }

    return {
        isValid: true,
        rawDigits: digits, // e.g. "9876543210"
        internationalNumber: `91${digits}`, // "919876543210" for MSG91 API
        formattedNumber: `+91 ${digits.slice(0, 5)} ${digits.slice(5)}` // "+91 98765 43210" for display
    };
};

/**
 * Checks if a given phone number is a valid Indian mobile number.
 * @param {string} phone 
 * @returns {boolean}
 */
const isIndianPhoneNumber = (phone) => {
    return validateAndFormatIndianMobile(phone).isValid;
};

/**
 * Send OTP via MSG91 v5 OTP API.
 * Endpoint: POST https://control.msg91.com/api/v5/otp
 * 
 * @param {Object} options
 * @param {string} options.phone - Recipient phone number (strictly Indian +91)
 * @param {string} [options.otp] - Optional custom 6-digit OTP to send (if omitted, MSG91 generates one)
 * @param {string} [options.templateId] - Optional MSG91 OTP Template ID (defaults to process.env.MSG91_TEMPLATE_ID)
 * @param {number} [options.otpExpiry] - Expiry in minutes (default 10)
 * @param {number} [options.otpLength] - Length of OTP (default 6)
 * @param {Object} [options.extraParams] - Dynamic template variables (e.g. { company_name: 'Clarysays' })
 */
const sendMsg91Otp = async ({
    phone,
    otp,
    templateId,
    otpExpiry = 10,
    otpLength = 6,
    extraParams = {}
}) => {
    // 1. Validate Indian phone number
    const validation = validateAndFormatIndianMobile(phone);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }

    const targetTemplateId = templateId || process.env.MSG91_TEMPLATE_ID;
    const authKey = process.env.MSG91_AUTH_KEY;
    const mobile = validation.internationalNumber; // e.g. '919876543210'

    // 2. Static OTP mode check (OTP_STATUS=false in .env)
    if (String(process.env.OTP_STATUS).trim().toLowerCase() === 'false') {
        const staticCode = process.env.STATIC_OTP || '123456';
        console.log(`[MSG91 OTP Service - STATIC MODE] OTP_STATUS=false. Static OTP ${staticCode} active for ${validation.formattedNumber}.`);
        return {
            success: true,
            isMock: true,
            isStatic: true,
            message: `OTP sent successfully (Static mode: ${staticCode})`,
            mobile: validation.internationalNumber,
            formattedMobile: validation.formattedNumber,
            otp: staticCode
        };
    }

    // 3. Fallback / Mock mode when MSG91 credentials are not yet set in .env or during local testing
    if (!authKey || authKey === 'your_msg91_auth_key_here') {
        console.warn(`[MSG91 OTP Service - DEV/MOCK] OTP for ${validation.formattedNumber}: ${otp || 'MSG91_AUTO_GEN'}`);
        console.warn(`[MSG91 OTP Service] Warning: MSG91_AUTH_KEY is not configured in .env. Falling back to local simulation.`);
        return {
            success: true,
            isMock: true,
            message: `OTP sent successfully (Dev simulation to ${validation.formattedNumber})`,
            mobile: validation.internationalNumber,
            formattedMobile: validation.formattedNumber,
            otp: otp || null
        };
    }

    // 4. Send request to MSG91 v5 OTP API
    try {
        const queryParams = new URLSearchParams({
            template_id: targetTemplateId || '',
            mobile: mobile,
            otp_expiry: String(process.env.MSG91_OTP_EXPIRY || otpExpiry),
            otp_length: String(process.env.MSG91_OTP_LENGTH || otpLength)
        });

        if (otp) {
            queryParams.append('otp', String(otp));
        }

        const url = `${MSG91_BASE_URL}/otp?${queryParams.toString()}`;

        const response = await axios.post(
            url,
            extraParams, // Body can contain template variables
            {
                headers: {
                    authkey: authKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        if (response.data && (response.data.type === 'success' || response.status === 200)) {
            return {
                success: true,
                message: response.data.message || 'OTP sent successfully',
                data: response.data,
                mobile: validation.internationalNumber,
                formattedMobile: validation.formattedNumber
            };
        }

        throw new Error(response.data?.message || 'Failed to send OTP via MSG91');
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('[MSG91 OTP Service Error]:', errorMsg);

        // If in development mode, don't crash the user experience
        if (process.env.NODE_ENV !== 'production') {
            console.warn(`[MSG91 Dev Fallback] Simulating success for dev testing despite API error: ${errorMsg}`);
            return {
                success: true,
                isMock: true,
                message: `OTP simulated in dev (${errorMsg})`,
                mobile: validation.internationalNumber,
                formattedMobile: validation.formattedNumber,
                otp: otp || null
            };
        }

        throw new Error(`MSG91 OTP delivery failed: ${errorMsg}`);
    }
};

/**
 * Verify OTP using MSG91 v5 Verify API.
 * Endpoint: GET https://control.msg91.com/api/v5/otp/verify?otp=...&mobile=...
 * 
 * @param {Object} options
 * @param {string} options.phone - Recipient Indian phone number
 * @param {string} options.otp - OTP entered by user
 */
const verifyMsg91Otp = async ({ phone, otp }) => {
    const validation = validateAndFormatIndianMobile(phone);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }

    if (!otp) {
        throw new Error('OTP is required for verification');
    }

    // Static OTP mode check
    if (String(process.env.OTP_STATUS).trim().toLowerCase() === 'false') {
        const staticCode = process.env.STATIC_OTP || '123456';
        if (String(otp).trim() === staticCode) {
            console.log(`[MSG91 OTP Service - STATIC MODE] Static OTP ${otp} verified for ${validation.formattedNumber}`);
            return {
                success: true,
                isMock: true,
                isStatic: true,
                message: 'OTP verified successfully (Static mode)',
                mobile: validation.internationalNumber
            };
        }
        throw new Error(`Invalid OTP. In static mode, please use ${staticCode}`);
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const mobile = validation.internationalNumber;

    // Dev/Mock mode check
    if (!authKey || authKey === 'your_msg91_auth_key_here') {
        console.log(`[MSG91 OTP Service - DEV/MOCK] Verifying OTP ${otp} for ${validation.formattedNumber}`);
        return {
            success: true,
            isMock: true,
            message: 'OTP verified (Dev simulation)',
            mobile: validation.internationalNumber
        };
    }

    try {
        const url = `${MSG91_BASE_URL}/otp/verify?otp=${encodeURIComponent(otp)}&mobile=${encodeURIComponent(mobile)}`;

        const response = await axios.get(url, {
            headers: {
                authkey: authKey
            },
            timeout: 10000
        });

        if (response.data && (response.data.type === 'success' || response.data.message === 'OTP verified success' || response.status === 200)) {
            return {
                success: true,
                message: response.data.message || 'OTP verified successfully',
                data: response.data
            };
        }

        throw new Error(response.data?.message || 'Invalid or expired OTP');
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('[MSG91 OTP Verify Error]:', errorMsg);
        throw new Error(errorMsg || 'OTP verification failed');
    }
};

/**
 * Resend/Retry OTP via MSG91 v5 Retry API.
 * Endpoint: GET https://control.msg91.com/api/v5/otp/retry?authkey=...&mobile=...&retrytype=...
 * 
 * @param {Object} options
 * @param {string} options.phone - Recipient Indian phone number
 * @param {'text'|'voice'} [options.retryType='text'] - 'text' for SMS or 'voice' for call
 */
const resendMsg91Otp = async ({ phone, retryType = 'text' }) => {
    const validation = validateAndFormatIndianMobile(phone);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }

    // Static mode check
    if (String(process.env.OTP_STATUS).trim().toLowerCase() === 'false') {
        const staticCode = process.env.STATIC_OTP || '123456';
        console.log(`[MSG91 OTP Service - STATIC MODE] Resending static OTP ${staticCode} to ${validation.formattedNumber}`);
        return {
            success: true,
            isMock: true,
            isStatic: true,
            message: `Static OTP resent successfully (${staticCode})`
        };
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    const mobile = validation.internationalNumber;

    if (!authKey || authKey === 'your_msg91_auth_key_here') {
        console.log(`[MSG91 OTP Service - DEV/MOCK] Resending OTP via ${retryType} to ${validation.formattedNumber}`);
        return {
            success: true,
            isMock: true,
            message: `OTP resent successfully via ${retryType} (Dev simulation)`
        };
    }

    try {
        const url = `${MSG91_BASE_URL}/otp/retry?authkey=${encodeURIComponent(authKey)}&mobile=${encodeURIComponent(mobile)}&retrytype=${encodeURIComponent(retryType)}`;

        const response = await axios.get(url, {
            headers: {
                authkey: authKey
            },
            timeout: 10000
        });

        if (response.data && (response.data.type === 'success' || response.status === 200)) {
            return {
                success: true,
                message: response.data.message || 'OTP resent successfully',
                data: response.data
            };
        }

        throw new Error(response.data?.message || 'Failed to resend OTP');
    } catch (error) {
        const errorMsg = error.response?.data?.message || error.message;
        console.error('[MSG91 OTP Resend Error]:', errorMsg);
        throw new Error(errorMsg || 'Failed to resend OTP');
    }
};

/**
 * Send general transactional SMS via MSG91 (e.g., order confirmation, shipment update).
 * 
 * @param {Object} options
 * @param {string} options.phone - Recipient Indian mobile number (+91)
 * @param {string} options.templateId - DLT registered SMS template ID / Flow ID
 * @param {Object} [options.variables] - Template variables
 */
const sendMsg91SMS = async ({ phone, templateId, variables = {} }) => {
    const validation = validateAndFormatIndianMobile(phone);
    if (!validation.isValid) {
        throw new Error(validation.error);
    }

    const authKey = process.env.MSG91_AUTH_KEY;
    if (!authKey || authKey === 'your_msg91_auth_key_here') {
        console.log(`[MSG91 SMS Service - DEV/MOCK] SMS to ${validation.formattedNumber} with variables:`, variables);
        return { success: true, isMock: true };
    }

    try {
        const payload = {
            template_id: templateId,
            recipients: [
                {
                    mobiles: validation.internationalNumber,
                    ...variables
                }
            ]
        };

        const response = await axios.post(
            `${MSG91_BASE_URL}/flow`,
            payload,
            {
                headers: {
                    authkey: authKey,
                    'Content-Type': 'application/json'
                },
                timeout: 10000
            }
        );

        return {
            success: true,
            data: response.data
        };
    } catch (error) {
        console.error('[MSG91 SMS Error]:', error.response?.data?.message || error.message);
        return {
            success: false,
            error: error.message
        };
    }
};

module.exports = {
    validateAndFormatIndianMobile,
    isIndianPhoneNumber,
    sendMsg91Otp,
    verifyMsg91Otp,
    resendMsg91Otp,
    sendMsg91SMS
};
