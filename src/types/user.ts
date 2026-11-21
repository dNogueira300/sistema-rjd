// src/types/user.ts
export type UserRole = "ADMINISTRADOR" | "TECNICO";
export type UserStatus = "ACTIVE" | "INACTIVE";

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  role: UserRole;
  status: UserStatus;
  equipmentCount: number;
  activationCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface UserStats {
  total: number;
  admins: number;
  technicians: number;
  active: number;
  inactive: number;
}

export interface UsersResponse {
  users: SystemUser[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
  stats: UserStats;
}

export interface UserFilters {
  search: string;
  role: "ALL" | UserRole;
  status: "ALL" | UserStatus;
  sortBy: "name" | "email" | "createdAt" | "role";
  sortOrder: "asc" | "desc";
}

export interface CreateUserData {
  name: string;
  email: string;
  phone?: string;
  role: UserRole;
  password: string;
}

export interface UpdateUserData {
  name?: string;
  email?: string;
  phone?: string;
  role?: UserRole;
  status?: UserStatus;
  password?: string;
}

export const ROLE_LABELS: Record<UserRole, string> = {
  ADMINISTRADOR: "Administrador",
  TECNICO: "Técnico",
};
