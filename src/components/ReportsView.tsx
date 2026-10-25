import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  FileSpreadsheet,
  Download,
  Calendar,
  Filter,
  CheckCircle2,
  TrendingUp,
  Fuel,
  CreditCard,
  Printer,
} from 'lucide-react';
import { formatGNF } from '../utils/rules.ts';

export const ReportsView: React.FC = () => {
  const { trips, cisterns, fuelMovements, invoices, payments, contracts, vehicles } = useApp();

  const [reportType, setReportType] = useState<'trips' | 'fuel' | 'invoices'>('trips');
  const [startDate, setStartDate] = useState('2026-10-01');
  const [endDate, setEndDate] = useState('2026-10-31');
  const [downloadSuccess, setDownloadSuccess] = useState<string | null>(null);

  // Helper to trigger browser CSV download
  const downloadCSV = (filename: string, csvContent: string) => {
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    setDownloadSuccess(`Rapport "${filename}" exporté avec succès.`);
    setTimeout(() => setDownloadSuccess(null), 4000);
  };

  const handleExport = () => {
    if (reportType === 'trips') {
      const filtered = trips.filter(
        (t) => t.createdAt >= startDate && t.createdAt <= endDate + ' 23:59'
      );
      const headers = ['N_Ticket_Pesee', 'Date_Heure', 'Contrat', 'Camion', 'Chauffeur', 'Origine', 'Destination', 'Poids_Brut_T', 'Tare_T', 'Poids_Net_T', 'Montant_GNF', 'Statut'];
      const rows = filtered.map((t) => {
        const v = vehicles.find((veh) => veh.id === t.vehicleId);
        const c = contracts.find((ctr) => ctr.id === t.contractId);
        return [
          t.weighTicketNumber,
          t.createdAt,
          c?.code || t.contractId,
          v?.plateNumber || t.vehicleId,
          t.driverId,
          `"${t.departureSite}"`,
          `"${t.arrivalSite}"`,
          t.grossWeightTons,
          t.tareWeightTons,
          t.netWeightTons,
          t.calculatedAmountGNF,
          t.status,
        ].join(';');
      });
      const csv = [headers.join(';'), ...rows].join('\n');
      downloadCSV(`EDEP_Rapport_Pesee_${startDate}_au_${endDate}.csv`, csv);
    } else if (reportType === 'fuel') {
      const filtered = fuelMovements.filter(
        (m) => m.date >= startDate && m.date <= endDate + ' 23:59'
      );
      const headers = ['Date', 'Type', 'Citerne', 'Volume_Litres', 'Prix_Unitaire_GNF', 'Fournisseur_Beneficiaire', 'Justification'];
      const rows = filtered.map((m) => {
        const c = cisterns.find((cist) => cist.id === m.cisternId);
        return [
          m.date,
          m.type,
          c?.code || m.cisternId,
          m.volumeLiters,
          m.unitPriceGNF,
          `"${m.supplierName || m.beneficiaryDriverName || ''}"`,
          `"${m.justification || ''}"`,
        ].join(';');
      });
      const csv = [headers.join(';'), ...rows].join('\n');
      downloadCSV(`EDEP_Consommation_Carburant_${startDate}_au_${endDate}.csv`, csv);
    } else {
      const headers = ['Numero_Facture', 'Client', 'Date_Emission', 'Echeance', 'Total_TTC_GNF', 'Encaisse_GNF', 'Reste_Du_GNF', 'Statut_Emission', 'Statut_Paiement'];
      const rows = invoices.map((inv) => [
        inv.invoiceNumber,
        `"${inv.clientName}"`,
        inv.issueDate,
        inv.dueDate,
        inv.totalGNF,
        inv.paidAmountGNF,
        inv.remainingAmountGNF,
        inv.status,
        inv.paymentStatus,
      ].join(';'));
      const csv = [headers.join(';'), ...rows].join('\n');
      downloadCSV(`EDEP_Journal_Ventes_Facturation.csv`, csv);
    }
  };

  return (
    <div className="space-y-6">
      {/* Toast Alert */}
      {downloadSuccess && (
        <div className="p-3 bg-emerald-700 text-white rounded-lg text-xs font-semibold flex justify-between items-center shadow">
          <span>{downloadSuccess}</span>
          <button onClick={() => setDownloadSuccess(null)} className="font-bold">✕</button>
        </div>
      )}

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold text-blue-600 bg-blue-50 px-2 py-0.5 rounded border border-blue-200">
              Module DIR-03 & FIN-16
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Rapports d'Activité & Exports Comptables
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Génération des états certifiés, exportations pour logiciel comptable et bilans périodiques conformes aux règles de gestion.
          </p>
        </div>

        <button
          onClick={handleExport}
          className="flex items-center gap-2 bg-slate-900 hover:bg-slate-800 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition self-start sm:self-auto"
        >
          <Download className="w-4 h-4 text-amber-400" />
          <span>Exporter au format Tableur / CSV</span>
        </button>
      </div>

      {/* Filter Box */}
      <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm text-xs space-y-4">
        <div className="font-bold text-slate-800 text-sm">Paramètres de l'état (DIR-03) :</div>
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div>
            <label className="font-bold text-slate-600 block mb-1">Type de Rapport</label>
            <select
              value={reportType}
              onChange={(e) => setReportType(e.target.value as any)}
              className="w-full border border-slate-300 rounded-lg p-2 font-bold"
            >
              <option value="trips">Relevé des Voyages & Tonnages Minerai</option>
              <option value="fuel">État des Mouvements de Carburant</option>
              <option value="invoices">Grand Livre de Facturation & Recouvrement</option>
            </select>
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Date de début</label>
            <input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2"
            />
          </div>

          <div>
            <label className="font-bold text-slate-600 block mb-1">Date de fin</label>
            <input
              type="date"
              value={endDate}
              onChange={(e) => setEndDate(e.target.value)}
              className="w-full border border-slate-300 rounded-lg p-2"
            />
          </div>
        </div>
      </div>

      {/* Live Preview of Data */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <span className="font-bold text-slate-700 uppercase">
            Aperçu des données avant export ({reportType === 'trips' ? trips.length : reportType === 'fuel' ? fuelMovements.length : invoices.length} lignes)
          </span>
          <span className="text-[11px] text-slate-500">Période active : {startDate} au {endDate}</span>
        </div>

        <div className="p-4 text-xs text-slate-600">
          <p className="mb-3">
            Ce tableau synthétise les enregistrements validés. En cliquant sur le bouton <strong>« Exporter au format Tableur / CSV »</strong> ci-dessus, vous obtiendrez un fichier structuré avec point-virgule comme séparateur, compatible avec Microsoft Excel, LibreOffice Calc et Sage Comptabilité.
          </p>

          <div className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-amber-900 space-y-1">
            <div className="font-bold">Principes directeurs respectés :</div>
            <div>• <strong>RG-09 :</strong> Les montants historiques conservent leur devise de transaction (GNF) sans reconversion aléatoire.</div>
            <div>• <strong>FIN-15 :</strong> Distinction intégrale entre chiffre d'affaires facturé et encaissements réels pour éviter toute confusion de trésorerie.</div>
            <div>• <strong>TRN-08 :</strong> Relevés regroupés par contrat, camion, chauffeur et période pour conciliation avec le client minier.</div>
          </div>
        </div>
      </div>
    </div>
  );
};
