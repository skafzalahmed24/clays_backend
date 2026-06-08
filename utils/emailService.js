const nodemailer = require('nodemailer');

const sendEmail = async (options) => {
    // 1. Create a transporter
    const transporter = nodemailer.createTransport({
        service: 'gmail', // or use host/port for other providers like SendGrid/Mailgun
        auth: {
            user: process.env.EMAIL_USERNAME,
            pass: process.env.EMAIL_PASSWORD // App Password if using Gmail
        }
    });

    // 2. Define email options
    const mailOptions = {
        from: `Clarysays <${process.env.EMAIL_USERNAME}>`,
        to: options.email,
        subject: options.subject,
        html: options.message
    };

    // 3. Send email
    if (process.env.NODE_ENV !== 'production') {
        console.log(`[Email Service] To: ${options.email}, Subject: ${options.subject}`);
        console.log(`[Email Service] Message: ${options.message}`); // Log OTP for Dev/Testing
    }
    
    try {
        await transporter.sendMail(mailOptions);
    } catch (error) {
        console.warn("Email sending failed (likely invalid credentials). Check console for logs.", error.message);
        // Don't throw if we want to allow "success" in dev even if email fails
        if (process.env.NODE_ENV === 'production') throw error;
    }
};

const sendOrderEmail = async (order, user) => {
    const orderItemsHtml = order.orderItems.map(item => `
        <tr>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.name}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">${item.qty}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${item.price}</td>
            <td style="padding: 10px; border-bottom: 1px solid #eee;">₹${item.qty * item.price}</td>
        </tr>
    `).join('');

    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #D4AF37; text-align: center;">Order Confrimation</h2>
            <p>Hi ${user.name},</p>
            <p>Thank you for your order! We are processing it and will notify you when it ships.</p>
            
            <h3 style="background: #f4f4f4; padding: 10px;">Order #${order._id}</h3>
            <p><strong>Status:</strong> ${order.status}</p>
            <p><strong>Payment Method:</strong> ${order.paymentMethod}</p>

            <table style="width: 100%; border-collapse: collapse; margin-top: 20px;">
                <thead>
                    <tr style="background: #f4f4f4; text-align: left;">
                        <th style="padding: 10px;">Product</th>
                        <th style="padding: 10px;">Qty</th>
                        <th style="padding: 10px;">Price</th>
                        <th style="padding: 10px;">Total</th>
                    </tr>
                </thead>
                <tbody>
                    ${orderItemsHtml}
                </tbody>
                <tfoot>
                     <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Shipping:</td>
                        <td style="padding: 10px;">₹${order.shippingPrice}</td>
                    </tr>
                    <tr>
                        <td colspan="3" style="padding: 10px; text-align: right; font-weight: bold;">Total:</td>
                        <td style="padding: 10px;">₹${order.totalPrice}</td>
                    </tr>
                </tfoot>
            </table>

            <div style="margin-top: 20px; background: #f9f9f9; padding: 15px;">
                <h4>Shipping Address:</h4>
                <p>
                    ${order.shippingAddress.address},<br>
                    ${order.shippingAddress.city}, ${order.shippingAddress.postalCode},<br>
                    ${order.shippingAddress.country}
                </p>
            </div>

            <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} Clarysays. All rights reserved.
            </p>
        </div>
    `;

    await sendEmail({
        email: user.email,
        subject: `Order Confirmation - Order #${order._id}`,
        message
    });
};

const sendOrderStatusEmail = async (order, user) => {
    const message = `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; color: #333;">
            <h2 style="color: #D4AF37; text-align: center;">Order Update</h2>
            <p>Hi ${user.name},</p>
            <p>Your order <strong>#${order._id}</strong> status has been updated.</p>
            
            <div style="background: #f4f4f4; padding: 15px; text-align: center; margin: 20px 0;">
                <h3 style="margin: 0; color: #333;">Current Status: <span style="color: #D4AF37;">${order.status}</span></h3>
            </div>

            <p>You can view your order details in your account dashboard.</p>

            <div style="text-align: center; margin-top: 30px;">
                <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/account" style="background: #D4AF37; color: #fff; padding: 12px 24px; text-decoration: none; border-radius: 4px;">View Order</a>
            </div>
             <p style="text-align: center; margin-top: 30px; font-size: 12px; color: #888;">
                &copy; ${new Date().getFullYear()} Clarysays. All rights reserved.
            </p>
        </div>
    `;

    await sendEmail({
        email: user.email,
        subject: `Order Updated - Order #${order._id}`,
        message
    });
};

module.exports = { sendEmail, sendOrderEmail, sendOrderStatusEmail };
