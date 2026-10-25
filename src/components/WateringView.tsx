import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Droplets,
  Plus,
  CheckCircle2,
  Calendar,
  Truck,
  MapPin,
  Clock,
  X,
  FileText,
} from 'lucide-react';

export const WateringView: React.FC = () => {
  const {
    wateringRuns,
    addWateringRun,
    validateWateringRun,
    vehicles,
    contracts,
    currentUser,
    isOfflineMode,
  } = useApp();

  const [isRecordModalOpen, setIsRecordModalOpen] = useState(false);
  const [notification, setNotification] = useState<string | null>(null);

  // Form fields
  const [siteName, setSiteName] = useState('Sangarédi - Concession CBG');
  const [roadZone, setRoadZone] = useState('Piste Haul Road PK 0 à PK 14');
  const [cisternVehicleId, setCisternVehicleId] = useState(
    vehicles.find((v) => v.type === 'citerne_eau')?.id || vehicles[0]?.id || ''
  );
  const [driverName, setDriverName] = useState('Mamadou Bhoye Bah');
  const [fillingPoint, setFillingPoint] = useState('Station de Pompage Rivière Tinguilinta');
  const [rotationsCount, setRotationsCount] = useState<number>(4);
  const [estimatedVolumeLiters, setEstimatedVolumeLiters] = useState<number>(80000);
  const [contractId, setContractId] = useState(
    contracts.find((c) => c.activityType === 'arrosage')?.id || contracts[0]?.id || ''
  );

  const handleRecordRun = (e: React.FormEvent) => {
    e.preventDefault();
    const res = addWateringRun({
      siteName,
      roadZone,
      cisternVehicleId,
      driverName,
      fillingPoint,
      rotationsCount,
      estimatedVolumeLiters,
      date: new Date().toISOString().split('T')[0],
      supervisorName: currentUser.name,
      contractId,
    });

    setNotification(res.message);
    setIsRecordModalOpen(false);
    setTimeout(() => setNotification(null), 4000);
  };

  const waterCisterns = vehicles.filter((v) => v.type === 'citerne_eau');
  const totalLiters = wateringRuns.reduce((sum, w) => sum + w.estimatedVolumeLiters, 0);

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
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
            <span className="text-xs uppercase font-extrabold text-cyan-600 bg-cyan-50 px-2 py-0.5 rounded border border-cyan-200">
              Module ARR-01 à ARR-07 (v1.1)
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Arrosage & Abattage des Poussières Minières
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Suivi des rotations des citernes à eau, des points de puisage et des surfaces arrosées pour conformité environnementale.
          </p>
        </div>

        <button
          onClick={() => setIsRecordModalOpen(true)}
          className="flex items-center gap-2 bg-cyan-600 hover:bg-cyan-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition self-start sm:self-auto"
        >
          <Plus className="w-4 h-4" />
          <span>Saisir Tournée d'Arrosage (ARR-04)</span>
        </button>
      </div>

      {/* KPI Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Volume Épandu Cumulé</div>
          <div className="text-2xl font-black text-cyan-800 mt-2">
            {(totalLiters / 1000).toLocaleString('fr-FR')}{' '}
            <span className="text-xs font-normal text-slate-500">m³ ({totalLiters.toLocaleString('fr-FR')} L)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Citernes Eau Déployées</div>
          <div className="text-2xl font-black text-slate-900 mt-2">
            {waterCisterns.length}{' '}
            <span className="text-xs font-normal text-slate-500">unités (20kL - 25kL)</span>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-sm">
          <div className="text-xs font-bold text-slate-500 uppercase">Tournées Effectuées</div>
          <div className="text-2xl font-black text-emerald-700 mt-2">
            {wateringRuns.length}{' '}
            <span className="text-xs font-normal text-slate-500">rapports certifiés</span>
          </div>
        </div>
      </div>

      {/* Watering Runs Registry */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
          Rapports Journaliers de Tournées d'Arrosage (ARR-04 / ARR-06)
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="p-3">Date</th>
                <th className="p-3">Zone d'Intervention / Site</th>
                <th className="p-3">Engin & Chauffeur</th>
                <th className="p-3">Point d'Approvisionnement</th>
                <th className="p-3 text-right">Rotations</th>
                <th className="p-3 text-right">Volume d'Eau</th>
                <th className="p-3">Superviseur</th>
                <th className="p-3 text-right">Statut</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {wateringRuns.map((w) => {
                const vehicle = vehicles.find((v) => v.id === w.cisternVehicleId);

                return (
                  <tr key={w.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-medium text-slate-900">{w.date}</td>
                    <td className="p-3">
                      <div className="font-bold text-slate-900">{w.roadZone}</div>
                      <div className="text-[10px] text-slate-400">{w.siteName}</div>
                    </td>
                    <td className="p-3">
                      <div className="font-semibold text-slate-800">{vehicle?.code || w.cisternVehicleId}</div>
                      <div className="text-[11px] text-slate-500">{w.driverName}</div>
                    </td>
                    <td className="p-3 text-slate-700">{w.fillingPoint}</td>
                    <td className="p-3 text-right font-black text-slate-900">{w.rotationsCount}</td>
                    <td className="p-3 text-right font-black text-cyan-800 text-sm">
                      {w.estimatedVolumeLiters.toLocaleString('fr-FR')} L
                    </td>
                    <td className="p-3 text-slate-700">{w.supervisorName}</td>
                    <td className="p-3 text-right">
                      {w.status === 'valide' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          Validé
                        </span>
                      ) : (
                        <button
                          onClick={() => validateWateringRun(w.id)}
                          className="px-2 py-1 bg-cyan-700 text-white rounded text-[11px] font-bold"
                        >
                          Valider
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>

      {/* Modal Record Watering Run */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <Droplets className="w-5 h-5 text-cyan-600" />
                Rapport de Tournée d'Arrosage (ARR-04)
              </h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordRun} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Citerne à Eau Déployée</label>
                <select
                  value={cisternVehicleId}
                  onChange={(e) => setCisternVehicleId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {waterCisterns.map((v) => (
                    <option key={v.id} value={v.id}>
                      {v.code} - {v.plateNumber} (Capacité {v.capacity.toLocaleString('fr-FR')}L)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Nombre de Rotations</label>
                  <input
                    type="number"
                    value={rotationsCount}
                    onChange={(e) => {
                      const count = Number(e.target.value);
                      setRotationsCount(count);
                      setEstimatedVolumeLiters(count * 20000);
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2 font-black text-cyan-800"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Volume Estimé (Litres)</label>
                  <input
                    type="number"
                    value={estimatedVolumeLiters}
                    onChange={(e) => setEstimatedVolumeLiters(Number(e.target.value))}
                    className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Piste & Zone Arrosée</label>
                <input
                  type="text"
                  value={roadZone}
                  onChange={(e) => setRoadZone(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Point de Remplissage / Pompage</label>
                <input
                  type="text"
                  value={fillingPoint}
                  onChange={(e) => setFillingPoint(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2"
                  required
                />
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
                  className="px-4 py-2 bg-cyan-700 hover:bg-cyan-600 text-white font-bold rounded-xl shadow"
                >
                  Enregistrer le Rapport
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
