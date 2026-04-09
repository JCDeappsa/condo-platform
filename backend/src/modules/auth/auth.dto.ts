import { User } from '../users/users.model';

export function toUserDTO(user: User) {
  return {
    id: user.id,
    email: user.email,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone,
    isActive: user.isActive,
    boardPosition: user.boardPosition,
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    role: user.role
      ? {
          id: user.role.id,
          name: user.role.name,
          description: user.role.description,
          hierarchyLevel: user.role.hierarchyLevel,
        }
      : null,
  };
}
