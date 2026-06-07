
const validate = (schema) => {
    return (req, res, next) => {
        const { error, value } = schema.validate(req.body, { abortEarly: false, stripUnknown: true });

        if (error) {
            const errorMessage = error.details.map((detail) => detail.message).join(', ');
            res.status(400);
            throw new Error(errorMessage); // Handled by our errorMiddleware
        }

        // Replace req.body with the sanitized value
        req.body = value;

        next();
    };
};

module.exports = validate;
