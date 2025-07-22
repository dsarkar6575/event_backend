const jwt = require('jsonwebtoken');

exports.protect = (req, res, next) => {
  try {
    let token;
    const authHeader = req.header('Authorization');

    if (authHeader && authHeader.startsWith('Bearer ')) {
      token = authHeader.split(' ')[1];
    } else {
      token = req.header('x-auth-token');
    }

    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    console.log('🔐 Decoded token:', decoded);

    req.user = { _id: decoded.user?.id || decoded.id }; // ✅ Safe fallback

    next();
  } catch (err) {
    console.error('❌ JWT verification error:', err.message);
    return res.status(401).json({ msg: 'Token is not valid or expired' });
  }
};
