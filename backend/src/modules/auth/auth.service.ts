import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { User } from '../users/users.model';
import { Role } from '../roles/roles.model';
import { Op } from 'sequelize';
import {
  generateAccessToken,
  generateRefreshToken,
  verifyRefreshToken,
  TokenPayload,
} from '../../common/auth.middleware';
import { HttpError } from '../../common/error.handler';

export class AuthService {
  async login(email: string, password: string) {
    const user = await User.findOne({
      where: { email },
      include: [{ model: Role, as: 'role' }],
    });

    if (!user) {
      throw new HttpError(401, 'Correo o contraseña incorrectos.');
    }

    if (!user.isActive) {
      throw new HttpError(403, 'Su cuenta está desactivada. Contacte al administrador.');
    }

    const validPassword = await bcrypt.compare(password, user.passwordHash);
    if (!validPassword) {
      throw new HttpError(401, 'Correo o contraseña incorrectos.');
    }

    const payload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role!.name,
    };

    const accessToken = generateAccessToken(payload);
    const refreshToken = generateRefreshToken(payload);

    // Store refresh token and update last login
    await user.update({
      refreshToken,
      lastLoginAt: new Date(),
    });

    return { user, accessToken, refreshToken };
  }

  async refresh(refreshTokenValue: string) {
    let payload: TokenPayload;
    try {
      payload = verifyRefreshToken(refreshTokenValue);
    } catch {
      throw new HttpError(401, 'Token de actualización inválido o expirado.');
    }

    const user = await User.findByPk(payload.userId, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !user.isActive || user.refreshToken !== refreshTokenValue) {
      throw new HttpError(401, 'Token de actualización inválido.');
    }

    const newPayload: TokenPayload = {
      userId: user.id,
      email: user.email,
      role: user.role!.name,
    };

    const accessToken = generateAccessToken(newPayload);

    return { user, accessToken };
  }

  async logout(userId: string) {
    await User.update({ refreshToken: null }, { where: { id: userId } });
  }

  async getMe(userId: string) {
    const user = await User.findByPk(userId, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !user.isActive) {
      throw new HttpError(404, 'Usuario no encontrado.');
    }

    return user;
  }

  async changePassword(userId: string, currentPassword: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) {
      throw new HttpError(404, 'Usuario no encontrado.');
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      throw new HttpError(400, 'La contraseña actual es incorrecta.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });
  }

  async forgotPassword(email: string) {
    const user = await User.findOne({ where: { email } });
    if (!user) {
      // Don't reveal if user exists
      return;
    }

    const token = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await user.update({
      resetToken: token,
      resetTokenExpires: expires,
    });

    // In production this would send an email with a link.
    // For now, log the token so it can be used.
    console.log(`[Reset Password] Token for ${email}: ${token}`);

    return token;
  }

  async resetPassword(token: string, newPassword: string) {
    const user = await User.findOne({
      where: {
        resetToken: token,
        resetTokenExpires: { [Op.gt]: new Date() },
      },
    });

    if (!user) {
      throw new HttpError(400, 'El enlace de restablecimiento es inválido o ha expirado.');
    }

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({
      passwordHash,
      resetToken: null,
      resetTokenExpires: null,
    });
  }

  /**
   * Admin resets another user's password directly.
   */
  async adminResetPassword(userId: string, newPassword: string) {
    const user = await User.findByPk(userId);
    if (!user) throw new HttpError(404, 'Usuario no encontrado.');

    const passwordHash = await bcrypt.hash(newPassword, 12);
    await user.update({ passwordHash });
  }
}

export const authService = new AuthService();
