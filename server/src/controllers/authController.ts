import { Response } from 'express';
import bcrypt from 'bcryptjs';
import prisma from '../db/prisma';
import { generateToken, AuthenticatedRequest } from '../middleware/auth';

export const register = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { name, email, password, academicYear } = req.body;

    if (!name || !email || !password) {
      res.status(400).json({ error: 'Name, email, and password are required.' });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    // Check if user already exists
    const existing = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (existing) {
      res.status(409).json({ error: 'An account with this email already exists.' });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(password, salt);

    // Default to STUDENT role
    const user = await prisma.user.create({
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

    const token = generateToken(user);

    res.status(201).json({
      message: 'Account registered successfully.',
      token,
      user,
    });
  } catch (error: any) {
    console.error('Registration error:', error);
    res.status(500).json({ error: 'Server error during registration.' });
  }
};

export const login = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ error: 'Email and password are required.' });
      return;
    }

    const emailNormalized = email.trim().toLowerCase();

    const user = await prisma.user.findUnique({
      where: { email: emailNormalized },
    });

    if (!user) {
      res.status(401).json({ error: 'Invalid email or password.' });
      return;
    }

    const isMatch = await bcrypt.compare(password, user.passwordHash);
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

    const token = generateToken(userPayload);

    res.json({
      message: 'Login successful.',
      token,
      user: userPayload,
    });
  } catch (error: any) {
    console.error('Login error:', error);
    res.status(500).json({ error: 'Server error during login.' });
  }
};

export const getCurrentUser = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const user = await prisma.user.findUnique({
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
  } catch (error: any) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Server error retrieving user profile.' });
  }
};

export const updateProfile = async (req: AuthenticatedRequest, res: Response): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ error: 'Not authenticated.' });
      return;
    }

    const { name, academicYear, password } = req.body;
    const updateData: any = {};

    if (name) updateData.name = name.trim();
    if (academicYear) updateData.academicYear = academicYear;
    if (password) {
      const salt = await bcrypt.genSalt(10);
      updateData.passwordHash = await bcrypt.hash(password, salt);
    }

    const updatedUser = await prisma.user.update({
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

    const token = generateToken(updatedUser);

    res.json({
      message: 'Profile updated successfully.',
      user: updatedUser,
      token,
    });
  } catch (error: any) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Server error updating profile.' });
  }
};
