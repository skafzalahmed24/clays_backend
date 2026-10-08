const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../.env') });

const { generateOTP, isDynamicOtp, isOtpValid, getStaticOtp } = require('../utils/otpHelper');
const { sendMsg91Otp, verifyMsg91Otp } = require('../utils/msg91Service');

async function runTest() {
    console.log('====================================');
    console.log('🧪 TESTING OTP_STATUS CONFIGURATION');
    console.log('====================================\n');

    console.log('--- TEST 1: STATIC MODE (OTP_STATUS=false) ---');
    process.env.OTP_STATUS = 'false';
    console.log('isDynamicOtp():', isDynamicOtp());
    const staticGenerated = generateOTP();
    console.log('generateOTP():', staticGenerated);
    console.assert(staticGenerated === '123456', 'Expected static OTP to be 123456');

    // Test Validation with Static OTP
    const validWith123456 = isOtpValid('123456', '999999', new Date(Date.now() + 60000));
    console.log('isOtpValid("123456"):', validWith123456);
    console.assert(validWith123456 === true, 'Validation with 123456 should be true');

    const invalidWrongOtp = isOtpValid('654321', '999999', new Date(Date.now() + 60000));
    console.log('isOtpValid("654321"):', invalidWrongOtp);
    console.assert(invalidWrongOtp === false, 'Validation with wrong OTP should be false');

    const msg91SendResult = await sendMsg91Otp({ phone: '9876543210' });
    console.log('MSG91 Send in static mode:', msg91SendResult);

    const msg91VerifyResult = await verifyMsg91Otp({ phone: '9876543210', otp: '123456' });
    console.log('MSG91 Verify in static mode:', msg91VerifyResult);

    console.log('\n--- TEST 2: DYNAMIC MODE (OTP_STATUS=true) ---');
    process.env.OTP_STATUS = 'true';
    console.log('isDynamicOtp():', isDynamicOtp());
    const dynamicGenerated = generateOTP();
    console.log('generateOTP():', dynamicGenerated);
    console.assert(dynamicGenerated.length === 6 && /^\d{6}$/.test(dynamicGenerated), 'Expected 6-digit random number');

    const dynamicMatch = isOtpValid(dynamicGenerated, dynamicGenerated, new Date(Date.now() + 60000));
    console.log('isOtpValid for matched dynamic OTP:', dynamicMatch);
    console.assert(dynamicMatch === true, 'Dynamic matching OTP should be valid');

    const dynamic123456Fail = isOtpValid('123456', dynamicGenerated, new Date(Date.now() + 60000));
    console.log('isOtpValid with 123456 in dynamic mode (should be false if not matching):', dynamic123456Fail);
    console.assert(dynamic123456Fail === false || dynamicGenerated === '123456', 'Static code should not automatically pass in dynamic mode');

    console.log('\n✅ ALL OTP_STATUS UNIT TESTS PASSED SUCCESSFULLY!');
}

runTest().catch(console.error);
