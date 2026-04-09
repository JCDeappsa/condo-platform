import { Router } from 'express';
import { authController } from './auth.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { loginSchema, changePasswordSchema, forgotPasswordSchema, resetPasswordSchema, adminResetPasswordSchema } from './auth.schema';

const router = Router();

/**
 * @openapi
 * /api/auth/login:
 *   post:
 *     tags: [Auth]
 *     summary: Iniciar sesión
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               email:
 *                 type: string
 *               password:
 *                 type: string
 *     responses:
 *       200:
 *         description: Login exitoso
 */
router.post('/login', validate(loginSchema), asyncHandler(authController.login));

/**
 * @openapi
 * /api/auth/refresh:
 *   post:
 *     tags: [Auth]
 *     summary: Refrescar token de acceso
 *     responses:
 *       200:
 *         description: Token refrescado
 */
router.post('/refresh', asyncHandler(authController.refresh));

/**
 * @openapi
 * /api/auth/logout:
 *   post:
 *     tags: [Auth]
 *     summary: Cerrar sesión
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Sesión cerrada
 */
router.post('/logout', authMiddleware, asyncHandler(authController.logout));

/**
 * @openapi
 * /api/auth/me:
 *   get:
 *     tags: [Auth]
 *     summary: Obtener usuario actual
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Datos del usuario
 */
router.get('/me', authMiddleware, asyncHandler(authController.me));

/**
 * @openapi
 * /api/auth/change-password:
 *   post:
 *     tags: [Auth]
 *     summary: Cambiar contraseña
 *     security:
 *       - bearerAuth: []
 *     responses:
 *       200:
 *         description: Contraseña actualizada
 */
router.post(
  '/change-password',
  authMiddleware,
  validate(changePasswordSchema),
  asyncHandler(authController.changePassword)
);

// Forgot password (public - no auth needed)
router.post('/forgot-password', validate(forgotPasswordSchema), asyncHandler(authController.forgotPassword));

// Reset password with token (public)
router.post('/reset-password', validate(resetPasswordSchema), asyncHandler(authController.resetPassword));

// Admin resets another user's password
router.post(
  '/admin-reset-password/:userId',
  authMiddleware,
  requireRole('administrator'),
  validate(adminResetPasswordSchema),
  asyncHandler(authController.adminResetPassword)
);

export default router;
