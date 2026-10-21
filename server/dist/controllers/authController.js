"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.updateProfile = exports.getCurrentUser = exports.login = exports.register = void 0;
const bcryptjs_1 = __importDefault(require("bcryptjs"));
const prisma_1 = __importDefault(require("../db/prisma"));
const auth_1 = require("../middleware/auth");
const register = async (req, res) => {
    try {
        const { name, email, password, academicYear } = req.body;
        if (!name || !email || !password) {
            res.status(400).json({ error: 'Name, email, and password are required.' });
            return;
        }
        const emailNormalized = email.trim().toLowerCase();
        // Check if user already exists
        const existing = await prisma_1.default.user.findUnique({
            where: { email: emailNormalized },
        });
        if (existing) {
            res.status(409).json({ error: 'An account with this email already exists.' });
            return;
        }
        const salt = await bcryptjs_1.default.genSalt(10);
        const passwordHash = await bcryptjs_1.default.hash(password, salt);
        // Default to STUDENT role
        const user = await prisma_1.default.user.create({
            data: {
                name: name.trim(),
                email: emailNormalized,
                passwordHash,
                role: 'STUDENT',
                academicYear: academicYear || '1st Year',
            },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                academicYear: true,
                createdAt: true,
            },
        });
        const token = (0, auth_1.generateToken)(user);
        res.status(201).json({
            message: 'Account registered successfully.',
            token,
            user,
        });
    }
    catch (error) {
        console.error('Registration error:', error);
        res.status(500).json({ error: 'Server error during registration.' });
    }
};
exports.register = register;
const login = async (req, res) => {
    try {
        const { email, password } = req.body;
        if (!email || !password) {
            res.status(400).json({ error: 'Email and password are required.' });
            return;
        }
        const emailNormalized = email.trim().toLowerCase();
        const user = await prisma_1.default.user.findUnique({
            where: { email: emailNormalized },
        });
        if (!user) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        const isMatch = await bcryptjs_1.default.compare(password, user.passwordHash);
        if (!isMatch) {
            res.status(401).json({ error: 'Invalid email or password.' });
            return;
        }
        const userPayload = {
            id: user.id,
            name: user.name,
            email: user.email,
            role: user.role,
            academicYear: user.academicYear,
        };
        const token = (0, auth_1.generateToken)(userPayload);
        res.json({
            message: 'Login successful.',
            token,
            user: userPayload,
        });
    }
    catch (error) {
        console.error('Login error:', error);
        res.status(500).json({ error: 'Server error during login.' });
    }
};
exports.login = login;
const getCurrentUser = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated.' });
            return;
        }
        const user = await prisma_1.default.user.findUnique({
            where: { id: req.user.id },
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                academicYear: true,
                createdAt: true,
            },
        });
        if (!user) {
            res.status(404).json({ error: 'User not found.' });
            return;
        }
        res.json({ user });
    }
    catch (error) {
        console.error('Get profile error:', error);
        res.status(500).json({ error: 'Server error retrieving user profile.' });
    }
};
exports.getCurrentUser = getCurrentUser;
const updateProfile = async (req, res) => {
    try {
        if (!req.user) {
            res.status(401).json({ error: 'Not authenticated.' });
            return;
        }
        const { name, academicYear, password } = req.body;
        const updateData = {};
        if (name)
            updateData.name = name.trim();
        if (academicYear)
            updateData.academicYear = academicYear;
        if (password) {
            const salt = await bcryptjs_1.default.genSalt(10);
            updateData.passwordHash = await bcryptjs_1.default.hash(password, salt);
        }
        const updatedUser = await prisma_1.default.user.update({
            where: { id: req.user.id },
            data: updateData,
            select: {
                id: true,
                name: true,
                email: true,
                role: true,
                academicYear: true,
            },
        });
        const token = (0, auth_1.generateToken)(updatedUser);
        res.json({
            message: 'Profile updated successfully.',
            user: updatedUser,
            token,
        });
    }
    catch (error) {
        console.error('Update profile error:', error);
        res.status(500).json({ error: 'Server error updating profile.' });
    }
};
exports.updateProfile = updateProfile;
