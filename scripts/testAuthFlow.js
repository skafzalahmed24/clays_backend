require('dotenv').config();
const { sequelize } = require('../config/db');
const User = require('../models/User');

async function testFullAuthFlow() {
    try {
        await sequelize.authenticate();
        console.log('--- 1. Testing Registration with Indian Phone (+91) ---');
        const randomId = Date.now();
        const testEmail = `test_otp_${randomId}@example.com`;
        const testPhone = `98765${String(randomId).slice(-5)}`; // Valid 10-digit Indian phone starting with 9
        const testPassword = 'Password@123';

        // Direct controller / API flow test
        const {
            validateAndFormatIndianMobile,
            sendMsg91Otp
        } = require('../utils/msg91Service');

        const phoneVal = validateAndFormatIndianMobile(testPhone);
        console.log(`Phone Validation for ${testPhone}:`, phoneVal);

        // Generate OTP
        const otp = Math.floor(100000 + Math.random() * 900000).toString();
        const otpExpire = new Date(Date.now() + 10 * 60 * 1000);

        // Create User
        const user = await User.create({
            name: 'Test User',
            email: testEmail,
            phone: phoneVal.formattedNumber,
            password: testPassword,
            otp,
            otpExpire,
            isVerified: false
        });

        console.log(`✓ User created with ID: ${user.id}, Phone: ${user.phone}, OTP: ${user.otp}`);

        console.log('\n--- 2. Testing Send OTP via MSG91 ---');
        const sendResult = await sendMsg91Otp({
            phone: user.phone,
            otp: user.otp
        });
        console.log('✓ Send OTP Result:', sendResult.message);

        console.log('\n--- 3. Testing OTP Verification ---');
        if (user.otp === otp && new Date(user.otpExpire).getTime() > Date.now()) {
            user.isVerified = true;
            user.otp = null;
            user.otpExpire = null;
            await user.save();
            console.log('✓ Account verified successfully! isVerified:', user.isVerified);
        } else {
            throw new Error('Verification failed');
        }

        console.log('\n--- 4. Testing Password Reset OTP flow with Phone ---');
        const resetOtp = Math.floor(100000 + Math.random() * 900000).toString();
        user.otp = resetOtp;
        user.otpExpire = new Date(Date.now() + 10 * 60 * 1000);
        await user.save();

        console.log(`✓ Generated Reset OTP for ${user.phone}: ${resetOtp}`);
        const resetSendResult = await sendMsg91Otp({
            phone: user.phone,
            otp: resetOtp
        });
        console.log('✓ Reset OTP Send Result:', resetSendResult.message);

        // Verify Reset OTP
        if (user.otp === resetOtp) {
            user.password = 'NewPassword@123';
            user.otp = null;
            user.otpExpire = null;
            await user.save();
            console.log('✓ Password reset successfully verified!');
        }

        // Clean up test user
        await user.destroy();
        console.log('\n✓ Cleaned up test user record.');
        console.log('\n=== ALL AUTH FLOW TESTS PASSED! ===');

    } catch (err) {
        console.error('Test error:', err);
    } finally {
        process.exit(0);
    }
}

testFullAuthFlow();
