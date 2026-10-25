import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  TrendingUp,
  CreditCard,
  AlertTriangle,
  Truck,
  Droplets,
  Fuel,
  FileText,
  DollarSign,
  Calendar,
  CheckCircle2,
  Clock,
  ArrowUpRight,
  ShieldAlert,
} from 'lucide-react';
import { formatGNF } from '../utils/rules.ts';

export const DashboardView: React.FC = () => {
  const {
    currentUser,
    contracts,
    vehicles,
    trips,
    cisterns,
    fuelMovements,
    wateringRuns,
    breakdowns,
    invoices,
    payments,
  } = useApp();

  const [selectedContractFilter, setSelectedContractFilter] = useState<string>('all');

  // Filtered trips
  const filteredTrips = selectedContractFilter === 'all'
    ? trips
    : trips.filter((t) => t.contractId === selectedContractFilter);

  // Financial calculations (FIN-15: Chiffre d'affaires facturé distinct de la Trésorerie encaissée)
  const issuedInvoices = invoices.filter((i) => i.status === 'emise');
  const totalInvoicedGNF = issuedInvoices.reduce((sum, i) => sum + i.totalGNF, 0);
  const totalCollectedGNF = payments
    .filter((p) => p.status === 'valide')
    .reduce((sum, p) => sum + p.amountGNF, 0);
  const totalRemainingGNF = issuedInvoices.reduce((sum, i) => sum + i.remainingAmountGNF, 0);

  // Overdue invoices (RG-05)
  const overdueInvoices = issuedInvoices.filter((i) => i.paymentStatus === 'echue');
  const totalOverdueGNF = overdueInvoices.reduce((sum, i) => sum + i.remainingAmountGNF, 0);

  // Operational metrics
  const totalTonnageTransported = filteredTrips
    .filter((t) => t.status === 'valide')
    .reduce((sum, t) => sum + t.netWeightTons, 0);

  const pendingTripsToValidate = trips.filter((t) => t.status === 'termine');

  // Fleet stats
  const totalVehicles = vehicles.length;
  const activeVehicles = vehicles.filter((v) => v.status === 'mobilise' || v.status === 'disponible').length;
  const brokenVehicles = vehicles.filter((v) => v.status === 'en_panne').length;
  const availabilityRate = totalVehicles > 0 ? Math.round((activeVehicles / totalVehicles) * 100) : 0;

  // Fuel stats
  const fuelCisterns = cisterns.filter((c) => c.type === 'carburant');
  const totalFuelStock = fuelCisterns.reduce((sum, c) => sum + c.currentStockLiters, 0);
  const totalFuelCapacity = fuelCisterns.reduce((sum, c) => sum + c.capacityLiters, 0);
  const lowFuelCisterns = fuelCisterns.filter((c) => c.currentStockLiters <= c.alertThresholdLiters);

  // Watering stats
  const totalWateringVolume = wateringRuns
    .filter((w) => w.status === 'valide')
    .reduce((sum, w) => sum + w.estimatedVolumeLiters, 0);

  return (
    <div className="space-y-6">
      {/* Top Banner & Welcome */}
      <div className="bg-gradient-to-r from-slate-900 via-slate-800 to-amber-950 p-6 rounded-2xl text-white shadow-lg border border-slate-700/60 flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase tracking-widest font-bold text-amber-400 bg-amber-400/10 px-2.5 py-0.5 rounded-full border border-amber-400/20">
              Pilotage Centralisé EDEP
            </span>
            <span className="text-xs text-slate-300">Mise à jour en temps réel</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-black mt-2 tracking-tight">
            Tableau de Bord Exécutif & Opérations
          </h1>
          <p className="text-sm text-slate-300 mt-1">
            Supervision des prestations minières, des flux financiers en Franc Guinéen (GNF) et de la logistique de terrain.
          </p>
        </div>

        {/* Contract filter */}
        <div className="bg-slate-800/80 p-3 rounded-xl border border-slate-700 shrink-0">
          <label className="text-xs font-semibold text-slate-300 block mb-1">Filtrer par contrat actif :</label>
          <select
            value={selectedContractFilter}
            onChange={(e) => setSelectedContractFilter(e.target.value)}
            className="bg-slate-900 border border-slate-600 rounded-lg px-3 py-1.5 text-xs text-slate-200 font-medium focus:outline-none focus:border-amber-400"
          >
            <option value="all">Tous les contrats EDEP</option>
            {contracts.map((c) => (
              <option key={c.id} value={c.id}>
                {c.code} - {c.clientName}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Critical Alerts Banner if any */}
      {(lowFuelCisterns.length > 0 || brokenVehicles > 0 || overdueInvoices.length > 0) && (
        <div className="bg-amber-500/10 border-l-4 border-amber-500 p-4 rounded-xl flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-amber-900">
          <div className="flex items-center gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0" />
            <div className="text-xs">
              <span className="font-bold text-amber-950">Points d'attention opérationnels : </span>
              {lowFuelCisterns.length > 0 && (
                <span className="mr-3">⚠️ {lowFuelCisterns.length} citerne(s) en seuil bas de carburant.</span>
              )}
              {brokenVehicles > 0 && (
                <span className="mr-3">🛠️ {brokenVehicles} engin(s) en panne déclarée.</span>
              )}
              {overdueInvoices.length > 0 && (
                <span>💶 {overdueInvoices.length} facture(s) échue(s) ({formatGNF(totalOverdueGNF)}).</span>
              )}
            </div>
          </div>
          <span className="text-[11px] font-bold text-amber-800 bg-amber-200/80 px-2 py-1 rounded">
            Actions requises
          </span>
        </div>
      )}

      {/* Primary KPI Grid: Financial Distinction (FIN-15) */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {/* Chiffre d'affaires facturé */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">CA Facturé Émis (FIN-15)</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg">
              <FileText className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-3">
            {formatGNF(totalInvoicedGNF)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-blue-600">{issuedInvoices.length} factures</span> émises validées
          </div>
        </div>

        {/* Trésorerie encaissée */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Trésorerie Encaissée</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
              <DollarSign className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-emerald-700 mt-3">
            {formatGNF(totalCollectedGNF)}
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center gap-1">
            <span className="font-semibold text-emerald-600">
              {totalInvoicedGNF > 0 ? Math.round((totalCollectedGNF / totalInvoicedGNF) * 100) : 0}%
            </span>{' '}
            du montant facturé recouvré
          </div>
        </div>

        {/* Créances en attente & Impayés */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Créances Restantes</span>
            <div className="p-2 bg-amber-50 text-amber-600 rounded-lg">
              <CreditCard className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-amber-700 mt-3">
            {formatGNF(totalRemainingGNF)}
          </div>
          <div className="text-xs text-slate-500 mt-1">
            Dont <strong className="text-rose-600 font-bold">{formatGNF(totalOverdueGNF)}</strong> en retard d'échéance
          </div>
        </div>

        {/* Tonnage Bauxite */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm hover:shadow transition">
          <div className="flex items-center justify-between text-slate-500">
            <span className="text-xs font-bold uppercase tracking-wider">Tonnage Bauxite Validé</span>
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg">
              <TrendingUp className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl font-extrabold text-slate-900 mt-3">
            {totalTonnageTransported.toLocaleString('fr-FR')} <span className="text-sm font-semibold text-slate-500">Tonnes</span>
          </div>
          <div className="text-xs text-slate-500 mt-1 flex items-center justify-between">
            <span>{filteredTrips.filter((t) => t.status === 'valide').length} voyages certifiés</span>
            {pendingTripsToValidate.length > 0 && (
              <span className="text-amber-700 font-bold bg-amber-100 px-1.5 py-0.5 rounded text-[10px]">
                {pendingTripsToValidate.length} à valider
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Secondary Operational Dashboards */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Carburant & Citernes (CAR) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-purple-50 text-purple-600 rounded-lg">
                  <Fuel className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Parc Citernes & Carburant</h3>
              </div>
              <span className="text-xs font-bold text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                CAR-06 / CAR-09
              </span>
            </div>

            <div className="mb-4">
              <div className="flex justify-between text-xs font-medium text-slate-600 mb-1">
                <span>Stock Global Gasoil</span>
                <span className="font-bold text-slate-900">
                  {totalFuelStock.toLocaleString('fr-FR')} / {totalFuelCapacity.toLocaleString('fr-FR')} L
                </span>
              </div>
              <div className="w-full bg-slate-100 h-3 rounded-full overflow-hidden">
                <div
                  className={`h-full rounded-full transition-all ${
                    totalFuelStock / totalFuelCapacity < 0.25 ? 'bg-rose-500' : 'bg-purple-600'
                  }`}
                  style={{ width: `${Math.min(100, Math.round((totalFuelStock / totalFuelCapacity) * 100))}%` }}
                />
              </div>
            </div>

            <div className="space-y-2.5">
              {fuelCisterns.map((c) => {
                const ratio = Math.round((c.currentStockLiters / c.capacityLiters) * 100);
                const isLow = c.currentStockLiters <= c.alertThresholdLiters;
                return (
                  <div key={c.id} className="p-2.5 rounded-lg bg-slate-50 border border-slate-100 flex items-center justify-between">
                    <div>
                      <div className="font-bold text-xs text-slate-800 flex items-center gap-1.5">
                        {c.code}
                        {isLow && (
                          <span className="px-1.5 py-0.2 bg-rose-100 text-rose-700 text-[10px] font-extrabold rounded">
                            STOCK BAS
                          </span>
                        )}
                      </div>
                      <div className="text-[11px] text-slate-500">{c.siteName}</div>
                    </div>
                    <div className="text-right">
                      <div className="text-xs font-extrabold text-slate-900">
                        {c.currentStockLiters.toLocaleString('fr-FR')} L
                      </div>
                      <div className="text-[10px] text-slate-400">{ratio}% capacité</div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Flotte & Disponibilité (FLT) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-emerald-50 text-emerald-600 rounded-lg">
                  <Truck className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Disponibilité Flotte & Engins</h3>
              </div>
              <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                FLT-05
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 mb-4 text-center">
              <div className="p-2.5 bg-slate-50 rounded-lg border border-slate-100">
                <div className="text-lg font-black text-slate-900">{totalVehicles}</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase">Total Parc</div>
              </div>
              <div className="p-2.5 bg-emerald-50 rounded-lg border border-emerald-100">
                <div className="text-lg font-black text-emerald-700">{activeVehicles}</div>
                <div className="text-[10px] font-bold text-emerald-700 uppercase">Opérationnels</div>
              </div>
              <div className="p-2.5 bg-rose-50 rounded-lg border border-rose-100">
                <div className="text-lg font-black text-rose-700">{brokenVehicles}</div>
                <div className="text-[10px] font-bold text-rose-700 uppercase">En Panne</div>
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Derniers engins mobilisés :</div>
              {vehicles.slice(0, 3).map((v) => (
                <div key={v.id} className="flex items-center justify-between p-2 rounded-lg bg-slate-50 text-xs">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-slate-800">{v.code}</span>
                    <span className="text-slate-500 text-[11px]">{v.plateNumber}</span>
                  </div>
                  <span
                    className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                      v.status === 'mobilise'
                        ? 'bg-blue-100 text-blue-800'
                        : v.status === 'disponible'
                        ? 'bg-emerald-100 text-emerald-800'
                        : 'bg-rose-100 text-rose-800'
                    }`}
                  >
                    {v.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Arrosage Pistes (ARR - v1.1) */}
        <div className="bg-white p-5 rounded-xl border border-slate-200 shadow-sm flex flex-col justify-between">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-cyan-50 text-cyan-600 rounded-lg">
                  <Droplets className="w-4 h-4" />
                </div>
                <h3 className="font-bold text-slate-900 text-sm">Arrosage & Poussières Pistes</h3>
              </div>
              <span className="text-xs font-bold text-cyan-700 bg-cyan-50 px-2 py-0.5 rounded">
                ARR-04
              </span>
            </div>

            <div className="p-3 bg-cyan-50/50 rounded-xl border border-cyan-100 mb-4">
              <div className="text-xs font-medium text-cyan-900">Volume Total Épandu</div>
              <div className="text-2xl font-black text-cyan-800 mt-1">
                {totalWateringVolume.toLocaleString('fr-FR')} <span className="text-sm font-medium">Litres</span>
              </div>
              <div className="text-[11px] text-cyan-700 mt-0.5">
                Sur les pistes minières de Sangarédi & Boké (abattage poussières bauxite).
              </div>
            </div>

            <div className="space-y-2">
              <div className="text-xs font-semibold text-slate-700">Dernières tournées validées :</div>
              {wateringRuns.slice(0, 3).map((w) => (
                <div key={w.id} className="p-2 rounded-lg bg-slate-50 text-xs flex justify-between items-center">
                  <div>
                    <div className="font-semibold text-slate-800">{w.roadZone}</div>
                    <div className="text-[10px] text-slate-500">{w.rotationsCount} rotations • {w.driverName}</div>
                  </div>
                  <span className="text-xs font-bold text-cyan-800">
                    {(w.estimatedVolumeLiters / 1000).toLocaleString('fr-FR')} m³
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
