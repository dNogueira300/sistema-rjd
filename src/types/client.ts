// src/types/client.ts
export interface Client {
  id: string;
  name: string;
  phone: string;
  ruc: string | null;
  status: "ACTIVE" | "INACTIVE";
  equipmentCount?: number;
  lastVisit?: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface CreateClientData {
  name: string;
  phone: string;
  ruc?: string;
}

export interface UpdateClientData extends Partial<CreateClientData> {
  status?: "ACTIVE" | "INACTIVE";
}

export interface ClientFilters {
  search: string;
  status: "ALL" | "ACTIVE" | "INACTIVE";
  sortBy: "name" | "createdAt" | "lastVisit";
  sortOrder: "asc" | "desc";
}

export interface ClientFormErrors {
  name?: string;
  phone?: string;
  ruc?: string;
}

export interface ClientResponse {
  clients: Client[];
  total: number;
  page: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPreviousPage: boolean;
}
