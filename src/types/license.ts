export type PackageStockStatus = "ACTIVE" | "LOW" | "DEPLETED";

// Referencias mínimas embebidas en una activación
export interface ActivationTechnicianRef {
  id: string;
  name: string;
}

export interface ActivationCustomerRef {
  id: string;
  name: string;
}

export interface ActivationPackageRef {
  id: string;
  code: string;
}

// ====== PAQUETE ======
export interface LicensePackage {
  id: string;
  code: string;
  provider: string | null;
  totalLicenses: number;
  usedLicenses: number;
  remainingLicenses: number;
  stockStatus: PackageStockStatus;
  purchaseDate: string;
  observations: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicensePackageData {
  provider?: string;
  totalLicenses: number;
  purchaseDate: string; // ISO
  observations?: string;
}

export type UpdateLicensePackageData = Partial<CreateLicensePackageData>;

// ====== ACTIVACIÓN ======
export interface LicenseActivation {
  id: string;
  activationDate: string;
  licenseKey: string;
  support: string;
  observations: string | null;
  packageId: string;
  technicianId: string;
  customerId: string;
  package: ActivationPackageRef;
  technician: ActivationTechnicianRef;
  customer: ActivationCustomerRef;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

export interface CreateLicenseActivationData {
  packageId: string;
  activationDate: string; // ISO
  technicianId: string;
  licenseKey: string;
  support: string;
  customerId: string;
  observations?: string;
}

export type UpdateLicenseActivationData = Partial<CreateLicenseActivationData>;

export interface LicenseActivationFilters {
  from?: string; // ISO (inicio de rango)
  to?: string; // ISO (fin de rango)
  technicianId?: string;
  customerId?: string;
  packageId?: string;
}

// ====== RESPUESTAS API ======
export interface LicensePackagesResponse {
  packages: LicensePackage[];
  total: number;
}

export interface LicenseActivationsResponse {
  activations: LicenseActivation[];
  total: number;
}

// ====== FILAS DE EXPORTACIÓN ======
export interface ActivationExportRow {
  activationDate: string;
  technicianName: string;
  customerName: string;
  licenseKey: string;
  support: string;
  packageCode: string;
  observations: string;
}

export interface PackageExportRow {
  code: string;
  provider: string;
  totalLicenses: number;
  usedLicenses: number;
  remainingLicenses: number;
  statusLabel: string;
  purchaseDate: string;
}
