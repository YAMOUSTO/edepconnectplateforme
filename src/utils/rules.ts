import { BillingUnit, Invoice, CreditNote, Payment, UserRole, InvoiceStatus, PaymentStatus } from '../types/index.ts';

/**
 * RG-01: Net weight calculation from weigh ticket
 */
export function calculateNetWeight(grossWeightTons: number, tareWeightTons: number): number {
  if (grossWeightTons <= 0 || tareWeightTons < 0 || grossWeightTons < tareWeightTons) {
    return 0;
  }
  // Return rounded to 2 decimals for mining precision
  return Math.round((grossWeightTons - tareWeightTons) * 100) / 100;
}

/**
 * RG-01 & RG-02: Calculate trip or service revenue based on contract billing unit
 */
export function calculatePrestationAmount(
  quantityOrTonnage: number,
  billingUnit: BillingUnit,
  unitRateGNF: number
): number {
  if (unitRateGNF <= 0) return 0;

  switch (billingUnit) {
    case 'tonne':
      return Math.round(quantityOrTonnage * unitRateGNF);
    case 'voyage':
    case 'camion':
    case 'jour':
    case 'mois':
      return Math.round(Math.max(1, quantityOrTonnage) * unitRateGNF);
    default:
      return Math.round(quantityOrTonnage * unitRateGNF);
  }
}

/**
 * RG-03: Fuel theoretical stock calculation
 * Stock théorique = Stock initial + Entrées - Sorties
 */
export function calculateTheoreticalStock(
  initialStockLiters: number,
  totalEntriesLiters: number,
  totalExitsLiters: number
): number {
  return Math.max(0, initialStockLiters + totalEntriesLiters - totalExitsLiters);
}

/**
 * RG-03: Fuel physical inventory discrepancy
 * Écart = Stock physique - Stock théorique
 */
export function calculateStockDiscrepancy(
  physicalStockLiters: number,
  theoreticalStockLiters: number
): number {
  return physicalStockLiters - theoreticalStockLiters;
}

/**
 * CAR-10: Check if fuel exit would render stock negative
 */
export function validateFuelExit(
  currentStockLiters: number,
  requestedExitLiters: number
): { allowed: boolean; remainingAfterExit: number; reason?: string } {
  if (requestedExitLiters <= 0) {
    return { allowed: false, remainingAfterExit: currentStockLiters, reason: 'Le volume demandé doit être supérieur à 0.' };
  }
  const remaining = currentStockLiters - requestedExitLiters;
  if (remaining < 0) {
    return {
      allowed: false,
      remainingAfterExit: currentStockLiters,
      reason: `Stock insuffisant : ${currentStockLiters} L disponibles pour une demande de ${requestedExitLiters} L (stock négatif interdit sans dérogation).`
    };
  }
  return { allowed: true, remainingAfterExit: remaining };
}

/**
 * RG-04: Client net balance calculation
 * Solde client = Factures émises - Avoirs enregistrés - Paiements validés
 */
export function calculateClientBalance(
  clientId: string,
  invoices: Invoice[],
  creditNotes: CreditNote[],
  payments: Payment[]
): { totalInvoicedGNF: number; totalCreditsGNF: number; totalPaidGNF: number; netBalanceGNF: number } {
  const clientInvoices = invoices.filter(
    (inv) => inv.clientId === clientId && (inv.status === 'emise' || inv.status === 'validee')
  );

  const totalInvoicedGNF = clientInvoices.reduce((sum, inv) => sum + inv.totalGNF, 0);

  const clientInvoiceIds = new Set(clientInvoices.map((inv) => inv.id));

  const totalCreditsGNF = creditNotes
    .filter((cn) => clientInvoiceIds.has(cn.originalInvoiceId))
    .reduce((sum, cn) => sum + cn.amountGNF, 0);

  const totalPaidGNF = payments
    .filter((p) => clientInvoiceIds.has(p.invoiceId) && p.status === 'valide')
    .reduce((sum, p) => sum + p.amountGNF, 0);

  const netBalanceGNF = Math.max(0, totalInvoicedGNF - totalCreditsGNF - totalPaidGNF);

  return {
    totalInvoicedGNF,
    totalCreditsGNF,
    totalPaidGNF,
    netBalanceGNF,
  };
}

/**
 * RG-05: Determine invoice calculated payment status
 */
