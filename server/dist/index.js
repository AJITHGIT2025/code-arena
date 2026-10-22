"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const path_1 = __importDefault(require("path"));
const express_rate_limit_1 = __importDefault(require("express-rate-limit"));
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const problemRoutes_1 = __importDefault(require("./routes/problemRoutes"));
const submissionRoutes_1 = __importDefault(require("./routes/submissionRoutes"));
const statsRoutes_1 = __importDefault(require("./routes/statsRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 5000;
// Trust reverse proxy for accurate client IPs behind Render/Cloudflare/Nginx
app.set('trust proxy', 1);
// Security & Middlewares
app.use((0, cors_1.default)({
    origin: process.env.CLIENT_URL ? [process.env.CLIENT_URL, 'http://localhost:5173', 'http://127.0.0.1:5173'] : '*',
    credentials: true,
}));
app.use(express_1.default.json({ limit: '2mb' }));
app.use(express_1.default.urlencoded({ extended: true, limit: '2mb' }));
// Rate limiter for execution and submission endpoints
const executionLimiter = (0, express_rate_limit_1.default)({
    windowMs: 1 * 60 * 1000, // 1 minute
    max: 120, // max 120 runs/submits per minute
    keyGenerator: (req) => {
        // If authenticated, rate limit per student token so whole computer labs sharing one Wi-Fi IP don't block each other
        const authHeader = req.headers.authorization;
        if (authHeader && authHeader.startsWith('Bearer ')) {
            return authHeader.slice(7, 35);
        }
        return req.ip || 'anonymous';
    },
    standardHeaders: true,
    legacyHeaders: false,
    message: { error: 'Too many execution requests. Please wait a moment before trying again.' },
});
// Route mounts
app.use('/api/auth', authRoutes_1.default);
app.use('/api/problems', problemRoutes_1.default);
app.use('/api/submissions', executionLimiter, submissionRoutes_1.default);
app.use('/api/stats', statsRoutes_1.default);
// Health check
app.get('/api/health', (req, res) => {
    res.json({
        status: 'healthy',
        platform: 'CODE ARENA',
        timestamp: new Date().toISOString(),
    });
});
// Serve frontend build in production if available
const clientDistPath = path_1.default.resolve(__dirname, '../../client/dist');
app.use(express_1.default.static(clientDistPath));
app.get('*', (req, res, next) => {
    if (req.path.startsWith('/api')) {
        return next();
    }
    res.sendFile(path_1.default.join(clientDistPath, 'index.html'), (err) => {
        if (err) {
            // In development when client dist doesn't exist yet, return API message
            res.status(200).send('CODE ARENA API Server running. Open the frontend at http://localhost:5173');
        }
    });
});
// Centralized error handler
app.use((err, req, res, next) => {
    console.error('Unhandled Server Error:', err);
    res.status(err.status || 500).json({
        error: err.message || 'Internal Server Error',
    });
});
app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`  CODE ARENA Server running on port ${PORT}`);
    console.log(`  Health Check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
});
exports.default = app;
