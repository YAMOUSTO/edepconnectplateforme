import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Shield,
  Lock,
  History,
  CheckCircle2,
  AlertTriangle,
  UserCheck,
  FileText,
  KeyRound,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

export const AuditView: React.FC = () => {
  const { auditLogs, currentUser } = useApp();
  const [filterAction, setFilterAction] = useState<string>('all');

  const filteredLogs = filterAction === 'all'
    ? auditLogs
    : auditLogs.filter((l) => l.action.toLowerCase().includes(filterAction.toLowerCase()));

  // Annexe B Matrix definition
  const MATRIX_ROWS = [
    { module: 'Contrats (CTR)', pdg: 'L C M V E', dg: 'L V E', fin: 'L', com: 'L C M', exp: 'L C M', carb: 'L (P)', sup: 'L (P)', drv: '—', cli: '—' },
    { module: 'Flotte & Transport (FLT/TRN)', pdg: 'L C M V E', dg: 'L E', fin: 'L (relevés)', com: '—', exp: 'L C M V E', carb: 'L', sup: 'L C V (P)', drv: 'L C (P)', cli: '—' },
    { module: 'Carburant (CAR)', pdg: 'L V E', dg: 'L E', fin: 'L', com: '—', exp: 'L', carb: 'L C M V E', sup: 'L C (P)', drv: 'C (P)', cli: '—' },
    { module: 'Facturation & Paiements (FIN)', pdg: 'L V E', dg: 'L E', fin: 'L C M V E, Paie C', com: 'L', exp: '—', carb: '—', sup: '—', drv: '—', cli: 'L (P)' },
    { module: 'Dépenses & Fournisseurs', pdg: 'L V', dg: 'L', fin: 'L C V', com: '—', exp: 'C', carb: 'C', sup: '—', drv: '—', cli: '—' },
    { module: 'Tableau de Bord Exécutif', pdg: 'L E', dg: 'L E', fin: 'L E (fin)', com: 'L (com)', exp: 'L (exp)', carb: 'L (carb)', sup: 'L (P)', drv: '—', cli: '—' },
    { module: 'Administration & Paramètres', pdg: 'C M V', dg: '—', fin: '—', com: '—', exp: '—', carb: '—', sup: '—', drv: '—', cli: '—' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2">
            <span className="text-xs uppercase font-extrabold text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
              Module SEC-04 & RG-11
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Journal d'Audit Immuable & Matrice des Permissions
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Traçabilité intégrale : chaque création, validation, annulation ou modification conserve l'auteur, l'horodatage, les valeurs et le motif.
          </p>
        </div>

        <div className="flex items-center gap-2 self-start sm:self-auto">
          <span className="flex items-center gap-1.5 px-3 py-1.5 bg-emerald-50 text-emerald-800 border border-emerald-200 rounded-xl text-xs font-bold">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Journal en Écriture Seule (Append-Only)</span>
          </span>
        </div>
      </div>

      {/* Security Principles Reminder (Section 4.4 & SOD-01 to SOD-04) */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <Shield className="w-4 h-4 text-amber-600" />
            SOD-01 : Validation Croisée
          </div>
          <p className="text-slate-500 text-[11px]">
            Un utilisateur ne peut jamais valider une pesée, un rapport ou un voyage qu'il a lui-même saisi.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <Lock className="w-4 h-4 text-blue-600" />
            SOD-02 : Motif Obligatoire
          </div>
          <p className="text-slate-500 text-[11px]">
            Toute modification ou correction d'un stock ou document financier exige un motif formel et un approbateur distinct.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <FileText className="w-4 h-4 text-purple-600" />
            SOD-04 : Écarts Carburant
          </div>
          <p className="text-slate-500 text-[11px]">
            L'approbation d'un écart physique relève du Responsable Carburant ou de la Direction, jamais de l'agent distributeur.
          </p>
        </div>

        <div className="p-4 bg-white rounded-xl border border-slate-200 shadow-sm text-xs">
          <div className="font-extrabold text-slate-900 flex items-center gap-2 mb-1">
            <KeyRound className="w-4 h-4 text-emerald-600" />
            RG-08 : Non-Suppression
          </div>
          <p className="text-slate-500 text-[11px]">
            Aucune suppression physique : toute annulation se fait par contre-passation (avoirs, écritures inverses).
          </p>
        </div>
      </div>

      {/* Annexe B Permissions Matrix */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex justify-between items-center text-xs">
          <div className="font-bold text-slate-700 uppercase">
            Matrice des Droits par Profil (Annexe B du Cahier des Charges)
          </div>
          <div className="text-[11px] text-slate-500">
            Légende : L = Lecture, C = Création, M = Modification, V = Validation, E = Export, (P) = Périmètre propre
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[10px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="p-3">Module Métier</th>
                <th className={`p-3 text-center ${currentUser.role === 'pdg' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>PDG</th>
                <th className={`p-3 text-center ${currentUser.role === 'direction' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Direction</th>
                <th className={`p-3 text-center ${currentUser.role === 'finance' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Finance</th>
                <th className={`p-3 text-center ${currentUser.role === 'commercial' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Commercial</th>
                <th className={`p-3 text-center ${currentUser.role === 'exploitation' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Exploitation</th>
                <th className={`p-3 text-center ${currentUser.role === 'carburant' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Carburant</th>
                <th className={`p-3 text-center ${currentUser.role === 'superviseur' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Superviseur</th>
                <th className={`p-3 text-center ${currentUser.role === 'chauffeur' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Chauffeur</th>
                <th className={`p-3 text-center ${currentUser.role === 'client' ? 'bg-amber-100 text-amber-900 font-black' : ''}`}>Client</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {MATRIX_ROWS.map((row, idx) => (
                <tr key={idx} className="hover:bg-slate-50 transition">
                  <td className="p-3 font-bold text-slate-800">{row.module}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.pdg}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.dg}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.fin}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.com}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.exp}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.carb}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.sup}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.drv}</td>
                  <td className="p-3 text-center font-mono text-[11px]">{row.cli}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Audit Logs Table (SEC-04 / RG-11) */}
      <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-4 bg-slate-50 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div className="text-xs font-bold text-slate-700 uppercase">
            Journal Chronologique des Événements d'Audit ({auditLogs.length} entrées)
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-slate-500">Filtrer action :</span>
            <select
              value={filterAction}
              onChange={(e) => setFilterAction(e.target.value)}
              className="border border-slate-300 rounded px-2 py-1 text-xs"
            >
              <option value="all">Toutes les actions</option>
              <option value="VALIDATION">Validations (SOD)</option>
              <option value="FACTURE">Factures</option>
              <option value="CARBURANT">Carburant</option>
              <option value="VOYAGE">Voyages & Pesées</option>
              <option value="CONTRAT">Contrats</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs text-slate-600">
            <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
              <tr>
                <th className="p-3">Horodatage (UTC+0)</th>
                <th className="p-3">Utilisateur & Rôle</th>
                <th className="p-3">Action Système</th>
                <th className="p-3">Entité Cible</th>
                <th className="p-3">Valeur Initiale</th>
                <th className="p-3">Nouvelle Valeur</th>
                <th className="p-3">Motif Consigné (RG-11)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 font-mono text-[11px]">
              {filteredLogs.map((log) => (
                <tr key={log.id} className="hover:bg-slate-50 transition">
                  <td className="p-3 text-slate-500 whitespace-nowrap">{log.timestamp}</td>
                  <td className="p-3 font-sans">
                    <div className="font-bold text-slate-900">{log.userName}</div>
                    <span className="text-[10px] text-amber-800 uppercase font-bold">{log.userRole}</span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-bold font-sans text-[10px]">
                      {log.action}
                    </span>
                  </td>
                  <td className="p-3 text-slate-700 font-sans font-medium">
                    {log.entityType} ({log.entityId})
                  </td>
                  <td className="p-3 text-slate-400">{log.previousValue || '—'}</td>
                  <td className="p-3 text-emerald-700 font-bold">{log.newValue || '—'}</td>
                  <td className="p-3 font-sans text-slate-600 italic max-w-sm truncate">
                    {log.reason || '—'}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
