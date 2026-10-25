import test from 'node:test';
import assert from 'node:assert/strict';
import {
  calculateNetWeight,
  calculatePrestationAmount,
  calculateTheoreticalStock,
  calculateStockDiscrepancy,
  validateFuelExit,
  calculateClientBalance,
  determineInvoicePaymentStatus,
  calculateEstimatedMargin,
  canUserValidateTrip,
  canUserValidateFuelDiscrepancy,
  checkVehicleDoubleAssignment,
} from './rules.ts';
import { Invoice, Payment, CreditNote } from '../types/index.ts';

test('RG-01: calculateNetWeight returns accurate net weight from gross and tare', () => {
  assert.equal(calculateNetWeight(45.8, 15.2), 30.6);
  assert.equal(calculateNetWeight(50.0, 18.25), 31.75);
  // Invalid values protection
  assert.equal(calculateNetWeight(10, 15), 0);
  assert.equal(calculateNetWeight(-5, 2), 0);
});

test('RG-01 & RG-02: calculatePrestationAmount computes accurate amounts per unit', () => {
  // Billing by ton: 32 tons * 125,000 GNF/t
  assert.equal(calculatePrestationAmount(32, 'tonne', 125000), 4000000);
  // Billing by trip: 1 trip * 1,500,000 GNF
  assert.equal(calculatePrestationAmount(1, 'voyage', 1500000), 1500000);
  // Billing by day: 1 day * 2,500,000 GNF
  assert.equal(calculatePrestationAmount(1, 'jour', 2500000), 2500000);
});

test('RG-03: calculateTheoreticalStock and calculateStockDiscrepancy', () => {
  // Initial 5000L + Entry 10000L - Exit 8000L = 7000L
  const theoretical = calculateTheoreticalStock(5000, 10000, 8000);
  assert.equal(theoretical, 7000);

  // If measured 6950L -> discrepancy = -50L (loss/shrinkage)
  assert.equal(calculateStockDiscrepancy(6950, theoretical), -50);
  // If measured 7020L -> discrepancy = +20L
  assert.equal(calculateStockDiscrepancy(7020, theoretical), 20);
});

test('CAR-10: validateFuelExit forbids negative stock', () => {
  // 3000L stock, request 1500L -> allowed
  const ok = validateFuelExit(3000, 1500);
  assert.equal(ok.allowed, true);
  assert.equal(ok.remainingAfterExit, 1500);

  // 1000L stock, request 1500L -> disallowed
  const blocked = validateFuelExit(1000, 1500);
  assert.equal(blocked.allowed, false);
  assert.match(blocked.reason || '', /Stock insuffisant/);
});

test('RG-04: calculateClientBalance balances invoices, credit notes and payments', () => {
  const dummyInvoices: Invoice[] = [
    {
      id: 'inv-1',
      invoiceNumber: 'FAC-2026-001',
      clientId: 'cli-smb',
      clientName: 'SMB',
      originType: 'transport',
      periodStart: '2026-10-01',
      periodEnd: '2026-10-15',
      issueDate: '2026-10-16',
      dueDate: '2026-11-15',
      items: [],
      subtotalGNF: 50000000,
      taxRatePercent: 0,
      taxAmountGNF: 0,
      totalGNF: 50000000,
      currency: 'GNF',
      status: 'emise',
      paymentStatus: 'partiellement_payee',
      paidAmountGNF: 20000000,
      remainingAmountGNF: 30000000,
      createdBy: 'u1',
    },
    {
      id: 'inv-2',
      invoiceNumber: 'FAC-2026-002',
      clientId: 'cli-smb',
      clientName: 'SMB',
      originType: 'transport',
      periodStart: '2026-10-16',
      periodEnd: '2026-10-20',
      issueDate: '2026-10-21',
      dueDate: '2026-11-20',
      items: [],
      subtotalGNF: 30000000,
      taxRatePercent: 0,
      taxAmountGNF: 0,
      totalGNF: 30000000,
      currency: 'GNF',
      status: 'emise',
      paymentStatus: 'non_payee',
      paidAmountGNF: 0,
      remainingAmountGNF: 30000000,
      createdBy: 'u1',
    },
  ];

  const dummyCredits: CreditNote[] = [
    {
      id: 'cn-1',
      creditNoteNumber: 'AVO-2026-001',
      originalInvoiceId: 'inv-1',
      originalInvoiceNumber: 'FAC-2026-001',
      amountGNF: 5000000,
      reason: 'Ajustement de pesée',
      issuedBy: 'u-fin',
      date: '2026-10-18',
    },
  ];

  const dummyPayments: Payment[] = [
    {
      id: 'pay-1',
      invoiceId: 'inv-1',
      amountGNF: 20000000,
      date: '2026-10-19',
      paymentMethod: 'virement',
      reference: 'VIR-998822',
      recordedBy: 'u-fin',
      status: 'valide',
    },
  ];

  // Total invoiced: 80,000,000 GNF
  // Credits: 5,000,000 GNF
  // Payments: 20,000,000 GNF
  // Net balance: 80M - 5M - 20M = 55,000,000 GNF
  const balance = calculateClientBalance('cli-smb', dummyInvoices, dummyCredits, dummyPayments);
  assert.equal(balance.totalInvoicedGNF, 80000000);
  assert.equal(balance.totalCreditsGNF, 5000000);
  assert.equal(balance.totalPaidGNF, 20000000);
  assert.equal(balance.netBalanceGNF, 55000000);
});

