import React, { createContext, useContext, useState, useEffect } from 'react';
import {
  User,
  UserRole,
  Contract,
  Vehicle,
  Driver,
  Trip,
  Cistern,
  FuelMovement,
  FuelInventory,
  WateringRun,
  Breakdown,
  Invoice,
  Payment,
  CreditNote,
  AuditLog,
  OfflineQueueItem,
} from '../types/index.ts';
import {
  INITIAL_USERS,
  INITIAL_CONTRACTS,
  INITIAL_VEHICLES,
  INITIAL_DRIVERS,
  INITIAL_TRIPS,
  INITIAL_CISTERNS,
  INITIAL_FUEL_MOVEMENTS,
  INITIAL_FUEL_INVENTORIES,
  INITIAL_WATERING_RUNS,
  INITIAL_BREAKDOWNS,
  INITIAL_INVOICES,
  INITIAL_PAYMENTS,
  INITIAL_CREDIT_NOTES,
  INITIAL_AUDIT_LOGS,
} from '../data/mockData.ts';
import {
  calculateNetWeight,
  calculatePrestationAmount,
  calculateTheoreticalStock,
  calculateStockDiscrepancy,
  validateFuelExit,
  canUserValidateTrip,
  canUserValidateFuelDiscrepancy,
  checkVehicleDoubleAssignment,
  determineInvoicePaymentStatus,
} from '../utils/rules.ts';

interface AppContextType {
  currentUser: User;
  setCurrentUser: (user: User) => void;
  users: User[];
  isOfflineMode: boolean;
  toggleOfflineMode: () => void;
  offlineQueue: OfflineQueueItem[];
  synchronizeOfflineQueue: () => { syncedCount: number; message: string };

  contracts: Contract[];
  addContract: (contract: Omit<Contract, 'id' | 'createdAt'>) => { success: boolean; message: string };
  updateContractStatus: (contractId: string, newStatus: Contract['status'], reason: string) => { success: boolean; message: string };

  vehicles: Vehicle[];
  addVehicle: (vehicle: Omit<Vehicle, 'id'>) => { success: boolean; message: string };
  updateVehicleStatus: (vehicleId: string, status: Vehicle['status']) => void;

  drivers: Driver[];
  trips: Trip[];
  addTrip: (tripData: {
    contractId: string;
    vehicleId: string;
    driverId: string;
    departureSite: string;
    arrivalSite: string;
    product: string;
    grossWeightTons: number;
    tareWeightTons: number;
    weighTicketNumber: string;
  }) => { success: boolean; message: string };
  validateTrip: (tripId: string) => { success: boolean; message: string };

  cisterns: Cistern[];
  fuelMovements: FuelMovement[];
  addFuelMovement: (movement: {
    cisternId: string;
    type: 'entree' | 'sortie';
    volumeLiters: number;
    unitPriceGNF: number;
    supplierName?: string;
    deliveryNoteNumber?: string;
    beneficiaryVehicleId?: string;
    beneficiaryDriverName?: string;
    contractId?: string;
    siteName: string;
    odometerKm?: number;
    justification?: string;
  }) => { success: boolean; message: string };

  fuelInventories: FuelInventory[];
  recordFuelInventory: (cisternId: string, measuredPhysicalStockLiters: number, explanation: string) => { success: boolean; message: string };
  validateFuelDiscrepancy: (inventoryId: string, reason: string) => { success: boolean; message: string };

  wateringRuns: WateringRun[];
  addWateringRun: (run: Omit<WateringRun, 'id' | 'clientRunId' | 'status' | 'syncStatus'>) => { success: boolean; message: string };
  validateWateringRun: (runId: string) => void;

  breakdowns: Breakdown[];
  reportBreakdown: (breakdown: Omit<Breakdown, 'id' | 'status'>) => void;
  resolveBreakdown: (breakdownId: string, actualCostGNF: number) => void;

  invoices: Invoice[];
  createInvoiceFromPrestations: (
    clientId: string,
    contractId: string,
    periodStart: string,
    periodEnd: string,
    taxRatePercent: number,
    notes?: string
  ) => { success: boolean; invoiceId?: string; message: string };
  emitInvoice: (invoiceId: string) => { success: boolean; message: string };
  recordPayment: (payment: {
    invoiceId: string;
    amountGNF: number;
    paymentMethod: Payment['paymentMethod'];
    reference: string;
  }) => { success: boolean; message: string };
  issueCreditNote: (originalInvoiceId: string, amountGNF: number, reason: string) => { success: boolean; message: string };

  payments: Payment[];
  creditNotes: CreditNote[];
  auditLogs: AuditLog[];