export function determineInvoicePaymentStatus(
  invoice: {
    status: InvoiceStatus;
    totalGNF: number;
    paidAmountGNF: number;
    dueDate: string;
  },
  currentDateStr: string = new Date().toISOString().split('T')[0]
): PaymentStatus {
  if (invoice.status === 'annulee' || invoice.status === 'brouillon') {
    return 'non_payee';
  }

  const remaining = invoice.totalGNF - invoice.paidAmountGNF;

  if (remaining <= 0 && invoice.totalGNF > 0) {
    return 'payee';
  }

  if (invoice.dueDate && invoice.dueDate < currentDateStr && remaining > 0) {
    return 'echue';
  }

  if (invoice.paidAmountGNF > 0 && remaining > 0) {
    return 'partiellement_payee';
  }

  return 'non_payee';
}

/**
 * RG-06: Estimated margin calculation
 * Marge estimée = Recettes facturées - Coûts directs rattachés
 */
export function calculateEstimatedMargin(
  revenueGNF: number,
  directCostsGNF: number
): { marginGNF: number; marginRatePercent: number } {
  const marginGNF = revenueGNF - directCostsGNF;
  const marginRatePercent = revenueGNF > 0 ? Math.round((marginGNF / revenueGNF) * 1000) / 10 : 0;
  return { marginGNF, marginRatePercent };
}

/**
 * SOD-01: Separation of duties for trip validation
 * Un utilisateur ne peut pas valider une opération qu'il a lui-même saisie.
 */
export function canUserValidateTrip(
  tripSubmitterId: string,
  currentUserId: string,
  currentUserRole: UserRole
): { canValidate: boolean; reason?: string } {
  const authorizedRoles: UserRole[] = ['pdg', 'direction', 'exploitation', 'superviseur'];

  if (!authorizedRoles.includes(currentUserRole)) {
    return {
      canValidate: false,
      reason: 'Votre rôle ne vous autorise pas à valider les voyages de minerai.',
    };
  }

  if (tripSubmitterId === currentUserId) {
    return {
      canValidate: false,
      reason: 'Règle SOD-01 : Vous ne pouvez pas valider une opération que vous avez vous-même saisie.',
    };
  }

  return { canValidate: true };
}

/**
 * SOD-04: Fuel inventory discrepancy validation
 * La validation d'un écart de carburant relève du responsable carburant et magasin ou de la direction,
 * jamais de l'agent distributeur ou de la personne ayant réalisé la mesure sans tiers.
 */
export function canUserValidateFuelDiscrepancy(
  measurerId: string,
  currentUserId: string,
  currentUserRole: UserRole
): { canValidate: boolean; reason?: string } {
  const allowedRoles: UserRole[] = ['pdg', 'direction', 'carburant'];

  if (!allowedRoles.includes(currentUserRole)) {
    return {
      canValidate: false,
      reason: 'Seuls le Responsable Carburant, la Direction ou le PDG peuvent valider un écart de stock.',
    };
  }

  if (measurerId === currentUserId && currentUserRole !== 'pdg') {
    return {
      canValidate: false,
      reason: 'Règle SOD-04 : L\'auteur de la mesure ne peut pas approuver son propre écart sans contre-validation.',
    };
  }

  return { canValidate: true };
}

/**
 * SOD-03: Separation of duties for invoice and payment
 */
export function checkInvoiceAndPaymentSeparation(
  invoiceIssuerId: string,
  paymentRecorderId: string
): { compliant: boolean; warning?: string } {
  if (invoiceIssuerId === paymentRecorderId) {
    return {
      compliant: false,
      warning: 'Recommandation SOD-03 : L\'émetteur de la facture et l\'enregistreur du paiement devraient être distincts.',
    };
  }
  return { compliant: true };
}

/**
 * FLT-04: Check vehicle double assignment
 */
export function checkVehicleDoubleAssignment(
  vehicleId: string,
  contractId: string,
  activeAssignments: { vehicleId: string; contractId: string; status: string }[]
): { hasConflict: boolean; conflictingContractId?: string } {
  const conflict = activeAssignments.find(
    (a) => a.vehicleId === vehicleId && a.contractId !== contractId && a.status === 'actif'
  );
  if (conflict) {
    return { hasConflict: true, conflictingContractId: conflict.contractId };
  }
  return { hasConflict: false };
}

/**
 * Format GNF currency with separator
 */
export function formatGNF(amount: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    maximumFractionDigits: 0,
  }).format(amount) + ' GNF';
}
