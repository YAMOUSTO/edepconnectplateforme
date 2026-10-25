import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Scale,
  Plus,
  CheckCircle2,
  Clock,
  AlertCircle,
  Truck,
  User,
  Building,
  WifiOff,
  X,
  FileCheck2,
  ShieldCheck,
} from 'lucide-react';
import { calculateNetWeight, calculatePrestationAmount, formatGNF, canUserValidateTrip } from '../utils/rules.ts';

export const TransportView: React.FC = () => {
  const {
    trips,
    addTrip,
    validateTrip,
    contracts,
    vehicles,
    drivers,
    currentUser,
    isOfflineMode,
    users,
  } = useApp();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Form states
  const [contractId, setContractId] = useState(contracts[0]?.id || '');
  const [vehicleId, setVehicleId] = useState(vehicles[0]?.id || '');
  const [driverId, setDriverId] = useState(drivers[0]?.id || '');
  const [departureSite, setDepartureSite] = useState('Carreau Minier Boké Nord');
  const [arrivalSite, setArrivalSite] = useState('Quai Déchargement Port Dapilon');
  const [product, setProduct] = useState('Bauxite brute haute teneur');
  const [weighTicketNumber, setWeighTicketNumber] = useState(`PES-DAP-${Date.now().toString().slice(-4)}`);
  const [grossWeightTons, setGrossWeightTons] = useState<number>(56.2);
  const [tareWeightTons, setTareWeightTons] = useState<number>(16.4);

  const selectedContract = contracts.find((c) => c.id === contractId);
  const netWeight = calculateNetWeight(grossWeightTons, tareWeightTons);
  const estimatedAmount = selectedContract
    ? calculatePrestationAmount(netWeight, selectedContract.billingUnit, selectedContract.unitRateGNF)
    : 0;

  const handleRecordTrip = (e: React.FormEvent) => {
    e.preventDefault();

    if (!weighTicketNumber.trim()) {
      setNotification({ text: 'Le numéro du ticket de pesée est obligatoire (TRN-03).', type: 'error' });
      return;
    }

    if (netWeight <= 0) {
      setNotification({ text: 'Le poids brut doit être supérieur à la tare du camion.', type: 'error' });
      return;
    }

    const res = addTrip({
      contractId,
      vehicleId,
      driverId,
      departureSite,
      arrivalSite,
      product,
      grossWeightTons,
      tareWeightTons,
      weighTicketNumber,
    });

    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsRecordModalOpen(false);
      // Generate next ticket number
      setWeighTicketNumber(`PES-DAP-${(Number(Date.now().toString().slice(-4)) + 1)}`);
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleValidate = (tripId: string) => {
    const res = validateTrip(tripId);
    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
    setTimeout(() => setNotification(null), 5000);
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
            <span className="text-xs uppercase font-extrabold text-orange-600 bg-orange-50 px-2 py-0.5 rounded border border-orange-200">
              Module TRN-01 à TRN-08
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Transport de Bauxite & Tickets de Pesée
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Enregistrement des voyages, saisie des ponts-bascules (TRN-03) et workflow de validation supervisée (SOD-01).
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center gap-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold px-4 py-2 rounded-xl text-xs shadow transition self-start sm:self-auto"
        >
          <Scale className="w-4 h-4" />
          <span>Enregistrer Voyage & Pesée {isOfflineMode && '(Hors Ligne)'}</span>
        </button>
      </div>

      {/* Trips Registry Table */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-700 uppercase tracking-wider">
            Registre Chronologique des Voyages ({trips.length})
          </div>
          <div className="text-[11px] text-slate-500">
            SOD-01 : Validation par un agent distinct du saisissant
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
              <tr>
                <th className="p-3">Ticket Pesée (TRN-03)</th>
                <th className="p-3">Camion & Chauffeur</th>
                <th className="p-3">Trajet & Contrat</th>
                <th className="p-3 text-right">Poids Brut / Tare</th>
                <th className="p-3 text-right">Poids Net (RG-01)</th>
                <th className="p-3 text-right">Montant (GNF)</th>
                <th className="p-3">Statut & Validation</th>
                <th className="p-3 text-right">Action</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {trips.map((t) => {
                const vehicle = vehicles.find((v) => v.id === t.vehicleId);
                const driver = drivers.find((d) => d.id === t.driverId);
                const contract = contracts.find((c) => c.id === t.contractId);
                const submitter = users.find((u) => u.id === t.submittedBy);
                const sodCheck = canUserValidateTrip(t.submittedBy, currentUser.id, currentUser.role);

                return (
                  <tr key={t.id} className="hover:bg-slate-50/80 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{t.weighTicketNumber}</span>
                        {t.isOfflineCreated && (
                          <span className="p-0.5 bg-amber-100 text-amber-800 rounded text-[9px] font-bold" title="Saisie hors ligne">
                            HL
                          </span>
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">{t.createdAt}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-bold text-slate-800">
                        {vehicle ? `${vehicle.code} (${vehicle.plateNumber})` : t.vehicleId}
                      </div>
                      <div className="text-[11px] text-slate-500">
                        {driver ? driver.name : t.driverId}
                      </div>
                    </td>

                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{contract ? contract.code : t.contractId}</div>
                      <div className="text-[10px] text-slate-500 truncate max-w-[150px]">
                        {t.departureSite} ➔ {t.arrivalSite}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      <div>Brut : {t.grossWeightTons} T</div>
                      <div className="text-slate-400">Tare : {t.tareWeightTons} T</div>
                    </td>

                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      {t.netWeightTons.toFixed(2)} T
                    </td>

                    <td className="p-3 text-right font-extrabold text-amber-700">
                      {formatGNF(t.calculatedAmountGNF)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider border ${
                          t.status === 'valide'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-amber-50 text-amber-800 border-amber-200'
                        }`}
                      >
                        {t.status}
                      </span>
                      <div className="text-[10px] text-slate-400 mt-0.5">
                        Saisi par: {submitter ? submitter.name.split(' ')[0] : 'Agent'}
                      </div>
                    </td>

                    <td className="p-3 text-right">
                      {t.status === 'termine' ? (
                        sodCheck.canValidate ? (
                          <button
                            onClick={() => handleValidate(t.id)}
                            className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded-lg text-xs font-bold shadow transition"
                          >
                            Valider (SOD-01)
                          </button>
                        ) : (
                          <span
                            className="inline-block px-2 py-1 bg-slate-100 text-slate-400 rounded text-[10px] font-medium cursor-not-allowed"
                            title={sodCheck.reason}
                          >
                            Non autorisé (SOD-01)
                          </span>
                        )
                      ) : (
                        <span className="text-[11px] text-emerald-600 font-bold flex items-center justify-end gap-1">
                          <CheckCircle2 className="w-3.5 h-3.5" />
                          Certifié
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Record Trip (TRN-02 & TRN-03) */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <div>
                <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                  <Scale className="w-5 h-5 text-amber-600" />
                  Saisie Voyage & Ticket de Pesée (TRN-02)
                </h3>
                {isOfflineMode && (
                  <span className="text-[10px] text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded mt-1 inline-block">
                    Mode Hors Connexion : Enregistrement local garanti
                  </span>
                )}
              </div>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400 hover:text-slate-600">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordTrip} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Contrat Minier Actif</label>
                  <select
                    value={contractId}
                    onChange={(e) => setContractId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    {contracts.map((c) => (
                      <option key={c.id} value={c.id}>
                        {c.code} - {c.clientName}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">
                    Numéro Ticket Pesée (TRN-03) *
                  </label>
                  <input
                    type="text"
                    value={weighTicketNumber}
                    onChange={(e) => setWeighTicketNumber(e.target.value)}
                    placeholder="Ex: PES-DAP-2026-9904"
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono font-bold uppercase"
                    required
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Camion Benne</label>
                  <select
                    value={vehicleId}
                    onChange={(e) => setVehicleId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                  >
                    {vehicles.filter(v => v.type === 'camion_benne').map((v) => (
                      <option key={v.id} value={v.id}>
                        {v.code} ({v.plateNumber}) - Cap. {v.capacity}T
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="font-bold text-slate-700 block mb-1">Chauffeur Assigné</label>
                  <select
                    value={driverId}
                    onChange={(e) => setDriverId(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    {drivers.map((d) => (
                      <option key={d.id} value={d.id}>
                        {d.name} ({d.phone})
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lieu de Chargement</label>
                  <input
                    type="text"
                    value={departureSite}
                    onChange={(e) => setDepartureSite(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Lieu de Déchargement / Port</label>
                  <input
                    type="text"
                    value={arrivalSite}
                    onChange={(e) => setArrivalSite(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              {/* Weighing scale calculation (RG-01) */}
              <div className="p-3 bg-amber-500/10 rounded-xl border border-amber-500/30">
                <div className="text-xs font-bold text-slate-800 mb-2 flex items-center justify-between">
                  <span>Calcul Automatique de Pesée (RG-01)</span>
                  <span className="text-amber-800 font-mono text-[11px]">Tare déduite</span>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5">Poids Brut (T)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={grossWeightTons}
                      onChange={(e) => setGrossWeightTons(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-1.5 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5">Tare Camion (T)</label>
                    <input
                      type="number"
                      step="0.1"
                      value={tareWeightTons}
                      onChange={(e) => setTareWeightTons(Number(e.target.value))}
                      className="w-full border border-slate-300 rounded-lg p-1.5 font-bold"
                      required
                    />
                  </div>
                  <div>
                    <label className="font-bold text-slate-600 block mb-0.5">Poids Net (T)</label>
                    <div className="p-1.5 bg-white border border-slate-300 rounded-lg font-black text-slate-900 text-sm">
                      {netWeight} T
                    </div>
                  </div>
                </div>

                <div className="mt-3 pt-2 border-t border-amber-500/20 flex justify-between items-center text-xs">
                  <span className="text-slate-600">Montant prestation estimé :</span>
                  <span className="font-black text-amber-800 text-sm">
                    {formatGNF(estimatedAmount)}
                  </span>
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-slate-950 font-bold rounded-xl shadow"
                >
                  Enregistrer le Voyage
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
