import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  FileText,
  Plus,
  CheckCircle,
  AlertCircle,
  Building,
  Calendar,
  DollarSign,
  TrendingUp,
  X,
  FileCheck,
} from 'lucide-react';
import { formatGNF } from '../utils/rules.ts';
import { ContractStatus, ActivityType, BillingUnit } from '../types/index.ts';

export const ContractsView: React.FC = () => {
  const { contracts, addContract, updateContractStatus, currentUser, canAccess, trips, invoices } = useApp();

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [statusChangeModal, setStatusChangeModal] = useState<{ contractId: string; targetStatus: ContractStatus } | null>(null);
  const [statusReason, setStatusReason] = useState('');
  const [notification, setNotification] = useState<string | null>(null);

  // New contract form state
  const [code, setCode] = useState(`CTR-2026-${String(contracts.length + 1).padStart(3, '0')}`);
  const [title, setTitle] = useState('');
  const [clientName, setClientName] = useState('');
  const [siteName, setSiteName] = useState('');
  const [activityType, setActivityType] = useState<ActivityType>('transport');
  const [billingUnit, setBillingUnit] = useState<BillingUnit>('tonne');
  const [unitRateGNF, setUnitRateGNF] = useState<number>(115000);
  const [plannedVolume, setPlannedVolume] = useState<number>(100000);
  const [startDate, setStartDate] = useState('2026-11-01');
  const [endDate, setEndDate] = useState('2027-10-31');
  const [paymentTermsDays, setPaymentTermsDays] = useState<number>(30);
  const [notes, setNotes] = useState('');

  const handleCreateContract = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !clientName || !siteName || unitRateGNF <= 0) {
      alert('Veuillez remplir tous les champs obligatoires.');
      return;
    }

    const res = addContract({
      code,
      title,
      clientId: 'cli-' + Date.now(),
      clientName,
      siteName,
      activityType,
      startDate,
      endDate,
      billingUnit,
      unitRateGNF,
      currency: 'GNF',
      plannedVolume,
      status: 'brouillon',
      paymentTermsDays,
      notes,
      createdBy: currentUser.id,
    });

    setNotification(res.message);
    setIsAddModalOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleConfirmStatusChange = () => {
    if (!statusChangeModal) return;
    if (!statusReason.trim()) {
      alert('Le motif de changement de statut est obligatoire (règle de traçabilité RG-11).');
      return;
    }

    const res = updateContractStatus(statusChangeModal.contractId, statusChangeModal.targetStatus, statusReason);
    setNotification(res.message);
    setStatusChangeModal(null);
    setStatusReason('');
    setTimeout(() => setNotification(null), 4000);
  };

  return (
    <div className="space-y-6">
      {/* Toast */}
      {notification && (
        <div className="p-3 bg-emerald-700 text-white rounded-lg text-xs font-semibold flex justify-between items-center shadow">
          <span>{notification}</span>
          <button onClick={() => setNotification(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Module CTR-01 à CTR-07
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Gestion des Dossiers de Contrats
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Contrats miniers, logistiques, arrosage et location de citernes avec tarification paramétrable en GNF.
          </p>
        </div>

        {canAccess('contracts_manage') && (
          <button
            onClick={() => setIsAddModalOpen(true)}
            className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Nouveau Contrat (CTR-01)</span>
          </button>
        )}
      </div>

      {/* Contract Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {contracts.map((contract) => {
          // Trips & Invoices for profitability estimate (CTR-07)
          const contractTrips = trips.filter((t) => t.contractId === contract.id && t.status === 'valide');
          const contractInvoices = invoices.filter((i) => i.contractId === contract.id && i.status === 'emise');
          const totalInvoiced = contractInvoices.reduce((s, i) => s + i.totalGNF, 0);
          const totalVolumeDone = contractTrips.reduce((s, t) => s + t.netWeightTons, 0);

          return (
            <div
              key={contract.id}
              className="bg-white rounded-2xl border border-slate-200 shadow-sm hover:shadow-md transition p-5 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-3">
                  <div>
                    <span className="text-[11px] font-mono font-bold text-slate-500 bg-slate-100 px-2 py-0.5 rounded">
                      {contract.code}
                    </span>
                    <h3 className="font-extrabold text-slate-900 text-base mt-1.5 leading-snug">
                      {contract.title}
                    </h3>
                  </div>
                  <span
                    className={`px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider shrink-0 border ${
                      contract.status === 'actif'
                        ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                        : contract.status === 'soumis'
                        ? 'bg-blue-50 text-blue-800 border-blue-200'
                        : contract.status === 'suspendu'
                        ? 'bg-amber-50 text-amber-800 border-amber-200'
                        : 'bg-slate-100 text-slate-700 border-slate-200'
                    }`}
                  >
                    {contract.status}
                  </span>
                </div>

                <div className="text-xs text-slate-600 space-y-1.5 border-t border-slate-100 pt-3">
                  <div className="flex items-center gap-2">
                    <Building className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span className="font-semibold text-slate-800">{contract.clientName}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
                    <span>Du {contract.startDate} au {contract.endDate}</span>
                  </div>
                  <div className="flex items-center gap-2 text-slate-500">
                    <span className="font-bold text-slate-700">Site :</span>
                    <span>{contract.siteName}</span>
                  </div>
                </div>

                {/* Rates & Units */}
                <div className="bg-slate-50 p-3 rounded-xl border border-slate-100 mt-3 text-xs">
                  <div className="flex justify-between items-center text-slate-700">
                    <span>Unité de facturation :</span>
                    <span className="font-bold text-slate-900 capitalize">{contract.billingUnit}</span>
                  </div>
                  <div className="flex justify-between items-center text-slate-700 mt-1">
                    <span>Tarif unitaire :</span>
                    <span className="font-black text-amber-700">{formatGNF(contract.unitRateGNF)} / {contract.billingUnit}</span>
                  </div>
                </div>

                {/* CTR-07: Rentabilité & Suivi estimé */}
                <div className="mt-3 p-3 bg-amber-500/5 rounded-xl border border-amber-500/20 text-xs">
                  <div className="flex items-center justify-between text-slate-600 mb-1">
                    <span className="font-semibold text-slate-800 flex items-center gap-1">
                      <TrendingUp className="w-3 h-3 text-amber-600" />
                      Rentabilité & volume (CTR-07)
                    </span>
                    <span className="text-[10px] text-amber-700 font-bold">Estimatif</span>
                  </div>
                  <div className="flex justify-between items-baseline mt-1">
                    <span className="text-slate-500 text-[11px]">CA Facturé :</span>
                    <span className="font-bold text-slate-900">{formatGNF(totalInvoiced)}</span>
                  </div>
                  {contract.billingUnit === 'tonne' && (
                    <div className="flex justify-between items-baseline text-[11px] text-slate-500 mt-0.5">
                      <span>Volume exécuté :</span>
                      <span className="font-bold text-slate-800">
                        {totalVolumeDone.toLocaleString('fr-FR')} / {contract.plannedVolume.toLocaleString('fr-FR')} T
                      </span>
                    </div>
                  )}
                </div>
              </div>

              {/* Status Action Workflow (Section 6.1) */}
              <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-400">Échéance {contract.paymentTermsDays}j</span>

                <div className="flex items-center gap-1.5">
                  {contract.status === 'brouillon' && (
                    <button
                      onClick={() => setStatusChangeModal({ contractId: contract.id, targetStatus: 'soumis' })}
                      className="px-2 py-1 rounded bg-blue-50 text-blue-700 hover:bg-blue-100 text-[11px] font-bold"
                    >
                      Soumettre
                    </button>
                  )}
                  {contract.status === 'soumis' && canAccess('contracts_validate') && (
                    <button
                      onClick={() => setStatusChangeModal({ contractId: contract.id, targetStatus: 'actif' })}
                      className="px-2.5 py-1 rounded bg-emerald-600 text-white hover:bg-emerald-500 text-[11px] font-bold shadow"
                    >
                      Activer (Direction)
                    </button>
                  )}
                  {contract.status === 'actif' && canAccess('contracts_validate') && (
                    <button
                      onClick={() => setStatusChangeModal({ contractId: contract.id, targetStatus: 'suspendu' })}
                      className="px-2 py-1 rounded bg-amber-100 text-amber-800 hover:bg-amber-200 text-[11px] font-bold"
                    >
                      Suspendre
                    </button>
                  )}
                  {contract.status === 'suspendu' && canAccess('contracts_validate') && (
                    <button
                      onClick={() => setStatusChangeModal({ contractId: contract.id, targetStatus: 'actif' })}
                      className="px-2 py-1 rounded bg-emerald-100 text-emerald-800 hover:bg-emerald-200 text-[11px] font-bold"
                    >
                      Réactiver
                    </button>
                  )}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal: Create Contract (CTR-01) */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base">
                Créer un Dossier de Contrat (CTR-01)
              </h3>
              <button onClick={() => setIsAddModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateContract} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Code Contrat</label>
                  <input
                    type="text"
                    value={code}
                    onChange={(e) => setCode(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Activité (CTR-01)</label>
                  <select
                    value={activityType}
                    onChange={(e) => setActivityType(e.target.value as ActivityType)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="transport">Transport Minerai (Bauxite)</option>
                    <option value="arrosage">Arrosage des Pistes</option>
                    <option value="location_citerne">Location de Citernes</option>
                    <option value="distribution_carburant">Distribution Carburant</option>
                    <option value="btp_services">Prestation BTP / Génie Civil</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Intitulé du Contrat</label>
                <input
                  type="text"
                  placeholder="Ex: Évacuation Bauxite Mine Dapilon"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Client Donneur d'Ordre</label>
                  <input
                    type="text"
                    placeholder="Ex: Société Minière de Boké (SMB)"
                    value={clientName}
                    onChange={(e) => setClientName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Site Minier / Localisation</label>
                  <input
                    type="text"
                    placeholder="Ex: Boké Nord / Port Dapilon"
                    value={siteName}
                    onChange={(e) => setSiteName(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Unité de Facturation (RG-02)</label>
                  <select
                    value={billingUnit}
                    onChange={(e) => setBillingUnit(e.target.value as BillingUnit)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="tonne">À la Tonne (Pesée)</option>
                    <option value="voyage">Au Voyage (Rotation)</option>
                    <option value="jour">À la Journée</option>
                    <option value="mois">Au Mois (Location forfait)</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Tarif Unitaire (GNF)</label>
                  <input
                    type="number"
                    value={unitRateGNF}
                    onChange={(e) => setUnitRateGNF(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-amber-700"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Début</label>
                  <input
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Date Fin</label>
                  <input
                    type="date"
                    value={endDate}
                    onChange={(e) => setEndDate(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Observations & Conditions particulières</label>
                <textarea
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Règles de pesée, tolérances, pénalités..."
                  className="w-full border border-slate-300 rounded-lg p-2 h-20"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl text-slate-700 font-semibold"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Créer Contrat Brouillon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Change Status with Reason (SOD & RG-11) */}
      {statusChangeModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-extrabold text-slate-900 text-base mb-2">
              Changement de Statut vers "{statusChangeModal.targetStatus}"
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              En application de la règle de traçabilité <strong>RG-11</strong>, tout changement de statut d'un contrat doit être consigné dans le journal d'audit avec un motif obligatoire.
            </p>

            <div className="space-y-3">
              <div>
                <label className="font-bold text-xs text-slate-700 block mb-1">Motif obligatoire de la décision :</label>
                <textarea
                  value={statusReason}
                  onChange={(e) => setStatusReason(e.target.value)}
                  placeholder="Ex: Approbation Direction après vérification de la caution et des assurances..."
                  className="w-full border border-slate-300 rounded-lg p-2 text-xs h-24 focus:ring-1 focus:ring-amber-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  onClick={() => setStatusChangeModal(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg text-xs font-semibold text-slate-700"
                >
                  Annuler
                </button>
                <button
                  onClick={handleConfirmStatusChange}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                >
                  Confirmer & Consigner dans l'Audit
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