  // Helper check for permissions
  canAccess: (permission: string) => boolean;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  // Current logged in user (defaults to a new admin user if none exists)
  const [currentUser, setCurrentUser] = useState<User>(() => {
    const saved = localStorage.getItem('edep_user');
    if (saved) return JSON.parse(saved);
    return {
      id: 'usr-admin',
      name: 'Administrateur',
      email: 'admin@edep.local',
      role: 'pdg',
      phone: '',
      active: true,
    };
  });

  const [users, setUsers] = useState<User[]>(() => {
    const saved = localStorage.getItem('edep_users');
    return saved ? JSON.parse(saved) : INITIAL_USERS;
  });
  const [isOfflineMode, setIsOfflineMode] = useState<boolean>(false);
  const [offlineQueue, setOfflineQueue] = useState<OfflineQueueItem[]>(() => {
    const saved = localStorage.getItem('edep_offline_queue');
    return saved ? JSON.parse(saved) : [];
  });

  const [contracts, setContracts] = useState<Contract[]>(() => {
    const saved = localStorage.getItem('edep_contracts');
    return saved ? JSON.parse(saved) : INITIAL_CONTRACTS;
  });

  const [vehicles, setVehicles] = useState<Vehicle[]>(() => {
    const saved = localStorage.getItem('edep_vehicles');
    return saved ? JSON.parse(saved) : INITIAL_VEHICLES;
  });

  const [drivers] = useState<Driver[]>(INITIAL_DRIVERS);

  const [trips, setTrips] = useState<Trip[]>(() => {
    const saved = localStorage.getItem('edep_trips');
    return saved ? JSON.parse(saved) : INITIAL_TRIPS;
  });

  const [cisterns, setCisterns] = useState<Cistern[]>(() => {
    const saved = localStorage.getItem('edep_cisterns');
    return saved ? JSON.parse(saved) : INITIAL_CISTERNS;
  });

  const [fuelMovements, setFuelMovements] = useState<FuelMovement[]>(() => {
    const saved = localStorage.getItem('edep_fuel_movements');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_MOVEMENTS;
  });

  const [fuelInventories, setFuelInventories] = useState<FuelInventory[]>(() => {
    const saved = localStorage.getItem('edep_fuel_inventories');
    return saved ? JSON.parse(saved) : INITIAL_FUEL_INVENTORIES;
  });

  const [wateringRuns, setWateringRuns] = useState<WateringRun[]>(() => {
    const saved = localStorage.getItem('edep_watering');
    return saved ? JSON.parse(saved) : INITIAL_WATERING_RUNS;
  });

  const [breakdowns, setBreakdowns] = useState<Breakdown[]>(() => {
    const saved = localStorage.getItem('edep_breakdowns');
    return saved ? JSON.parse(saved) : INITIAL_BREAKDOWNS;
  });

  const [invoices, setInvoices] = useState<Invoice[]>(() => {
    const saved = localStorage.getItem('edep_invoices');
    return saved ? JSON.parse(saved) : INITIAL_INVOICES;
  });

  const [payments, setPayments] = useState<Payment[]>(() => {
    const saved = localStorage.getItem('edep_payments');
    return saved ? JSON.parse(saved) : INITIAL_PAYMENTS;
  });

