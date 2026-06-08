const StockRequest = require('../models/StockRequest');

// @desc    Create a stock request
// @route   POST /api/requests
// @access  Public
const createRequest = async (req, res) => {
    const { productId, productName, productImg, userEmail } = req.body;

    try {
        // Check for existing request from this email for this product
        const existingRequest = await StockRequest.findOne({ where: { productId, userEmail } });

        if (existingRequest) {
            return res.status(400).json({ message: 'You have already requested notification for this product.' });
        }

        const request = await StockRequest.create({
            productId,
            productName,
            productImg,
            userEmail,
        });

        res.status(201).json(request);
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Get all requests
// @route   GET /api/requests
// @access  Private/Admin
const getRequests = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const skip = (page - 1) * limit;

        const total = await StockRequest.count();
        const requests = await StockRequest.findAll({
            order: [['createdAt', 'DESC']],
            offset: skip,
            limit: limit
        });

        res.status(200).json({
            requests,
            page,
            pages: Math.ceil(total / limit),
            total
        });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Delete a request
// @route   DELETE /api/requests/:id
// @access  Private/Admin
const deleteRequest = async (req, res) => {
    try {
        const request = await StockRequest.findByPk(req.params.id);

        if (!request) {
            return res.status(404).json({ message: 'Request not found' });
        }

        await request.destroy();
        res.status(200).json({ id: req.params.id, message: 'Request removed' });
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

// @desc    Update request status
// @route   PUT /api/requests/:id
// @access  Private/Admin
const updateRequest = async (req, res) => {
    try {
        const request = await StockRequest.findByPk(req.params.id);

        if (request) {
            const oldStatus = request.status;
            request.status = req.body.status || request.status;
            
            const updatedRequest = await request.save();

            // Check if status changed to 'Notified' and wasn't already
            if (request.status === 'Notified' && oldStatus !== 'Notified') {
                try {
                    const { sendEmail } = require('../utils/emailService');
                    const message = `
                        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
                            <h2 style="color: #D4AF37;">Good News!</h2>
                            <p>Hi there,</p>
                            <p>The product you requested is back in stock!</p>
                            
                            <div style="background: #f9f9f9; padding: 15px; margin: 20px 0; border-left: 4px solid #D4AF37;">
                                <img src="${request.productImg}" alt="${request.productName}" style="width: 50px; height: 50px; vertical-align: middle; border-radius: 4px; margin-right: 10px;">
                                <strong>${request.productName}</strong>
                            </div>

                            <p> Hurry up and grab it before it's gone again!</p>
                            
                            <a href="${process.env.CLIENT_URL || 'http://localhost:5173'}/product/${request.productId}" style="background: #000; color: #fff; padding: 10px 20px; text-decoration: none; border-radius: 4px; display: inline-block;">Shop Now</a>
                        </div>
                    `;

                    await sendEmail({
                        email: request.userEmail,
                        subject: 'Product Back in Stock - Clarysays',
                        message
                    });
                    
                } catch (emailError) {
                    console.error("Failed to send stock notification email:", emailError);
                }
            }

            res.json(updatedRequest);
        } else {
            res.status(404).json({ message: 'Request not found' });
        }
    } catch (error) {
        res.status(500).json({ message: error.message });
    }
};

module.exports = {
    createRequest,
    getRequests,
    deleteRequest,
    updateRequest,
};
