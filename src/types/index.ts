export type UserRole =
  | 'pdg'
  | 'direction'
  | 'finance'
  | 'commercial'
  | 'exploitation'
  | 'carburant'
  | 'superviseur'
  | 'chauffeur'
  | 'client';

export interface User {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  phone: string;
  active: boolean;
  siteId?: string;
  assignedVehicleId?: string;
  companyName?: string; // For client role
}

export type ContractStatus =
  | 'brouillon'
  | 'soumis'
  | 'actif'
  | 'suspendu'
  | 'termine'
  | 'resilie';

export type ActivityType =
  | 'transport'
  | 'arrosage'
  | 'location_citerne'
  | 'distribution_carburant'
  | 'btp_services';

export type BillingUnit = 'tonne' | 'voyage' | 'camion' | 'jour' | 'mois';

export interface Contract {
  id: string;
  code: string;
  title: string;
  clientId: string;
  clientName: string;
  siteName: string;
  activityType: ActivityType;
  startDate: string;
  endDate: string;
  billingUnit: BillingUnit;
  unitRateGNF: number;
  currency: 'GNF';
  plannedVolume: number;
  status: ContractStatus;
  documentRef?: string;
  notes?: string;
  paymentTermsDays: number;
  createdBy: string;
  approvedBy?: string;
  createdAt: string;
}

export type VehicleStatus =
  | 'disponible'
  | 'mobilise'
  | 'en_panne'
  | 'en_maintenance'
  | 'immobilise';

export type OwnerType = 'edep' | 'partenaire' | 'loueur';

export interface Vehicle {
  id: string;
  code: string;
  plateNumber: string;
  type: 'camion_benne' | 'citerne_carburant' | 'citerne_eau' | 'chargeuse';
  brand: string;
  model: string;
  capacity: number; // Tonnes or Litres
  ownerType: OwnerType;
  ownerName: string;
  status: VehicleStatus;
  assignedContractId?: string;
  assignedDriverId?: string;
  commissioningDate: string;
  odometerKm?: number;
  hoursWorked?: number;
}

export interface Driver {
  id: string;
  name: string;
  phone: string;
  licenseNumber: string;
  licenseExpiryDate: string;
  status: 'actif' | 'repos' | 'inapte';
  assignedVehicleId?: string;
}

export type TripStatus =
  | 'planifie'
  | 'en_cours'
  | 'termine'
  | 'valide'
  | 'annule';

export interface Trip {
  id: string;
  clientTripId: string; // Idempotency key for offline sync
  contractId: string;
  vehicleId: string;
  driverId: string;
  departureSite: string;
  arrivalSite: string;
  product: string; // e.g. "Bauxite brute", "Minerai de fer"
  departureTime: string;
  loadingTime?: string;
  arrivalTime?: string;
  unloadingTime?: string;
  weighTicketNumber: string;
  grossWeightTons: number;
  tareWeightTons: number;
  netWeightTons: number; // gross - tare
  status: TripStatus;
  calculatedAmountGNF: number;
  submittedBy: string;
  validatedBy?: string;
  validationDate?: string;
  rejectionReason?: string;
  isOfflineCreated?: boolean;
  syncStatus: 'synced' | 'pending';
  createdAt: string;
}

export interface Cistern {
  id: string;
  code: string;
  type: 'carburant' | 'eau';
  capacityLiters: number; // 15000, 18000, 20000, 25000
  currentStockLiters: number;
  alertThresholdLiters: number;
  siteName: string;
  status: 'disponible' | 'en_service' | 'maintenance' | 'louee';
  ownerType: OwnerType;
  ownerName: string;
  lastInventoryDate: string;
}

