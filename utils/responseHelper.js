const successResponse = (res, data, message = "success", statusCode = 200) => {
    res.status(statusCode).json({
        status: 1,
        message,
        data,
    });
};

module.exports = { successResponse };
