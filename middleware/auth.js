const jwt = require('jsonwebtoken');
const User = require('../models/user.model');

const COOKIE_NAME = 'edge_session';

function secret() {
    if (!process.env.JWT_SECRET || process.env.JWT_SECRET.length < 32) {
        throw new Error('JWT_SECRET must be set to a random value of at least 32 characters');
    }
    return process.env.JWT_SECRET;
}

function signSession(user) {
    return jwt.sign({ sub: String(user._id), role: user.role, teacherId: user.teacherId ? String(user.teacherId) : null }, secret(), { expiresIn: '8h', issuer: 'edge-academy', audience: 'edge-academy-web' });
}

function readToken(req) {
    const authorization = req.get('authorization') || '';
    return req.cookies?.[COOKIE_NAME] || (authorization.startsWith('Bearer ') ? authorization.slice(7) : null);
}

async function authenticate(req, res, next) {
    try {
        const token = readToken(req);
        if (!token) return res.status(401).json({ success: false, message: 'يجب تسجيل الدخول أولاً' });
        const payload = jwt.verify(token, secret(), { issuer: 'edge-academy', audience: 'edge-academy-web' });
        const user = await User.findById(payload.sub).select('-password').lean();
        if (!user) return res.status(401).json({ success: false, message: 'انتهت صلاحية الجلسة' });
        req.user = user;
        next();
    } catch (_) {
        return res.status(401).json({ success: false, message: 'جلسة غير صالحة أو منتهية' });
    }
}

const allowRoles = (...roles) => (req, res, next) => {
    if (!req.user || !roles.includes(req.user.role)) return res.status(403).json({ success: false, message: 'ليس لديك صلاحية لهذا الإجراء' });
    next();
};

const ownUserOr = (...roles) => (req, res, next) => {
    if (req.user && (String(req.user._id) === String(req.params.id) || roles.includes(req.user.role))) return next();
    return res.status(403).json({ success: false, message: 'لا تملك صلاحية الوصول إلى هذا الحساب' });
};

module.exports = { COOKIE_NAME, signSession, authenticate, allowRoles, ownUserOr };
