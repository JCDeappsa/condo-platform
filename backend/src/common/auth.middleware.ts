import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { env } from '../config/env';
import { User } from '../modules/users/users.model';
import { Role } from '../modules/roles/roles.model';
import { HttpError } from './error.handler';

// Role hierarchy levels
const ROLE_HIERARCHY: Record<string, number> = {
  administrator: 40,
  board_member: 30,
  maintenance: 20,
  resident: 10,
};

export interface AuthUser {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: {
    id: string;
    name: string;
    hierarchyLevel: number;
  };
  communityId: string;
}

// Extend Express Request
declare global {
  namespace Express {
    interface Request {
      user?: AuthUser;
    }
  }
}

export interface TokenPayload {
  userId: string;
  email: string;
  role: string;
}

export function generateAccessToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtSecret, { expiresIn: env.jwtExpiresIn as any });
}

export function generateRefreshToken(payload: TokenPayload): string {
  return jwt.sign(payload, env.jwtRefreshSecret, { expiresIn: env.jwtRefreshExpiresIn as any });
}

export function verifyAccessToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtSecret) as TokenPayload;
}

export function verifyRefreshToken(token: string): TokenPayload {
  return jwt.verify(token, env.jwtRefreshSecret) as TokenPayload;
}

/**
 * Auth middleware — checks Bearer token or cookie, loads user from DB.
 */
export async function authMiddleware(req: Request, _res: Response, next: NextFunction): Promise<void> {
  try {
    // Get token from Authorization header or cookie
    let token: string | undefined;

    const authHeader = req.headers.authorization;
    if (authHeader?.startsWith('Bearer ')) {
      token = authHeader.slice(7);
    } else if (req.cookies?.accessToken) {
      token = req.cookies.accessToken;
    }

    if (!token) {
      throw new HttpError(401, 'No autorizado. Inicie sesión.');
    }

    const payload = verifyAccessToken(token);

    const user = await User.findByPk(payload.userId, {
      include: [{ model: Role, as: 'role' }],
    });

    if (!user || !user.isActive) {
      throw new HttpError(401, 'Usuario no encontrado o desactivado.');
    }

    req.user = {
      id: user.id,
      email: user.email,
      firstName: user.firstName,
      lastName: user.lastName,
      role: {
        id: user.role!.id,
        name: user.role!.name,
        hierarchyLevel: user.role!.hierarchyLevel,
      },
      communityId: user.communityId,
    };

    next();
  } catch (error) {
    if (error instanceof HttpError) {
      next(error);
    } else if (error instanceof jwt.TokenExpiredError) {
      next(new HttpError(401, 'Sesión expirada. Inicie sesión nuevamente.'));
    } else if (error instanceof jwt.JsonWebTokenError) {
      next(new HttpError(401, 'Token inválido.'));
    } else {
      next(new HttpError(401, 'No autorizado.'));
    }
  }
}

/**
 * Require one of the specified roles.
 */
export function requireRole(...allowedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'No autorizado.'));
      return;
    }
    if (!allowedRoles.includes(req.user.role.name)) {
      next(new HttpError(403, 'No tiene permisos para realizar esta acción.'));
      return;
    }
    next();
  };
}

/**
 * Block specific roles from accessing a route.
 */
export function blockRole(...blockedRoles: string[]) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'No autorizado.'));
      return;
    }
    if (blockedRoles.includes(req.user.role.name)) {
      next(new HttpError(403, 'No tiene permisos para realizar esta acción.'));
      return;
    }
    next();
  };
}

/**
 * Require minimum hierarchy level.
 */
export function requireMinLevel(minLevel: number) {
  return (req: Request, _res: Response, next: NextFunction): void => {
    if (!req.user) {
      next(new HttpError(401, 'No autorizado.'));
      return;
    }
    if (req.user.role.hierarchyLevel < minLevel) {
      next(new HttpError(403, 'No tiene permisos suficientes.'));
      return;
    }
    next();
  };
}

export function setAuthCookies(res: Response, accessToken: string, refreshToken: string): void {
  const isProduction = env.nodeEnv === 'production';

  res.cookie('accessToken', accessToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 15 * 60 * 1000, // 15 min
  });

  res.cookie('refreshToken', refreshToken, {
    httpOnly: true,
    secure: isProduction,
    sameSite: isProduction ? 'strict' : 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    path: '/api/auth/refresh',
  });
}

export function clearAuthCookies(res: Response): void {
  res.clearCookie('accessToken');
  res.clearCookie('refreshToken', { path: '/api/auth/refresh' });
}