export interface FuelMovement {
  id: string;
  clientMovementId: string;
  cisternId: string;
  type: 'entree' | 'sortie';
  volumeLiters: number;
  unitPriceGNF: number;
  supplierName?: string;
  deliveryNoteNumber?: string;
  beneficiaryType?: 'camion' | 'engin' | 'generateur' | 'client_tiers';
  beneficiaryVehicleId?: string;
  beneficiaryDriverName?: string;
  contractId?: string;
  siteName: string;
  agentResponsibleId: string;
  agentResponsibleName: string;
  odometerKm?: number;
  justification?: string;
  date: string;
  status: 'saisi' | 'valide' | 'annule';
  syncStatus: 'synced' | 'pending';
}

export interface FuelInventory {
  id: string;
  cisternId: string;
  theoreticalStockLiters: number;
  measuredPhysicalStockLiters: number;
  discrepancyLiters: number; // physical - theoretical
  date: string;
  measuredBy: string;
  explanation?: string;
  approvedBy?: string;
  approvalDate?: string;
  status: 'ouvert' | 'explique' | 'valide';
}

export interface WateringRun {
  id: string;
  clientRunId: string;
  siteName: string;
  roadZone: string;
  cisternVehicleId: string;
  driverName: string;
  fillingPoint: string;
  rotationsCount: number;
  estimatedVolumeLiters: number;
  date: string;
  status: 'saisi' | 'valide';
  supervisorName: string;
  contractId: string;
  syncStatus: 'synced' | 'pending';
}

export interface Breakdown {
  id: string;
  vehicleId: string;
  reportedDate: string;
  issueDescription: string;
  location: string;
  reportedBy: string;
  estimatedCostGNF: number;
  actualCostGNF?: number;
  status: 'en_cours' | 'repare' | 'en_attente_pieces';
  resolvedDate?: string;
  contractId?: string;
}

export interface InvoiceItem {
  id: string;
  description: string;
  quantity: number;
  unit: BillingUnit | 'litre' | 'forfait';
  unitPriceGNF: number;
  totalGNF: number;
}

export type InvoiceStatus =
  | 'brouillon'
  | 'validee'
  | 'emise'
  | 'annulee'
  | 'remplacee';

export type PaymentStatus =
  | 'non_payee'
  | 'partiellement_payee'
  | 'payee'
  | 'echue';

export interface Invoice {
  id: string;
  invoiceNumber: string; // e.g. "FAC-2026-0001"
  clientId: string;
  clientName: string;
  clientNIF?: string;
  clientAddress?: string;
  contractId?: string;
  originType: ActivityType | 'manuel';
  periodStart: string;
  periodEnd: string;
  issueDate: string;
  dueDate: string;
  items: InvoiceItem[];
  subtotalGNF: number;
  taxRatePercent: number; // e.g. 18% or 0%
  taxAmountGNF: number;
  totalGNF: number;
  currency: 'GNF';
  status: InvoiceStatus;
  paymentStatus: PaymentStatus;
  paidAmountGNF: number;
  remainingAmountGNF: number;
  createdBy: string;
  issuedBy?: string;
  notes?: string;
  creditNoteId?: string;
}

export interface Payment {
  id: string;
  invoiceId: string;
  amountGNF: number;
  date: string;
  paymentMethod: 'virement' | 'cheque' | 'especes' | 'orange_money' | 'mtn_momo';
  reference: string;
  recordedBy: string;
  receiptRef?: string;
  status: 'valide' | 'annule';
  cancellationReason?: string;
  cancelledBy?: string;
}

export interface CreditNote {
  id: string;
  creditNoteNumber: string; // e.g. "AVO-2026-0001"
  originalInvoiceId: string;
  originalInvoiceNumber: string;
  amountGNF: number;
  reason: string;
  issuedBy: string;
  date: string;
}

export interface AuditLog {
  id: string;
  timestamp: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  action: string;
  entityType: string;
  entityId: string;
  previousValue?: string;
  newValue?: string;
  reason?: string;
}

export interface OfflineQueueItem {
  id: string;
  type: 'trip' | 'fuel_movement' | 'watering_run';
  payload: any;
  createdAt: string;
  status: 'pending' | 'synced' | 'conflict';
}
