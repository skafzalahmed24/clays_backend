require('dotenv').config();
const {
    validateAndFormatIndianMobile,
    isIndianPhoneNumber,
    sendMsg91Otp,
    verifyMsg91Otp,
    resendMsg91Otp
} = require('../utils/msg91Service');

async function runTests() {
    console.log('=== 1. Testing Indian Phone (+91) Validation ===');

    const testCases = [
        { input: '+919876543210', expectedValid: true, desc: 'Standard +91 format' },
        { input: '+91 98765 43210', expectedValid: true, desc: '+91 with spaces' },
        { input: '9876543210', expectedValid: true, desc: '10-digit Indian number' },
        { input: '09876543210', expectedValid: true, desc: 'Leading 0 format' },
        { input: '919876543210', expectedValid: true, desc: '91 prefix without plus' },
        { input: '+14155552671', expectedValid: false, desc: 'USA country code (+1)' },
        { input: '+447911123456', expectedValid: false, desc: 'UK country code (+44)' },
        { input: '+971501234567', expectedValid: false, desc: 'UAE country code (+971)' },
        { input: '5555555555', expectedValid: false, desc: 'Indian number not starting with 6-9' },
        { input: '12345', expectedValid: false, desc: 'Too short' },
        { input: '', expectedValid: false, desc: 'Empty string' }
    ];

    let passed = 0;
    for (const tc of testCases) {
        const result = validateAndFormatIndianMobile(tc.input);
        const isValid = result.isValid;
        const boolCheck = isIndianPhoneNumber(tc.input);
        const matches = isValid === tc.expectedValid && boolCheck === tc.expectedValid;
        if (matches) {
            passed++;
            console.log(`✓ [PASS] ${tc.desc} ("${tc.input}") -> Valid: ${isValid} ${isValid ? `(${result.internationalNumber})` : `(Error: ${result.error})`}`);
        } else {
            console.error(`✗ [FAIL] ${tc.desc} ("${tc.input}") -> Expected: ${tc.expectedValid}, Got: ${isValid}`);
        }
    }

    console.log(`\nValidation test results: ${passed}/${testCases.length} passed.`);

    console.log('\n=== 2. Testing MSG91 Send OTP ===');
    try {
        const sendResult = await sendMsg91Otp({
            phone: '+919876543210',
            otp: '654321'
        });
        console.log('Send OTP result:', sendResult);
    } catch (e) {
        console.error('Send OTP error:', e.message);
    }

    console.log('\n=== 3. Testing MSG91 Resend OTP ===');
    try {
        const resendResult = await resendMsg91Otp({
            phone: '9876543210',
            retryType: 'text'
        });
        console.log('Resend OTP result:', resendResult);
    } catch (e) {
        console.error('Resend OTP error:', e.message);
    }

    console.log('\n=== 4. Testing MSG91 Verify OTP ===');
    try {
        const verifyResult = await verifyMsg91Otp({
            phone: '+91 98765 43210',
            otp: '654321'
        });
        console.log('Verify OTP result:', verifyResult);
    } catch (e) {
        console.error('Verify OTP error:', e.message);
    }

    console.log('\n=== All Tests Completed ===');
    process.exit(0);
}

runTests();
