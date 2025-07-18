const jwt = require('jsonwebtoken');

// Middleware to protect routes by verifying JWT
exports.protect = (req, res, next) => {
    try {
        // Get token from headers
        let token;
        const authHeader = req.header('Authorization');

        if (authHeader && authHeader.startsWith('Bearer ')) {
            token = authHeader.split(' ')[1];
        } else {
            token = req.header('x-auth-token'); // fallback header
        }

        // If no token found
        if (!token) {
            return res.status(401).json({ msg: 'No token, authorization denied' });
        }

        // Verify token
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        // Attach user payload to request object
        req.user = decoded.user;

        next(); // Continue to the next middleware/route
    } catch (err) {
        console.error('❌ JWT verification error:', err.message);
        return res.status(401).json({ msg: 'Token is not valid or expired' });
    }
};