test('RG-05: determineInvoicePaymentStatus checks overdue vs paid', () => {
  // Fully paid
  assert.equal(
    determineInvoicePaymentStatus({
      status: 'emise',
      totalGNF: 10000000,
      paidAmountGNF: 10000000,
      dueDate: '2026-10-15',
    }, '2026-10-22'),
    'payee'
  );

  // Partially paid and not overdue
  assert.equal(
    determineInvoicePaymentStatus({
      status: 'emise',
      totalGNF: 10000000,
      paidAmountGNF: 4000000,
      dueDate: '2026-11-01',
    }, '2026-10-22'),
    'partiellement_payee'
  );

  // Overdue (due 2026-10-10, today is 2026-10-22)
  assert.equal(
    determineInvoicePaymentStatus({
      status: 'emise',
      totalGNF: 10000000,
      paidAmountGNF: 4000000,
      dueDate: '2026-10-10',
    }, '2026-10-22'),
    'echue'
  );
});

test('SOD-01: canUserValidateTrip blocks self-validation', () => {
  // Operator submits trip -> tries to self-validate
  const selfValidation = canUserValidateTrip('usr-driver-1', 'usr-driver-1', 'superviseur');
  assert.equal(selfValidation.canValidate, false);
  assert.match(selfValidation.reason || '', /SOD-01/);

  // Another supervisor validates -> allowed
  const valid = canUserValidateTrip('usr-driver-1', 'usr-sup-2', 'superviseur');
  assert.equal(valid.canValidate, true);

  // Unauthorized role (e.g. client or chauffeur) tries to validate
  const blockedRole = canUserValidateTrip('usr-driver-1', 'usr-client-1', 'client');
  assert.equal(blockedRole.canValidate, false);
});

test('SOD-04: canUserValidateFuelDiscrepancy restricts who can approve fuel variance', () => {
  // Measurer trying to approve their own variance without being PDG
  const selfCheck = canUserValidateFuelDiscrepancy('usr-agent-fuel', 'usr-agent-fuel', 'carburant');
  assert.equal(selfCheck.canValidate, false);
  assert.match(selfCheck.reason || '', /SOD-04/);

  // Exploitation supervisor or driver cannot approve fuel variance
  const blocked = canUserValidateFuelDiscrepancy('usr-agent-fuel', 'usr-driver', 'chauffeur');
  assert.equal(blocked.canValidate, false);
});

test('FLT-04: checkVehicleDoubleAssignment prevents vehicle collision', () => {
  const activeAssignments = [
    { vehicleId: 'veh-01', contractId: 'ctr-smb-01', status: 'actif' },
    { vehicleId: 'veh-02', contractId: 'ctr-cbg-01', status: 'actif' },
  ];

  // Try to assign veh-01 to another contract ctr-belair-01
  const checkConflict = checkVehicleDoubleAssignment('veh-01', 'ctr-belair-01', activeAssignments);
  assert.equal(checkConflict.hasConflict, true);
  assert.equal(checkConflict.conflictingContractId, 'ctr-smb-01');

  // Assign available veh-03
  const checkOk = checkVehicleDoubleAssignment('veh-03', 'ctr-belair-01', activeAssignments);
  assert.equal(checkOk.hasConflict, false);
});
