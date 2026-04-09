import { Router } from 'express';
import { usersController } from './users.controller';
import { asyncHandler } from '../../common/error.handler';
import { validate } from '../../common/validate';
import { authMiddleware, requireRole } from '../../common/auth.middleware';
import { createUserSchema, updateUserSchema } from './users.schema';

const router = Router();

// All user routes require authentication
router.use(authMiddleware);

/**
 * @openapi
 * /api/users:
 *   get:
 *     tags: [Usuarios]
 *     summary: Listar todos los usuarios
 *     security:
 *       - bearerAuth: []
 *     parameters:
 *       - in: query
 *         name: page
 *         schema: { type: integer }
 *       - in: query
 *         name: limit
 *         schema: { type: integer }
 *     responses:
 *       200:
 *         description: Lista de usuarios
 */
router.get('/', requireRole('administrator'), asyncHandler(usersController.findAll));

/**
 * @openapi
 * /api/users/role/{role}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener usuarios por rol
 */
router.get('/role/:role', requireRole('administrator'), asyncHandler(usersController.findByRole));

/**
 * @openapi
 * /api/users/{id}:
 *   get:
 *     tags: [Usuarios]
 *     summary: Obtener usuario por ID
 */
router.get('/:id', requireRole('administrator'), asyncHandler(usersController.findById));

/**
 * @openapi
 * /api/users:
 *   post:
 *     tags: [Usuarios]
 *     summary: Crear usuario
 */
router.post('/', requireRole('administrator'), validate(createUserSchema), asyncHandler(usersController.create));

/**
 * @openapi
 * /api/users/{id}:
 *   patch:
 *     tags: [Usuarios]
 *     summary: Actualizar usuario
 */
router.patch('/:id', requireRole('administrator'), validate(updateUserSchema), asyncHandler(usersController.update));

/**
 * @openapi
 * /api/users/{id}:
 *   delete:
 *     tags: [Usuarios]
 *     summary: Eliminar usuario
 */
router.delete('/:id', requireRole('administrator'), asyncHandler(usersController.delete));

export default router;
