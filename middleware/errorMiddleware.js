const errorHandler = (err, req, res, next) => {
    // An error thrown without setting a status would otherwise be sent as 200
    const statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;

    res.status(statusCode);

    // Non-Error throwables (e.g. Razorpay SDK errors) carry their text in err.error.description
    const message = err.message || err.error?.description || (typeof err === 'string' ? err : 'Internal Server Error');

    res.json({
        status: 0,
        message,
        data: null,
        stack: process.env.NODE_ENV === 'production' ? null : err.stack,
    });
};

const notFound = (req, res, next) => {
    const error = new Error(`Not Found - ${req.originalUrl}`);
    res.status(404);
    next(error);
};

module.exports = {
    errorHandler,
    notFound,
};
