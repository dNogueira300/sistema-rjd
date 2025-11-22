// src/types/technician.ts
export interface Technician {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  status: "ACTIVE" | "INACTIVE";
  equipmentCount?: number;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateTechnicianData {
  name: string;
  email: string;
  phone?: string;
}

export interface UpdateTechnicianData extends Partial<CreateTechnicianData> {
  status?: "ACTIVE" | "INACTIVE";
}

export interface TechnicianFilters {
  search: string;
  status: "ALL" | "ACTIVE" | "INACTIVE";
  sortBy: "name" | "createdAt" | "email";
  sortOrder: "asc" | "desc";
}

export interface TechnicianFormErrors {
  name?: string;
  email?: string;
  phone?: string;
}

export interface TechnicianResponse {
  technicians: Technician[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
