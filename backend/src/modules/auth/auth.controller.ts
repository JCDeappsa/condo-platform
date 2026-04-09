import { Request, Response } from 'express';
import { authService } from './auth.service';
import { toUserDTO } from './auth.dto';
import { setAuthCookies, clearAuthCookies } from '../../common/auth.middleware';

export class AuthController {
  async login(req: Request, res: Response): Promise<void> {
    const { email, password } = req.body;
    const { user, accessToken, refreshToken } = await authService.login(email, password);

    setAuthCookies(res, accessToken, refreshToken);

    res.json({
      success: true,
      data: {
        user: toUserDTO(user),
        accessToken,
      },
    });
  }

  async refresh(req: Request, res: Response): Promise<void> {
    const refreshTokenValue = req.cookies?.refreshToken;

    if (!refreshTokenValue) {
      res.status(401).json({ success: false, error: 'No se encontró token de actualización.' });
      return;
    }

    const { user, accessToken } = await authService.refresh(refreshTokenValue);

    // Update access token cookie
    res.cookie('accessToken', accessToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: process.env.NODE_ENV === 'production' ? 'strict' : 'lax',
      maxAge: 15 * 60 * 1000,
    });

    res.json({
      success: true,
      data: {
        user: toUserDTO(user),
        accessToken,
      },
    });
  }

  async logout(req: Request, res: Response): Promise<void> {
    if (req.user) {
      await authService.logout(req.user.id);
    }
    clearAuthCookies(res);
    res.json({ success: true, message: 'Sesión cerrada.' });
  }

  async me(req: Request, res: Response): Promise<void> {
    const user = await authService.getMe(req.user!.id);
    res.json({
      success: true,
      data: { user: toUserDTO(user) },
    });
  }

  async changePassword(req: Request, res: Response): Promise<void> {
    const { currentPassword, newPassword } = req.body;
    await authService.changePassword(req.user!.id, currentPassword, newPassword);
    res.json({ success: true, message: 'Contraseña actualizada exitosamente.' });
  }

  async forgotPassword(req: Request, res: Response): Promise<void> {
    const { email } = req.body;
    const token = await authService.forgotPassword(email);
    // Always return success to not reveal if email exists
    res.json({
      success: true,
      message: 'Si el correo existe, recibirá instrucciones para restablecer su contraseña.',
      // Include token in dev mode so you can use it directly
      ...(process.env.NODE_ENV === 'development' && token ? { resetToken: token } : {}),
    });
  }

  async resetPassword(req: Request, res: Response): Promise<void> {
    const { token, newPassword } = req.body;
    await authService.resetPassword(token, newPassword);
    res.json({ success: true, message: 'Contraseña restablecida exitosamente. Puede iniciar sesión.' });
  }

  async adminResetPassword(req: Request, res: Response): Promise<void> {
    const { newPassword } = req.body;
    await authService.adminResetPassword(req.params.userId, newPassword);
    res.json({ success: true, message: 'Contraseña restablecida exitosamente.' });
  }
}

export const authController = new AuthController();
