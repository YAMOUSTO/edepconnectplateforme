import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Truck,
  AlertTriangle,
  Wrench,
  CheckCircle,
  Plus,
  Shield,
  UserCheck,
  X,
  Gauge,
  Fuel,
  Droplets,
  Calendar,
} from 'lucide-react';
import { formatGNF } from '../utils/rules.ts';
import { VehicleStatus, OwnerType } from '../types/index.ts';

export const FleetView: React.FC = () => {
  const {
    vehicles,
    drivers,
    contracts,
    breakdowns,
    reportBreakdown,
    resolveBreakdown,
    addVehicle,
    updateVehicleStatus,
    currentUser,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'vehicles' | 'drivers' | 'breakdowns'>('vehicles');
  const [isAddVehicleOpen, setIsAddVehicleOpen] = useState(false);
  const [isBreakdownModalOpen, setIsBreakdownModalOpen] = useState(false);
  const [resolveModal, setResolveModal] = useState<{ id: string; vehicleCode: string } | null>(null);
  const [actualCost, setActualCost] = useState<number>(5000000);
  const [notification, setNotification] = useState<string | null>(null);

  // New vehicle form
  const [code, setCode] = useState(`CAM-${String(vehicles.length + 1).padStart(2, '0')}`);
  const [plateNumber, setPlateNumber] = useState('');
  const [type, setType] = useState<any>('camion_benne');
  const [brand, setBrand] = useState('Sinotruk');
  const [model, setModel] = useState('HOWO 40T');
  const [capacity, setCapacity] = useState<number>(40);
  const [ownerType, setOwnerType] = useState<OwnerType>('edep');
  const [ownerName, setOwnerName] = useState('EDEP Guinée');

  // Breakdown report form (FLT-06)
  const [selectedVehicleForBreakdown, setSelectedVehicleForBreakdown] = useState(vehicles[0]?.id || '');
  const [issueDescription, setIssueDescription] = useState('');
  const [breakdownLocation, setBreakdownLocation] = useState('Carreau Minier Boké PK 14');
  const [estimatedCostGNF, setEstimatedCostGNF] = useState<number>(6500000);
  const [breakdownContractId, setBreakdownContractId] = useState(contracts[0]?.id || '');

  const handleCreateVehicle = (e: React.FormEvent) => {
    e.preventDefault();
    if (!plateNumber) return;

    addVehicle({
      code,
      plateNumber,
      type,
      brand,
      model,
      capacity,
      ownerType,
      ownerName: ownerType === 'edep' ? 'EDEP Guinée' : ownerName,
      status: 'disponible',
      commissioningDate: new Date().toISOString().split('T')[0],
      odometerKm: 0,
      hoursWorked: 0,
    });

    setIsAddVehicleOpen(false);
    setNotification(`Véhicule ${code} (${plateNumber}) intégré au parc.`);
    setTimeout(() => setNotification(null), 4000);
  };

  const handleReportBreakdown = (e: React.FormEvent) => {
    e.preventDefault();
    if (!issueDescription) return;

    reportBreakdown({
      vehicleId: selectedVehicleForBreakdown,
      reportedDate: new Date().toISOString().replace('T', ' ').substring(0, 16),
      issueDescription,
      location: breakdownLocation,
      reportedBy: currentUser.id,
      estimatedCostGNF,
      contractId: breakdownContractId,
    });

    setIsBreakdownModalOpen(false);
    setIssueDescription('');
    setNotification('Panne déclarée. Le véhicule est automatiquement passé au statut « en_panne ».');
    setTimeout(() => setNotification(null), 4000);
  };

  const handleResolve = () => {
    if (!resolveModal) return;
    resolveBreakdown(resolveModal.id, actualCost);
    setResolveModal(null);
    setNotification(`Réparation validée. Véhicule ${resolveModal.vehicleCode} remis en service.`);
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
            <span className="text-xs uppercase font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Module FLT-01 à FLT-09
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Flotte, Engins & Déclarations de Pannes
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Gestion du parc de camions miniers, citernes d'eau/gasoil, propriétaires (EDEP vs Loués) et chauffeurs.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <button
            onClick={() => setIsBreakdownModalOpen(true)}
            className="flex items-center gap-1.5 bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition"
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Déclarer Panne (FLT-06)</span>
          </button>
          <button
            onClick={() => setIsAddVehicleOpen(true)}
            className="flex items-center gap-1.5 bg-slate-900 hover:bg-slate-800 text-white font-bold px-3 py-2 rounded-xl text-xs shadow transition"
          >
            <Plus className="w-4 h-4" />
            <span>Ajouter Véhicule</span>
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('vehicles')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'vehicles' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Parc Véhicules & Engins ({vehicles.length})
        </button>
        <button
          onClick={() => setActiveTab('breakdowns')}
          className={`pb-2.5 transition border-b-2 flex items-center gap-1.5 ${
            activeTab === 'breakdowns' ? 'border-rose-500 text-rose-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          <span>Pannes & Maintenance ({breakdowns.filter(b => b.status === 'en_cours').length})</span>
          {breakdowns.some(b => b.status === 'en_cours') && (
            <span className="w-2 h-2 rounded-full bg-rose-500"></span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('drivers')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'drivers' ? 'border-amber-500 text-amber-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Chauffeurs & Permis ({drivers.length})
        </button>
      </div>

      {/* Tab 1: Vehicles */}
      {activeTab === 'vehicles' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {vehicles.map((v) => {
            const assignedContract = contracts.find((c) => c.id === v.assignedContractId);
            const assignedDriver = drivers.find((d) => d.id === v.assignedDriverId);

            return (
              <div
                key={v.id}
                className="bg-white rounded-2xl border border-slate-200 shadow-sm p-5 flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="text-base font-black text-slate-900">{v.code}</span>
                        <span className="text-xs font-mono font-bold bg-slate-100 text-slate-700 px-2 py-0.5 rounded border border-slate-200">
                          {v.plateNumber}
                        </span>
                      </div>
                      <div className="text-xs text-slate-500 mt-1 font-medium">
                        {v.brand} {v.model}
                      </div>
                    </div>
                    <span
                      className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                        v.status === 'mobilise'
                          ? 'bg-blue-50 text-blue-800 border-blue-200'
                          : v.status === 'disponible'
                          ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                          : v.status === 'en_panne'
                          ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                          : 'bg-amber-50 text-amber-800 border-amber-200'
                      }`}
                    >
                      {v.status}
                    </span>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 space-y-2 text-xs">
                    {/* Owner distinction (FLT-02) */}
                    <div className="flex justify-between items-center">
                      <span className="text-slate-500">Propriété (FLT-02) :</span>
                      <span
                        className={`font-bold px-2 py-0.5 rounded text-[11px] ${
                          v.ownerType === 'edep'
                            ? 'bg-amber-50 text-amber-900 border border-amber-200'
                            : 'bg-indigo-50 text-indigo-900 border border-indigo-200'
                        }`}
                      >
                        {v.ownerType === 'edep' ? 'Propriété EDEP' : `Partenaire : ${v.ownerName}`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Capacité utile :</span>
                      <span className="font-extrabold text-slate-900">
                        {v.type === 'camion_benne' ? `${v.capacity} Tonnes` : `${v.capacity.toLocaleString('fr-FR')} Litres`}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Contrat rattaché :</span>
                      <span className="font-bold text-slate-800 truncate max-w-[160px]">
                        {assignedContract ? assignedContract.clientName : 'Non assigné'}
                      </span>
                    </div>

                    <div className="flex justify-between items-center text-slate-600">
                      <span>Chauffeur titulaire :</span>
                      <span className="font-bold text-slate-800">
                        {assignedDriver ? assignedDriver.name : 'Aucun'}
                      </span>
                    </div>
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <div className="text-[11px] text-slate-400">
                    {v.odometerKm ? `${v.odometerKm.toLocaleString('fr-FR')} km` : `${v.hoursWorked || 0} h moteur`}
                  </div>
                  <div className="flex items-center gap-1">
                    {v.status === 'en_panne' && (
                      <button
                        onClick={() => {
                          const brk = breakdowns.find(b => b.vehicleId === v.id && b.status === 'en_cours');
                          if (brk) setResolveModal({ id: brk.id, vehicleCode: v.code });
                        }}
                        className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-[11px] font-bold shadow"
                      >
                        Remettre en Service
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Tab 2: Breakdowns (FLT-06) */}
      {activeTab === 'breakdowns' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center">
            <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
              Registre des Déclarations de Pannes & Entretien (FLT-06 / FLT-07)
            </div>
            <span className="text-xs text-slate-500">Imputation directe aux véhicules et contrats</span>
          </div>

          <div className="divide-y divide-slate-100">
            {breakdowns.map((b) => {
              const vehicle = vehicles.find((v) => v.id === b.vehicleId);
              const contract = contracts.find((c) => c.id === b.contractId);

              return (
                <div key={b.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="font-black text-slate-900 text-sm">
                        {vehicle ? `${vehicle.code} (${vehicle.plateNumber})` : b.vehicleId}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-extrabold uppercase ${
                          b.status === 'en_cours'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                        }`}
                      >
                        {b.status}
                      </span>
                      <span className="text-slate-400 font-medium">Déclaré le {b.reportedDate}</span>
                    </div>

                    <p className="font-semibold text-slate-800 text-xs">{b.issueDescription}</p>

                    <div className="flex items-center gap-4 text-slate-500 text-[11px]">
                      <span>Lieu : <strong>{b.location}</strong></span>
                      {contract && <span>Contrat affecté : <strong>{contract.code}</strong></span>}
                    </div>
                  </div>

                  <div className="flex items-center gap-4 shrink-0">
                    <div className="text-right">
                      <div className="text-slate-400 text-[10px] uppercase font-bold">Coût estimé</div>
                      <div className="font-bold text-amber-700">{formatGNF(b.estimatedCostGNF)}</div>
                      {b.actualCostGNF && (
                        <div className="text-[11px] text-emerald-700 font-extrabold">
                          Réel: {formatGNF(b.actualCostGNF)}
                        </div>
                      )}
                    </div>

                    {b.status === 'en_cours' && (
                      <button
                        onClick={() => setResolveModal({ id: b.id, vehicleCode: vehicle?.code || '' })}
                        className="px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow"
                      >
                        Clôturer & Remettre en service
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Tab 3: Drivers */}
      {activeTab === 'drivers' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {drivers.map((d) => {
            const assignedVeh = vehicles.find((v) => v.id === d.assignedVehicleId);
            return (
              <div key={d.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm text-xs">
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-full bg-slate-100 flex items-center justify-center font-bold text-slate-700 text-sm border border-slate-200">
                    {d.name.charAt(0)}
                  </div>
                  <div>
                    <h4 className="font-black text-slate-900">{d.name}</h4>
                    <span className="text-[10px] text-emerald-700 font-bold bg-emerald-50 px-1.5 py-0.2 rounded">
                      {d.status}
                    </span>
                  </div>
                </div>

                <div className="space-y-1.5 text-slate-600 pt-2 border-t border-slate-100">
                  <div>Tél : <strong>{d.phone}</strong></div>
                  <div>Permis : <span className="font-mono text-slate-800">{d.licenseNumber}</span></div>
                  <div>
                    Validité permis :{' '}
                    <strong className={d.licenseExpiryDate < '2026-12-31' ? 'text-amber-700 font-black' : ''}>
                      {d.licenseExpiryDate}
                    </strong>
                  </div>
                  <div>Camion assigné : <strong>{assignedVeh ? assignedVeh.code : 'Aucun'}</strong></div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Modal Declare Breakdown (FLT-06) */}
      {isBreakdownModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-rose-600" />
                Déclaration de Panne (FLT-06)
              </h3>
              <button onClick={() => setIsBreakdownModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleReportBreakdown} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Véhicule ou Engin concerné</label>
                <select
                  value={selectedVehicleForBreakdown}
                  onChange={(e) => setSelectedVehicleForBreakdown(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {vehicles.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.code} - {v.plateNumber} ({v.brand} {v.model})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Nature de la panne / Description</label>
                <textarea
                  value={issueDescription}
                  onChange={(e) => setIssueDescription(e.target.value)}
                  placeholder="Ex: Éclatement pneumatique avant droit, fuite pompe injection..."
                  className="w-full border border-slate-300 rounded-lg p-2 h-20"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lieu de l'incident</label>
                  <input
                    type="text"
                    value={breakdownLocation}
                    onChange={(e) => setBreakdownLocation(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Coût Estimé Réparation (GNF)</label>
                  <input
                    type="number"
                    value={estimatedCostGNF}
                    onChange={(e) => setEstimatedCostGNF(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold text-amber-700"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Rattacher au contrat d'exploitation</label>
                <select
                  value={breakdownContractId}
                  onChange={(e) => setBreakdownContractId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.clientName}
                    </option>
                  ))}
                </select>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsBreakdownModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-rose-600 hover:bg-rose-500 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer Panne & Immobiliser
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Resolve Breakdown */}
      {resolveModal && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base mb-2">
              Remise en Service {resolveModal.vehicleCode}
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Indiquez le coût réel des pièces et main d'œuvre pour clôturer l'incident et rétablir la disponibilité de l'engin.
            </p>

            <div className="space-y-3 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Coût Réel Facturé (GNF)</label>
                <input
                  type="number"
                  value={actualCost}
                  onChange={(e) => setActualCost(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-black text-emerald-700"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3">
                <button
                  onClick={() => setResolveModal(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  onClick={handleResolve}
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Valider Remise en Service
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