  const [creditNotes, setCreditNotes] = useState<CreditNote[]>(() => {
    const saved = localStorage.getItem('edep_credit_notes');
    return saved ? JSON.parse(saved) : INITIAL_CREDIT_NOTES;
  });

  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => {
    const saved = localStorage.getItem('edep_audit_logs');
    return saved ? JSON.parse(saved) : INITIAL_AUDIT_LOGS;
  });

  // Sync state to localStorage for persistence
  useEffect(() => {
    localStorage.setItem('edep_user', JSON.stringify(currentUser));
  }, [currentUser]);

  useEffect(() => {
    localStorage.setItem('edep_users', JSON.stringify(users));
  }, [users]);

  useEffect(() => {
    localStorage.setItem('edep_contracts', JSON.stringify(contracts));
  }, [contracts]);

  useEffect(() => {
    localStorage.setItem('edep_vehicles', JSON.stringify(vehicles));
  }, [vehicles]);

  useEffect(() => {
    localStorage.setItem('edep_trips', JSON.stringify(trips));
  }, [trips]);

  useEffect(() => {
    localStorage.setItem('edep_cisterns', JSON.stringify(cisterns));
  }, [cisterns]);

  useEffect(() => {
    localStorage.setItem('edep_fuel_movements', JSON.stringify(fuelMovements));
  }, [fuelMovements]);

  useEffect(() => {
    localStorage.setItem('edep_fuel_inventories', JSON.stringify(fuelInventories));
  }, [fuelInventories]);

  useEffect(() => {
    localStorage.setItem('edep_watering', JSON.stringify(wateringRuns));
  }, [wateringRuns]);

  useEffect(() => {
    localStorage.setItem('edep_breakdowns', JSON.stringify(breakdowns));
  }, [breakdowns]);

  useEffect(() => {
    localStorage.setItem('edep_invoices', JSON.stringify(invoices));
  }, [invoices]);

  useEffect(() => {
    localStorage.setItem('edep_payments', JSON.stringify(payments));
  }, [payments]);

  useEffect(() => {
    localStorage.setItem('edep_credit_notes', JSON.stringify(creditNotes));
  }, [creditNotes]);

  useEffect(() => {
    localStorage.setItem('edep_audit_logs', JSON.stringify(auditLogs));
  }, [auditLogs]);

  useEffect(() => {
    localStorage.setItem('edep_offline_queue', JSON.stringify(offlineQueue));
  }, [offlineQueue]);

  // Record audit log helper
  const logAudit = (
    action: string,
    entityType: string,
    entityId: string,
    previousValue?: string,
    newValue?: string,
    reason?: string
  ) => {
    const newLog: AuditLog = {
      id: 'aud-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6),
      timestamp: new Date().toISOString().replace('T', ' ').substring(0, 19),
      userId: currentUser.id,
      userName: currentUser.name,
      userRole: currentUser.role,
      action,
      entityType,
      entityId,
      previousValue,
      newValue,
      reason: reason || 'Action utilisateur',
    };
    setAuditLogs((prev) => [newLog, ...prev]);
  };

  const toggleOfflineMode = () => {
    setIsOfflineMode((prev) => !prev);
  };

  // Synchronize offline queue when network is restored
  const synchronizeOfflineQueue = () => {
    if (offlineQueue.length === 0) {
      return { syncedCount: 0, message: 'Aucun enregistrement en attente de synchronisation.' };
    }

    let count = 0;
    offlineQueue.forEach((item) => {
      if (item.type === 'trip') {
        setTrips((prev) => {
          // Check idempotency (RG-10)
          if (prev.some((t) => t.clientTripId === item.payload.clientTripId)) {
            return prev;
          }
          return [item.payload, ...prev];
        });
        count++;
      } else if (item.type === 'fuel_movement') {
        setFuelMovements((prev) => {
          if (prev.some((m) => m.clientMovementId === item.payload.clientMovementId)) {
            return prev;
          }
          return [item.payload, ...prev];
        });
        count++;
      } else if (item.type === 'watering_run') {
        setWateringRuns((prev) => {
          if (prev.some((w) => w.clientRunId === item.payload.clientRunId)) {
            return prev;
          }
          return [item.payload, ...prev];
        });
        count++;
      }
    });

    setOfflineQueue([]);
    logAudit('SYNCHRONISATION_HORS_LIGNE', 'System', 'offline_queue', `${count} éléments`, 'synchronisé', 'Retour de la connectivité réseau');
    return { syncedCount: count, message: `Synchronisation réussie de ${count} élément(s) de terrain sans doublon.` };
  };

  // Permissions helper based on Annexe B
  const canAccess = (feature: string): boolean => {
    const role = currentUser.role;
    if (role === 'pdg') return true;

    switch (feature) {
      case 'contracts_manage':
        return ['direction', 'exploitation', 'commercial'].includes(role);
      case 'contracts_validate':
        return ['pdg', 'direction'].includes(role);
      case 'trip_submit':
        return ['pdg', 'exploitation', 'superviseur', 'chauffeur'].includes(role);
      case 'trip_validate':
        return ['pdg', 'direction', 'exploitation', 'superviseur'].includes(role);
      case 'fuel_manage':
        return ['pdg', 'carburant', 'superviseur'].includes(role);
      case 'fuel_discrepancy_validate':
        return ['pdg', 'direction', 'carburant'].includes(role);
      case 'invoice_create':
      case 'invoice_emit':
      case 'payment_record':
        return ['pdg', 'finance'].includes(role);
      case 'dashboard_financial':
        return ['pdg', 'direction', 'finance'].includes(role);
      case 'admin_manage':
        return role === 'pdg';
      default:
        return true;
    }
  };

  // Contract management
  const addContract = (data: Omit<Contract, 'id' | 'createdAt'>) => {
    if (!canAccess('contracts_manage') && currentUser.role !== 'pdg') {
      return { success: false, message: 'Droit insuffisant pour créer un contrat.' };
    }
    const newContract: Contract = {
      ...data,
      id: 'ctr-' + Date.now(),
      createdAt: new Date().toISOString().split('T')[0],
      createdBy: currentUser.id,
    };
    setContracts((prev) => [newContract, ...prev]);
    logAudit('CREATION_CONTRAT', 'Contract', newContract.id, undefined, newContract.code, `Nouveau contrat pour ${newContract.clientName}`);
    return { success: true, message: `Contrat ${newContract.code} enregistré avec succès.` };
  };

  const updateContractStatus = (contractId: string, newStatus: Contract['status'], reason: string) => {
    const target = contracts.find((c) => c.id === contractId);
    if (!target) return { success: false, message: 'Contrat non trouvé.' };

    if ((newStatus === 'actif' || newStatus === 'resilie') && !canAccess('contracts_validate')) {
      return { success: false, message: 'Seule la Direction ou le PDG peut activer ou résilier un contrat.' };
    }

    setContracts((prev) =>
      prev.map((c) => (c.id === contractId ? { ...c, status: newStatus, approvedBy: currentUser.id } : c))
    );
    logAudit('MODIFICATION_STATUT_CONTRAT', 'Contract', contractId, target.status, newStatus, reason);
    return { success: true, message: `Statut du contrat mis à jour vers: ${newStatus}` };
  };

  // Vehicles
  const addVehicle = (data: Omit<Vehicle, 'id'>) => {
    const newVeh: Vehicle = {
      ...data,
      id: 'veh-' + Date.now(),
    };
    setVehicles((prev) => [newVeh, ...prev]);
    logAudit('AJOUT_VEHICULE', 'Vehicle', newVeh.id, undefined, newVeh.code, `Véhicule ${newVeh.plateNumber} ajouté à la flotte`);
    return { success: true, message: `Véhicule ${newVeh.code} ajouté avec succès.` };
  };

  const updateVehicleStatus = (vehicleId: string, status: Vehicle['status']) => {
    setVehicles((prev) =>
      prev.map((v) => (v.id === vehicleId ? { ...v, status } : v))
    );
  };

  // Trips (Transport bauxite)
  const addTrip = (tripData: {
    contractId: string;
    vehicleId: string;
    driverId: string;
    departureSite: string;
    arrivalSite: string;
    product: string;
    grossWeightTons: number;
    tareWeightTons: number;
    weighTicketNumber: string;
  }) => {
    // Check ticket unique number (TRN-03)
    const existingTicket = trips.find((t) => t.weighTicketNumber.toLowerCase() === tripData.weighTicketNumber.trim().toLowerCase());
    if (existingTicket) {
      return {
        success: false,
        message: `Erreur TRN-03 : Le ticket de pesée "${tripData.weighTicketNumber}" a déjà été enregistré pour le voyage ${existingTicket.id}. Doublon interdit.`
      };
    }

    const contract = contracts.find((c) => c.id === tripData.contractId);
    if (!contract) return { success: false, message: 'Contrat introuvable.' };

    const netWeight = calculateNetWeight(tripData.grossWeightTons, tripData.tareWeightTons);
    const amount = calculatePrestationAmount(netWeight, contract.billingUnit, contract.unitRateGNF);

    const clientTripId = 'offline-trp-' + Date.now() + '-' + Math.random().toString(36).substring(2, 6);
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newTrip: Trip = {
      id: 'trp-' + Date.now(),
      clientTripId,
      contractId: tripData.contractId,
      vehicleId: tripData.vehicleId,
      driverId: tripData.driverId,
      departureSite: tripData.departureSite,
      arrivalSite: tripData.arrivalSite,
      product: tripData.product,
      departureTime: nowStr,
      weighTicketNumber: tripData.weighTicketNumber.trim(),
      grossWeightTons: tripData.grossWeightTons,
      tareWeightTons: tripData.tareWeightTons,
      netWeightTons: netWeight,
      status: 'termine', // Prêt pour validation par superviseur distinct
      calculatedAmountGNF: amount,
      submittedBy: currentUser.id,
      isOfflineCreated: isOfflineMode,
      syncStatus: isOfflineMode ? 'pending' : 'synced',
      createdAt: nowStr,
    };

    if (isOfflineMode) {
      // Put in offline queue (HC-01)
      const offlineItem: OfflineQueueItem = {
        id: 'queue-' + Date.now(),
        type: 'trip',
        payload: newTrip,
        createdAt: new Date().toISOString(),
        status: 'pending',
      };
      setOfflineQueue((prev) => [offlineItem, ...prev]);
      return {
        success: true,
        message: 'Voyage et ticket de pesée enregistrés hors connexion dans la file locale. Sera synchronisé au retour du réseau.',
      };
    }

    setTrips((prev) => [newTrip, ...prev]);
    logAudit('ENREGISTREMENT_VOYAGE', 'Trip', newTrip.id, undefined, newTrip.weighTicketNumber, `Poids net ${netWeight}T - Montant ${amount} GNF`);
    return { success: true, message: `Voyage ${newTrip.weighTicketNumber} enregistré avec succès (en attente de validation).` };
  };

  const validateTrip = (tripId: string) => {
    const trip = trips.find((t) => t.id === tripId);
    if (!trip) return { success: false, message: 'Voyage non trouvé.' };

    // Apply SOD-01
    const sodCheck = canUserValidateTrip(trip.submittedBy, currentUser.id, currentUser.role);
    if (!sodCheck.canValidate) {
      return { success: false, message: sodCheck.reason || 'Validation interdite.' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);
    setTrips((prev) =>
      prev.map((t) =>
        t.id === tripId
          ? { ...t, status: 'valide', validatedBy: currentUser.id, validationDate: nowStr }
          : t
      )
    );

    logAudit('VALIDATION_VOYAGE', 'Trip', trip.id, trip.status, 'valide', `Ticket ${trip.weighTicketNumber} validé par ${currentUser.name}`);
    return { success: true, message: `Voyage ${trip.weighTicketNumber} validé avec succès.` };
  };

  // Fuel Movements
  const addFuelMovement = (data: {
    cisternId: string;
    type: 'entree' | 'sortie';
    volumeLiters: number;
    unitPriceGNF: number;
    supplierName?: string;
    deliveryNoteNumber?: string;
    beneficiaryVehicleId?: string;
    beneficiaryDriverName?: string;
    contractId?: string;
    siteName: string;
    odometerKm?: number;
    justification?: string;
  }) => {
    const cistern = cisterns.find((c) => c.id === data.cisternId);
    if (!cistern) return { success: false, message: 'Citerne introuvable.' };

    // CAR-10: check negative stock on exit
    if (data.type === 'sortie') {
      const exitCheck = validateFuelExit(cistern.currentStockLiters, data.volumeLiters);
      if (!exitCheck.allowed) {
        return { success: false, message: exitCheck.reason || 'Opération refusée (stock insuffisant).' };
      }
    }

    const clientMovementId = 'mov-local-' + Date.now();
    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    const newMovement: FuelMovement = {
      id: 'mov-' + Date.now(),
      clientMovementId,
      cisternId: data.cisternId,
      type: data.type,
      volumeLiters: data.volumeLiters,
      unitPriceGNF: data.unitPriceGNF,
      supplierName: data.supplierName,
      deliveryNoteNumber: data.deliveryNoteNumber,
      beneficiaryVehicleId: data.beneficiaryVehicleId,
      beneficiaryDriverName: data.beneficiaryDriverName,
      contractId: data.contractId,
      siteName: data.siteName,
      agentResponsibleId: currentUser.id,
      agentResponsibleName: currentUser.name,
      odometerKm: data.odometerKm,
      justification: data.justification,
      date: nowStr,
      status: 'valide',
      syncStatus: isOfflineMode ? 'pending' : 'synced',
    };

    if (isOfflineMode) {
      setOfflineQueue((prev) => [
        {
          id: 'queue-' + Date.now(),
          type: 'fuel_movement',
          payload: newMovement,
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        ...prev,
      ]);
      return { success: true, message: 'Sortie de carburant enregistrée hors ligne (marquée à rapprocher).' };
    }

    // Update cistern stock
    const newStock =
      data.type === 'entree'
        ? cistern.currentStockLiters + data.volumeLiters
        : cistern.currentStockLiters - data.volumeLiters;

    setCisterns((prev) =>
      prev.map((c) => (c.id === data.cisternId ? { ...c, currentStockLiters: newStock } : c))
    );

    setFuelMovements((prev) => [newMovement, ...prev]);
    logAudit(
      data.type === 'entree' ? 'RECEPTION_CARBURANT' : 'DISTRIBUTION_CARBURANT',
      'FuelMovement',
      newMovement.id,
      `${cistern.currentStockLiters} L`,
      `${newStock} L`,
      `${data.volumeLiters} L (${data.type}) sur citerne ${cistern.code}`
    );

    return {
      success: true,
      message: `${data.type === 'entree' ? 'Entrée' : 'Distribution'} de ${data.volumeLiters} L validée. Nouveau stock : ${newStock} L.`,
    };
  };

  // Fuel Inventory & Discrepancies
  const recordFuelInventory = (cisternId: string, measuredPhysicalStockLiters: number, explanation: string) => {
    const cistern = cisterns.find((c) => c.id === cisternId);
    if (!cistern) return { success: false, message: 'Citerne introuvable.' };

    const theoretical = cistern.currentStockLiters;
    const discrepancy = calculateStockDiscrepancy(measuredPhysicalStockLiters, theoretical);

    const newInventory: FuelInventory = {
      id: 'inv-carb-' + Date.now(),
      cisternId,
      theoreticalStockLiters: theoretical,
      measuredPhysicalStockLiters,
      discrepancyLiters: discrepancy,
      date: new Date().toISOString().replace('T', ' ').substring(0, 16),
      measuredBy: currentUser.id,
      explanation,
      status: explanation ? 'explique' : 'ouvert',
    };

    setFuelInventories((prev) => [newInventory, ...prev]);
    logAudit(
      'INVENTAIRE_PHYSIQUE_CARBURANT',
      'FuelInventory',
      newInventory.id,
      `Théorique ${theoretical} L`,
      `Physique ${measuredPhysicalStockLiters} L`,
      `Écart de ${discrepancy} L constaté sur ${cistern.code}`
    );

    return {
      success: true,
      message: `Inventaire enregistré. Écart mesuré : ${discrepancy > 0 ? '+' : ''}${discrepancy} L. En attente de validation par un tiers autorisé.`,
    };
  };

  const validateFuelDiscrepancy = (inventoryId: string, reason: string) => {
    const inv = fuelInventories.find((i) => i.id === inventoryId);
    if (!inv) return { success: false, message: 'Inventaire non trouvé.' };

    const sodCheck = canUserValidateFuelDiscrepancy(inv.measuredBy, currentUser.id, currentUser.role);
    if (!sodCheck.canValidate) {
      return { success: false, message: sodCheck.reason || 'Validation non autorisée (SOD-04).' };
    }

    const nowStr = new Date().toISOString().replace('T', ' ').substring(0, 16);

    // Apply adjustment to cistern stock
    setCisterns((prev) =>
      prev.map((c) =>
        c.id === inv.cisternId
          ? { ...c, currentStockLiters: inv.measuredPhysicalStockLiters, lastInventoryDate: nowStr.split(' ')[0] }
          : c
      )
    );

    setFuelInventories((prev) =>
      prev.map((i) =>
        i.id === inventoryId
          ? { ...i, status: 'valide', approvedBy: currentUser.id, approvalDate: nowStr }
          : i
      )
    );

    logAudit(
      'VALIDATION_ECART_STOCK',
      'FuelInventory',
      inventoryId,
      `${inv.theoreticalStockLiters} L`,
      `${inv.measuredPhysicalStockLiters} L`,
      `Écart validé par ${currentUser.name} : ${reason}`
    );

    return { success: true, message: `Écart de stock validé avec succès. Le stock physique fait désormais foi.` };
  };

  // Watering runs
  const addWateringRun = (run: Omit<WateringRun, 'id' | 'clientRunId' | 'status' | 'syncStatus'>) => {
    const clientRunId = 'wtr-local-' + Date.now();
    const newRun: WateringRun = {
      ...run,
      id: 'wtr-' + Date.now(),
      clientRunId,
      status: 'valide',
      syncStatus: isOfflineMode ? 'pending' : 'synced',
    };

    if (isOfflineMode) {
      setOfflineQueue((prev) => [
        {
          id: 'queue-' + Date.now(),
          type: 'watering_run',
          payload: newRun,
          createdAt: new Date().toISOString(),
          status: 'pending',
        },
        ...prev,
      ]);
      return { success: true, message: 'Rotation d\'arrosage enregistrée hors ligne.' };
    }

    setWateringRuns((prev) => [newRun, ...prev]);
    return { success: true, message: 'Rapport d\'arrosage enregistré avec succès.' };
  };

  const validateWateringRun = (runId: string) => {
    setWateringRuns((prev) =>
      prev.map((w) => (w.id === runId ? { ...w, status: 'valide' } : w))
    );
  };

  // Breakdowns
  const reportBreakdown = (data: Omit<Breakdown, 'id' | 'status'>) => {
    const newBreakdown: Breakdown = {
      ...data,
      id: 'brk-' + Date.now(),
      status: 'en_cours',
    };
    setBreakdowns((prev) => [newBreakdown, ...prev]);
    // Set vehicle status to en_panne
    setVehicles((prev) =>
      prev.map((v) => (v.id === data.vehicleId ? { ...v, status: 'en_panne' } : v))
    );
    logAudit('DECLARATION_PANNE', 'Breakdown', newBreakdown.id, undefined, 'en_panne', data.issueDescription);
  };

  const resolveBreakdown = (breakdownId: string, actualCostGNF: number) => {
    const brk = breakdowns.find((b) => b.id === breakdownId);
    if (!brk) return;

    const nowStr = new Date().toISOString().split('T')[0];
    setBreakdowns((prev) =>
      prev.map((b) =>
        b.id === breakdownId
          ? { ...b, status: 'repare', actualCostGNF, resolvedDate: nowStr }
          : b
      )
    );
    // Restore vehicle to disponible
    setVehicles((prev) =>
      prev.map((v) => (v.id === brk.vehicleId ? { ...v, status: 'disponible' } : v))
    );
    logAudit('REMISE_EN_SERVICE', 'Vehicle', brk.vehicleId, 'en_panne', 'disponible', `Réparation effectuée, coût: ${actualCostGNF} GNF`);
  };

  // Invoices & Payments (FIN)
  const createInvoiceFromPrestations = (
    clientId: string,
    contractId: string,
    periodStart: string,
    periodEnd: string,
    taxRatePercent: number,
    notes?: string
  ) => {
    if (!canAccess('invoice_create')) {
      return { success: false, message: 'Droit insuffisant pour créer une facture.' };
    }

    const contract = contracts.find((c) => c.id === contractId);
    if (!contract) return { success: false, message: 'Contrat non trouvé.' };

    // Find validated trips for this contract within period
    const validTrips = trips.filter(
      (t) =>
        t.contractId === contractId &&
        t.status === 'valide' &&
        t.createdAt >= periodStart &&
        t.createdAt <= periodEnd + ' 23:59'
    );

    let subtotal = 0;
    const items: Invoice['items'] = [];

    if (contract.billingUnit === 'tonne') {
      const totalTons = validTrips.reduce((sum, t) => sum + t.netWeightTons, 0);
      subtotal = Math.round(totalTons * contract.unitRateGNF);
      items.push({
        id: 'item-1',
        description: `Prestation transport bauxite selon ${validTrips.length} tickets de pesée validés`,
        quantity: totalTons,
        unit: 'tonne',
        unitPriceGNF: contract.unitRateGNF,
        totalGNF: subtotal,
      });
    } else {
      // Periodic or trip
      const qty = validTrips.length > 0 ? validTrips.length : 1;
      subtotal = Math.round(qty * contract.unitRateGNF);
      items.push({
        id: 'item-1',
        description: `Prestation contractuelle (${contract.activityType})`,
        quantity: qty,
        unit: contract.billingUnit,
        unitPriceGNF: contract.unitRateGNF,
        totalGNF: subtotal,
      });
    }

    const taxAmount = Math.round((subtotal * taxRatePercent) / 100);
    const total = subtotal + taxAmount;

    // Sequential number without gaps
    const nextNum = invoices.length + 1;
    const invoiceNumber = `FAC-2026-${String(nextNum).padStart(4, '0')}`;

    const newInvoice: Invoice = {
      id: 'inv-' + Date.now(),
      invoiceNumber,
      clientId,
      clientName: contract.clientName,
      contractId,
      originType: contract.activityType,
      periodStart,
      periodEnd,
      issueDate: new Date().toISOString().split('T')[0],
      dueDate: new Date(Date.now() + contract.paymentTermsDays * 24 * 3600 * 1000).toISOString().split('T')[0],
      items,
      subtotalGNF: subtotal,
      taxRatePercent,
      taxAmountGNF: taxAmount,
      totalGNF: total,
      currency: 'GNF',
      status: 'brouillon',
      paymentStatus: 'non_payee',
      paidAmountGNF: 0,
      remainingAmountGNF: total,
      createdBy: currentUser.id,
      notes: notes || `Généré à partir de ${validTrips.length} pesées validées.`,
    };

    setInvoices((prev) => [newInvoice, ...prev]);
    logAudit('CREATION_FACTURE_BROUILLON', 'Invoice', newInvoice.id, undefined, newInvoice.invoiceNumber, `Brouillon ${newInvoice.totalGNF} GNF`);

    return { success: true, invoiceId: newInvoice.id, message: `Brouillon de facture ${invoiceNumber} généré avec succès.` };
  };

  const emitInvoice = (invoiceId: string) => {
    const inv = invoices.find((i) => i.id === invoiceId);
    if (!inv) return { success: false, message: 'Facture non trouvée.' };
    if (inv.status === 'emise') return { success: false, message: 'Cette facture est déjà émise et verrouillée.' };

    setInvoices((prev) =>
      prev.map((i) =>
        i.id === invoiceId
          ? { ...i, status: 'emise', issuedBy: currentUser.id, issueDate: new Date().toISOString().split('T')[0] }
          : i
      )
    );

    logAudit('EMISSION_FACTURE', 'Invoice', invoiceId, inv.status, 'emise', `Émission officielle ${inv.invoiceNumber} non modifiable (RG-08 / FIN-06)`);
    return { success: true, message: `Facture ${inv.invoiceNumber} émise avec succès. Elle est désormais définitivement verrouillée.` };
  };

  const recordPayment = (data: {
    invoiceId: string;
    amountGNF: number;
    paymentMethod: Payment['paymentMethod'];
    reference: string;
  }) => {
    const inv = invoices.find((i) => i.id === data.invoiceId);
    if (!inv) return { success: false, message: 'Facture introuvable.' };

    if (data.amountGNF <= 0) {
      return { success: false, message: 'Le montant du paiement doit être supérieur à zéro.' };
    }

    if (data.amountGNF > inv.remainingAmountGNF) {
      return {
        success: false,
        message: `Le montant (${data.amountGNF} GNF) dépasse le solde restant dû (${inv.remainingAmountGNF} GNF).`,
      };
    }

    const newPayment: Payment = {
      id: 'pay-' + Date.now(),
      invoiceId: data.invoiceId,
      amountGNF: data.amountGNF,
      date: new Date().toISOString().split('T')[0],
      paymentMethod: data.paymentMethod,
      reference: data.reference,
      recordedBy: currentUser.id,
      receiptRef: `QUIT-${Date.now().toString().slice(-4)}`,
      status: 'valide',
    };

    const newPaid = inv.paidAmountGNF + data.amountGNF;
    const newRemaining = inv.totalGNF - newPaid;
    const newStatus = determineInvoicePaymentStatus({
      status: inv.status,
      totalGNF: inv.totalGNF,
      paidAmountGNF: newPaid,
      dueDate: inv.dueDate,
    });

    setPayments((prev) => [newPayment, ...prev]);
    setInvoices((prev) =>
      prev.map((i) =>
        i.id === data.invoiceId
          ? {
              ...i,
              paidAmountGNF: newPaid,
              remainingAmountGNF: newRemaining,
              paymentStatus: newStatus,
            }
          : i
      )
    );

    logAudit(
      'ENREGISTREMENT_PAIEMENT',
      'Payment',
      newPayment.id,
      `Reste: ${inv.remainingAmountGNF} GNF`,
      `Reste: ${newRemaining} GNF`,
      `Paiement de ${data.amountGNF} GNF reçu par ${data.paymentMethod} (Réf: ${data.reference})`
    );

    return { success: true, message: `Paiement de ${data.amountGNF.toLocaleString('fr-FR')} GNF enregistré sur ${inv.invoiceNumber}.` };
  };

  const issueCreditNote = (originalInvoiceId: string, amountGNF: number, reason: string) => {
    const inv = invoices.find((i) => i.id === originalInvoiceId);
    if (!inv) return { success: false, message: 'Facture originale introuvable.' };

    if (amountGNF <= 0 || amountGNF > inv.totalGNF) {
      return { success: false, message: 'Montant de l\'avoir invalide.' };
    }

    const creditNoteNum = `AVO-2026-${String(creditNotes.length + 1).padStart(4, '0')}`;
    const newCreditNote: CreditNote = {
      id: 'cn-' + Date.now(),
      creditNoteNumber: creditNoteNum,
      originalInvoiceId,
      originalInvoiceNumber: inv.invoiceNumber,
      amountGNF,
      reason,
      issuedBy: currentUser.id,
      date: new Date().toISOString().split('T')[0],
    };

    setCreditNotes((prev) => [newCreditNote, ...prev]);
    logAudit('EMISSION_AVOIR', 'CreditNote', newCreditNote.id, inv.invoiceNumber, creditNoteNum, reason);

    return { success: true, message: `Avoir ${creditNoteNum} de ${amountGNF.toLocaleString('fr-FR')} GNF créé avec succès.` };
  };

  return (
    <AppContext.Provider
      value={{
        currentUser,
        setCurrentUser,
        users,
        isOfflineMode,
        toggleOfflineMode,
        offlineQueue,
        synchronizeOfflineQueue,
        contracts,
        addContract,
        updateContractStatus,
        vehicles,
        addVehicle,
        updateVehicleStatus,
        drivers,
        trips,
        addTrip,
        validateTrip,
        cisterns,
        fuelMovements,
        addFuelMovement,
        fuelInventories,
        recordFuelInventory,
        validateFuelDiscrepancy,
        wateringRuns,
        addWateringRun,
        validateWateringRun,
        breakdowns,
        reportBreakdown,
        resolveBreakdown,
        invoices,
        createInvoiceFromPrestations,
        emitInvoice,
        recordPayment,
        issueCreditNote,
        payments,
        creditNotes,
        auditLogs,
        canAccess,
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = () => {
  const context = useContext(AppContext);
  if (!context) {
    throw new Error('useApp must be used within an AppProvider');
  }
  return context;
};
