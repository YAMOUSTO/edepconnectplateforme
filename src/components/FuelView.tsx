import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Fuel,
  Plus,
  ArrowDownRight,
  ArrowUpRight,
  AlertTriangle,
  ClipboardList,
  CheckCircle2,
  X,
  ShieldCheck,
  Building,
} from 'lucide-react';
import { formatGNF, canUserValidateFuelDiscrepancy } from '../utils/rules.ts';

export const FuelView: React.FC = () => {
  const {
    cisterns,
    fuelMovements,
    fuelInventories,
    addFuelMovement,
    recordFuelInventory,
    validateFuelDiscrepancy,
    vehicles,
    contracts,
    currentUser,
    users,
    canAccess,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'cisterns' | 'movements' | 'inventories'>('cisterns');
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isInventoryModalOpen, setIsInventoryModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Entry Form (Réception CAR-04)
  const [entryCisternId, setEntryCisternId] = useState(cisterns[0]?.id || '');
  const [entryVolume, setEntryVolume] = useState<number>(10000);
  const [entryUnitPrice, setEntryUnitPrice] = useState<number>(12000);
  const [entrySupplier, setEntrySupplier] = useState('TotalEnergies Marketing Guinée');
  const [entryDeliveryNote, setEntryDeliveryNote] = useState(`BL-TOT-${Date.now().toString().slice(-4)}`);
  const [entryJustification, setEntryJustification] = useState('Réapprovisionnement cuve gasoil');

  // Exit Form (Distribution CAR-05 & CAR-10)
  const [exitCisternId, setExitCisternId] = useState(cisterns[0]?.id || '');
  const [exitVolume, setExitVolume] = useState<number>(350);
  const [exitUnitPrice, setExitUnitPrice] = useState<number>(13500);
  const [exitVehicleId, setExitVehicleId] = useState(vehicles[0]?.id || '');
  const [exitDriverName, setExitDriverName] = useState('Ousmane Barry');
  const [exitContractId, setExitContractId] = useState(contracts[0]?.id || '');
  const [exitOdometer, setExitOdometer] = useState<number>(84500);
  const [exitJustification, setExitJustification] = useState('Plein début de rotation 4 tours Boké-Dapilon');

  // Physical inventory Form (CAR-07)
  const [inventoryCisternId, setInventoryCisternId] = useState(cisterns[0]?.id || '');
  const [physicalMeasuredStock, setPhysicalMeasuredStock] = useState<number>(18000);
  const [inventoryExplanation, setInventoryExplanation] = useState('Mesure par pige manuelle en fin de poste');

  // Validation discrepancy modal state (SOD-04)
  const [approvingInventoryId, setApprovingInventoryId] = useState<string | null>(null);
  const [approvalReason, setApprovalReason] = useState('');

  const handleCreateEntry = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addFuelMovement({
      cisternId: entryCisternId,
      type: 'entree',
      volumeLiters: entryVolume,
      unitPriceGNF: entryUnitPrice,
      supplierName: entrySupplier,
      deliveryNoteNumber: entryDeliveryNote,
      siteName: cisterns.find((c) => c.id === entryCisternId)?.siteName || 'Site EDEP',
      justification: entryJustification,
    });

    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsEntryModalOpen(false);
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleCreateExit = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addFuelMovement({
      cisternId: exitCisternId,
      type: 'sortie',
      volumeLiters: exitVolume,
      unitPriceGNF: exitUnitPrice,
      beneficiaryVehicleId: exitVehicleId,
      beneficiaryDriverName: exitDriverName,
      contractId: exitContractId,
      siteName: cisterns.find((c) => c.id === exitCisternId)?.siteName || 'Site EDEP',
      odometerKm: exitOdometer,
      justification: exitJustification,
    });

    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsExitModalOpen(false);
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleRecordInventory = (e: React.FormEvent) => {
    e.preventDefault();
    const res = recordFuelInventory(inventoryCisternId, physicalMeasuredStock, inventoryExplanation);
    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsInventoryModalOpen(false);
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleApproveDiscrepancy = () => {
    if (!approvingInventoryId || !approvalReason.trim()) {
      alert('Un motif d\'approbation est obligatoire (règle SOD-04).');
      return;
    }
    const res = validateFuelDiscrepancy(approvingInventoryId, approvalReason);
    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setApprovingInventoryId(null);
      setApprovalReason('');
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {notification && (
        <div
          className={`p-3 rounded-lg text-xs font-semibold flex justify-between items-center shadow ${
            notification.type === 'success' ? 'bg-emerald-700 text-white' : 'bg-rose-700 text-white'
          }`}
        >
          <span>{notification.text}</span>
          <button onClick={() => setNotification(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold text-purple-600 bg-purple-50 px-2 py-0.5 rounded border border-purple-200">
              Module CAR-01 à CAR-14
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Parc de Citernes, Mouvements & Suivi Carburant
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion des cuves 15k à 25k litres, interdiction du stock négatif (CAR-10) et contrôle strict des écarts (SOD-04).
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto flex-wrap">
          <button
            onClick={() => setIsInventoryModalOpen(true)}
            className="flex items-center gap-1.5 bg-slate-800 hover:bg-slate-700 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition"
          >
            <ClipboardList className="w-4 h-4" />
            <span>Inventaire Pige (CAR-07)</span>
          </button>
          <button
            onClick={() => setIsEntryModalOpen(true)}
            className="flex items-center gap-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition"
          >
            <ArrowDownRight className="w-4 h-4" />
            <span>Réception Fournisseur (CAR-04)</span>
          </button>
          <button
            onClick={() => setIsExitModalOpen(true)}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-3 py-2 rounded-xl text-xs shadow transition"
          >
            <ArrowUpRight className="w-4 h-4" />
            <span>Distribution Engin (CAR-05)</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('cisterns')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'cisterns' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Cuves & Jauges de Stock ({cisterns.length})
        </button>
        <button
          onClick={() => setActiveTab('movements')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'movements' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Journal des Mouvements ({fuelMovements.length})
        </button>
        <button
          onClick={() => setActiveTab('inventories')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'inventories' ? 'border-purple-600 text-purple-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Inventaires & Écarts (SOD-04)</span>
          {fuelInventories.some(i => i.status !== 'valide') && (
            <span className="w-2 h-2 rounded-full bg-amber-500"></span>
          )}
        </button>
      </div>

      {/* Tab 1: Cisterns with Visual Gauges (CAR-01 & CAR-09) */}
      {activeTab === 'cisterns' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
          {cisterns.map((c) => {
            const fillPercentage = Math.round((c.currentStockLiters / c.capacityLiters) * 100);
            const isLow = c.currentStockLiters <= c.alertThresholdLiters;

            return (
              <div
                key={c.id}
                className={`bg-white rounded-2xl border p-5 shadow-sm flex flex-col justify-between transition ${
                  isLow ? 'border-rose-300 ring-2 ring-rose-100' : 'border-slate-200'
                }`}
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-xs font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                        {c.code}
                      </span>
                      <h3 className="font-black text-slate-900 text-base mt-1.5">
                        {c.type === 'carburant' ? 'Citerne Gasoil' : 'Citerne Eau'}
                      </h3>
                      <div className="text-[11px] text-slate-500">{c.siteName}</div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider ${
                        c.status === 'en_service'
                          ? 'bg-emerald-50 text-emerald-800'
                          : c.status === 'louee'
                          ? 'bg-blue-50 text-blue-800'
                          : 'bg-slate-100 text-slate-800'
                      }`}
                    >
                      {c.status}
                    </span>
                  </div>

                  {/* Visual Tank Gauge */}
                  <div className="my-5 p-4 bg-slate-50 rounded-xl border border-slate-100 text-center">
                    <div className="text-2xl font-black text-slate-900">
                      {c.currentStockLiters.toLocaleString('fr-FR')}{' '}
                      <span className="text-xs font-semibold text-slate-500">L</span>
                    </div>
                    <div className="text-[11px] text-slate-400 mt-0.5">
                      sur {c.capacityLiters.toLocaleString('fr-FR')} L ({fillPercentage}%)
                    </div>

                    <div className="w-full bg-slate-200 h-4 rounded-full overflow-hidden mt-3 p-0.5">
                      <div
                        className={`h-full rounded-full transition-all duration-500 ${
                          isLow ? 'bg-rose-500' : 'bg-gradient-to-r from-purple-600 to-indigo-600'
                        }`}
                        style={{ width: `${Math.min(100, fillPercentage)}%` }}
                      />
                    </div>

                    {isLow && (
                      <div className="mt-2 text-[10px] font-bold text-rose-700 bg-rose-50 py-1 px-2 rounded flex items-center justify-center gap-1">
                        <AlertTriangle className="w-3 h-3 text-rose-600" />
                        <span>Alerte Seuil Bas (CAR-09) &lt; {c.alertThresholdLiters}L</span>
                      </div>
                    )}
                  </div>

                  <div className="space-y-1 text-xs text-slate-600 pt-2 border-t border-slate-100">
                    <div className="flex justify-between">
                      <span className="text-slate-400">Propriétaire :</span>
                      <span className="font-bold text-slate-800">{c.ownerName}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-400">Dernier inventaire :</span>
                      <span className="font-medium text-slate-700">{c.lastInventoryDate}</span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex gap-2">
                  <button
                    onClick={() => {
                      setExitCisternId(c.id);
                      setIsExitModalOpen(true);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-amber-500/10 hover:bg-amber-500/20 text-amber-900 font-bold text-xs"
                  >
                    Distribuer
                  </button>
                  <button
                    onClick={() => {
                      setEntryCisternId(c.id);
                      setIsEntryModalOpen(true);
                    }}
                    className="flex-1 py-1.5 rounded-lg bg-purple-50 hover:bg-purple-100 text-purple-900 font-bold text-xs"
                  >
                    Remplir
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Movements Journal (CAR-06) */}
      {activeTab === 'movements' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
            Journal Chronologique des Flux de Carburant (CAR-06)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-3">Date & Heure</th>
                  <th className="p-3">Type</th>
                  <th className="p-3">Citerne</th>
                  <th className="p-3">Bénéficiaire / Fournisseur</th>
                  <th className="p-3 text-right">Volume</th>
                  <th className="p-3 text-right">Prix Unitaire</th>
                  <th className="p-3">Agent Responsable</th>
                  <th className="p-3">Justificatif</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {fuelMovements.map((m) => {
                  const cistern = cisterns.find((c) => c.id === m.cisternId);
                  const vehicle = vehicles.find((v) => v.id === m.beneficiaryVehicleId);

                  return (
                    <tr key={m.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono font-medium text-slate-800">{m.date}</td>
                      <td className="p-3">
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            m.type === 'entree'
                              ? 'bg-purple-100 text-purple-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {m.type === 'entree' ? 'Entrée (BL)' : 'Sortie (Engin)'}
                        </span>
                      </td>
                      <td className="p-3 font-bold text-slate-800">{cistern?.code}</td>
                      <td className="p-3">
                        {m.type === 'entree' ? (
                          <div className="font-semibold text-slate-900">{m.supplierName}</div>
                        ) : (
                          <div>
                            <span className="font-bold text-slate-900">{vehicle?.code || 'Engin'}</span>
                            <span className="text-slate-400 text-[11px] ml-1">({m.beneficiaryDriverName})</span>
                          </div>
                        )}
                        <div className="text-[10px] text-slate-400">
                          {m.deliveryNoteNumber || (m.odometerKm ? `${m.odometerKm} km` : '')}
                        </div>
                      </td>
                      <td className="p-3 text-right font-black text-slate-900 text-sm">
                        {m.type === 'entree' ? '+' : '-'}{m.volumeLiters.toLocaleString('fr-FR')} L
                      </td>
                      <td className="p-3 text-right font-medium text-slate-700">
                        {formatGNF(m.unitPriceGNF)}
                      </td>
                      <td className="p-3 text-slate-800 font-medium">{m.agentResponsibleName}</td>
                      <td className="p-3 text-[11px] text-slate-500 italic max-w-xs truncate">
                        {m.justification}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Physical Inventories & Discrepancies (CAR-07 / SOD-04) */}
      {activeTab === 'inventories' && (
        <div className="space-y-4">
          <div className="p-4 bg-purple-50/60 rounded-xl border border-purple-200 text-xs text-purple-900 flex items-start gap-3">
            <ShieldCheck className="w-5 h-5 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <strong className="text-purple-950">Principe de Séparation des Tâches (SOD-04) : </strong>
              L'agent effectuant le jaugeage physique enregistre l'écart constaté avec explication obligatoire.
              Seul un responsable habilité distinct (Direction, Responsable Carburant ou PDG) peut valider l'écart pour ajuster le stock officiel.
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
              Registre des Inventaires Physiques & Traitement des Écarts (CAR-07 / CAR-08)
            </div>

            <div className="divide-y divide-slate-100">
              {fuelInventories.map((inv) => {
                const cistern = cisterns.find((c) => c.id === inv.cisternId);
                const measurer = users.find((u) => u.id === inv.measuredBy);
                const approver = users.find((u) => u.id === inv.approvedBy);
                const sodCheck = canUserValidateFuelDiscrepancy(inv.measuredBy, currentUser.id, currentUser.role);

                return (
                  <div key={inv.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-4 text-xs">
                    <div className="space-y-1.5">
                      <div className="flex items-center gap-2">
                        <span className="font-black text-slate-900 text-sm">{cistern?.code} ({cistern?.siteName})</span>
                        <span className="text-slate-400 font-mono">Date : {inv.date}</span>
                        <span
                          className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                            inv.status === 'valide'
                              ? 'bg-emerald-100 text-emerald-800'
                              : 'bg-amber-100 text-amber-800'
                          }`}
                        >
                          {inv.status}
                        </span>
                      </div>

                      <div className="flex items-center gap-6">
                        <div>Stock Théorique : <strong>{inv.theoreticalStockLiters.toLocaleString('fr-FR')} L</strong></div>
                        <div>Stock Mesuré (Pige) : <strong>{inv.measuredPhysicalStockLiters.toLocaleString('fr-FR')} L</strong></div>
                        <div>
                          Écart constaté :{' '}
                          <span
                            className={`font-black text-sm ${
                              inv.discrepancyLiters < 0 ? 'text-rose-600' : 'text-emerald-600'
                            }`}
                          >
                            {inv.discrepancyLiters > 0 ? '+' : ''}{inv.discrepancyLiters.toLocaleString('fr-FR')} L
                          </span>
                        </div>
                      </div>

                      <p className="text-slate-600 bg-slate-50 p-2 rounded border border-slate-100 italic">
                        "{inv.explanation || 'Aucun motif fourni'}" — Mesuré par {measurer ? measurer.name : inv.measuredBy}
                      </p>

                      {inv.approvedBy && (
                        <div className="text-[11px] text-emerald-700 font-bold">
                          ✓ Approuvé par {approver ? approver.name : inv.approvedBy} le {inv.approvalDate}
                        </div>
                      )}
                    </div>

                    <div className="shrink-0">
                      {inv.status !== 'valide' && (
                        sodCheck.canValidate ? (
                          <button
                            onClick={() => {
                              setApprovingInventoryId(inv.id);
                              setApprovalReason(`Validation écart ${inv.discrepancyLiters}L conforme aux tolérances.`);
                            }}
                            className="px-3 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg text-xs shadow"
                          >
                            Valider l'Écart (SOD-04)
                          </button>
                        ) : (
                          <span
                            className="px-2.5 py-1.5 bg-slate-100 text-slate-400 rounded-lg text-[10px] font-semibold block text-center cursor-not-allowed"
                            title={sodCheck.reason}
                          >
                            Validation non autorisée (SOD-04)
                          </span>
                        )
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* Modal Exit Fuel (Distribution CAR-05 & CAR-10) */}
      {isExitModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ArrowUpRight className="w-5 h-5 text-amber-600" />
                Distribution de Carburant (CAR-05)
              </h3>
              <button onClick={() => setIsExitModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Citerne Source</label>
                <select
                  value={exitCisternId}
                  onChange={(e) => setExitCisternId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {cisterns.filter(c => c.type === 'carburant').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({c.siteName}) — Dispo : {c.currentStockLiters.toLocaleString('fr-FR')} L
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume à Débiter (L) *</label>
                  <input
                    type="number"
                    value={exitVolume}
                    onChange={(e) => setExitVolume(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black text-amber-700 text-sm"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix Vente / Cession GNF</label>
                  <input
                    type="number"
                    value={exitUnitPrice}
                    onChange={(e) => setExitUnitPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Engin Bénéficiaire</label>
                  <select
                    value={exitVehicleId}
                    onChange={(e) => setExitVehicleId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    {vehicles.map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.code} - {v.plateNumber}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chauffeur Opérateur</label>
                  <input
                    type="text"
                    value={exitDriverName}
                    onChange={(e) => setExitDriverName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Kilométrage Odomètre (km)</label>
                  <input
                    type="number"
                    value={exitOdometer}
                    onChange={(e) => setExitOdometer(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Imputation Contrat</label>
                  <select
                    value={exitContractId}
                    onChange={(e) => setExitContractId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  >
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif / Justification</label>
                <input
                  type="text"
                  value={exitJustification}
                  onChange={(e) => setExitJustification(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsExitModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Valider Distribution (CAR-10)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Entry Fuel (Réception Fournisseur CAR-04) */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ArrowDownRight className="w-5 h-5 text-purple-600" />
                Réception Fournisseur Carburant (CAR-04)
              </h3>
              <button onClick={() => setIsEntryModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateEntry} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Citerne Destinataire</label>
                <select
                  value={entryCisternId}
                  onChange={(e) => setEntryCisternId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {cisterns.filter(c => c.type === 'carburant').map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} ({c.siteName}) — Stock actuel : {c.currentStockLiters.toLocaleString('fr-FR')} L
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume Reçu (Litres)</label>
                  <input
                    type="number"
                    value={entryVolume}
                    onChange={(e) => setEntryVolume(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-purple-700"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Prix Achat GNF / L</label>
                  <input
                    type="number"
                    value={entryUnitPrice}
                    onChange={(e) => setEntryUnitPrice(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fournisseur Agréé</label>
                  <input
                    type="text"
                    value={entrySupplier}
                    onChange={(e) => setEntrySupplier(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">N° Bon de Livraison (BL)</label>
                  <input
                    type="text"
                    value={entryDeliveryNote}
                    onChange={(e) => setEntryDeliveryNote(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEntryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer l'Entrée
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Physical Inventory (CAR-07) */}
      {isInventoryModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <ClipboardList className="w-5 h-5 text-purple-600" />
                Inventaire Physique & Jaugeage (CAR-07)
              </h3>
              <button onClick={() => setIsInventoryModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordInventory} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Citerne à Contrôler</label>
                <select
                  value={inventoryCisternId}
                  onChange={(e) => setInventoryCisternId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {cisterns.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — Stock Théorique Système : {c.currentStockLiters.toLocaleString('fr-FR')} L
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Volume Mesuré Physiquement (Pige/Compteur en Litres)</label>
                <input
                  type="number"
                  value={physicalMeasuredStock}
                  onChange={(e) => setPhysicalMeasuredStock(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-black text-purple-800 text-sm"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Explication Obligatoire de la Mesure & Éventuel Écart (CAR-08)</label>
                <textarea
                  value={inventoryExplanation}
                  onChange={(e) => setInventoryExplanation(e.target.value)}
                  placeholder="Ex: Pige manuelle à 18h00. Écart de -15L dû aux pertes d'égouttement du pistolet..."
                  className="w-full border border-slate-300 rounded-lg p-2 h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsInventoryModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer l'Inventaire (SOD-04)
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Approve Discrepancy (SOD-04) */}
      {approvingInventoryId && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base mb-2">
              Validation Officielle d'Écart de Stock (SOD-04)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              En tant que responsable autorisé distinct, vous validez cet écart. Le stock physique fera foi et la trace sera enregistrée de manière immuable.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif formel d'approbation :</label>
                <textarea
                  value={approvalReason}
                  onChange={(e) => setApprovalReason(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 h-20 font-medium"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setApprovingInventoryId(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleApproveDiscrepancy}
                  className="px-4 py-1.5 bg-purple-700 hover:bg-purple-600 text-white font-bold rounded-lg shadow"
                >
                  Valider et Ajuster le Stock
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
