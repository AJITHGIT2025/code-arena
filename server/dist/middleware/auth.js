"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.optionalAuth = exports.requireAdmin = exports.authenticateToken = exports.generateToken = void 0;
const jsonwebtoken_1 = __importDefault(require("jsonwebtoken"));
const JWT_SECRET = process.env.JWT_SECRET || 'code-arena-jwt-secret-key-change-in-production-2026';
const generateToken = (user) => {
    return jsonwebtoken_1.default.sign({
        id: user.id,
        name: user.name,
        email: user.email,
        role: user.role,
        academicYear: user.academicYear,
    }, JWT_SECRET, { expiresIn: '7d' });
};
exports.generateToken = generateToken;
const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        res.status(401).json({ error: 'Access token required. Please log in.' });
        return;
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (err) {
            res.status(403).json({ error: 'Invalid or expired token.' });
            return;
        }
        req.user = decoded;
        next();
    });
};
exports.authenticateToken = authenticateToken;
const requireAdmin = (req, res, next) => {
    if (!req.user) {
        res.status(401).json({ error: 'Authentication required.' });
        return;
    }
    if (req.user.role !== 'ADMIN') {
        res.status(403).json({ error: 'Admin privileges required for this action.' });
        return;
    }
    next();
};
exports.requireAdmin = requireAdmin;
const optionalAuth = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return next();
    }
    jsonwebtoken_1.default.verify(token, JWT_SECRET, (err, decoded) => {
        if (!err && decoded) {
            req.user = decoded;
        }
        next();
    });
};
exports.optionalAuth = optionalAuth;
