import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  Shield,
  Wifi,
  WifiOff,
  RefreshCw,
  Bell,
  UserCheck,
  ChevronDown,
  Building2,
  Truck,
  AlertTriangle,
} from 'lucide-react';
import { UserRole } from '../types/index.ts';

const ROLE_LABELS: Record<UserRole, { label: string; badgeColor: string }> = {
  pdg: { label: 'PDG / Admin Principal', badgeColor: 'bg-amber-100 text-amber-900 border-amber-300' },
  direction: { label: 'Direction Générale', badgeColor: 'bg-blue-100 text-blue-900 border-blue-300' },
  finance: { label: 'Finance & Comptabilité', badgeColor: 'bg-emerald-100 text-emerald-900 border-emerald-300' },
  commercial: { label: 'Commercial', badgeColor: 'bg-indigo-100 text-indigo-900 border-indigo-300' },
  exploitation: { label: 'Exploitation & Logistique', badgeColor: 'bg-orange-100 text-orange-900 border-orange-300' },
  carburant: { label: 'Carburant & Magasin', badgeColor: 'bg-purple-100 text-purple-900 border-purple-300' },
  superviseur: { label: 'Superviseur de Terrain', badgeColor: 'bg-cyan-100 text-cyan-900 border-cyan-300' },
  chauffeur: { label: 'Chauffeur / Opérateur', badgeColor: 'bg-stone-100 text-stone-900 border-stone-300' },
  client: { label: 'Portail Client (SMB)', badgeColor: 'bg-teal-100 text-teal-900 border-teal-300' },
};

export const Header: React.FC = () => {
  const {
    currentUser,
    setCurrentUser,
    users,
    isOfflineMode,
    toggleOfflineMode,
    offlineQueue,
    synchronizeOfflineQueue,
    cisterns,
    breakdowns,
  } = useApp();

  const [isRoleDropdownOpen, setIsRoleDropdownOpen] = useState(false);
  const [notificationMsg, setNotificationMsg] = useState<string | null>(null);

  // Check alerts for notification badge
  const lowFuelCisterns = cisterns.filter((c) => c.currentStockLiters <= c.alertThresholdLiters);
  const activeBreakdowns = breakdowns.filter((b) => b.status === 'en_cours');
  const alertCount = lowFuelCisterns.length + activeBreakdowns.length + offlineQueue.length;

  const handleSync = () => {
    const res = synchronizeOfflineQueue();
    setNotificationMsg(res.message);
    setTimeout(() => setNotificationMsg(null), 4000);
  };

  return (
    <header className="bg-slate-900 text-white border-b border-slate-800 sticky top-0 z-50 shadow-md">
      {/* Toast Notification */}
      {notificationMsg && (
        <div className="bg-emerald-600 text-white text-xs px-4 py-2 font-medium flex items-center justify-between">
          <span>{notificationMsg}</span>
          <button onClick={() => setNotificationMsg(null)} className="ml-4 font-bold text-slate-100">✕</button>
        </div>
      )}

      {/* Offline banner if offline */}
      {isOfflineMode && (
        <div className="bg-amber-600 text-amber-50 text-xs px-4 py-1.5 flex items-center justify-between font-medium">
          <div className="flex items-center gap-2">
            <WifiOff className="w-4 h-4 shrink-0 animate-pulse text-amber-200" />
            <span>
              <strong>Mode Hors Ligne Actif (Zone Piste Minière) :</strong> Les saisies (voyages, pesées, carburant, arrosage) sont conservées en local et synchronisées automatiquement au retour du réseau.
            </span>
          </div>
          <span className="bg-amber-800/80 px-2 py-0.5 rounded text-[11px] font-bold">
            {offlineQueue.length} en attente
          </span>
        </div>
      )}

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        {/* Brand & Slogan */}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-lg bg-gradient-to-tr from-amber-500 to-amber-600 flex items-center justify-center font-black text-slate-950 text-lg shadow">
            EP
          </div>
          <div>
            <div className="flex items-center gap-2">
              <span className="font-extrabold text-lg tracking-tight text-amber-400">EDEP CONNECT</span>
              <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded bg-slate-800 text-slate-300 border border-slate-700">
                Guinée • v1.1
              </span>
            </div>
            <p className="text-[11px] text-slate-400 hidden sm:block">
              Connectons les entreprises, développons les opportunités
            </p>
          </div>
        </div>

        {/* Actions & Role Switcher */}
        <div className="flex items-center gap-3">
          {/* Offline simulator toggle button */}
          <button
            onClick={toggleOfflineMode}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition border ${
              isOfflineMode
                ? 'bg-amber-500/20 text-amber-300 border-amber-500/40 hover:bg-amber-500/30'
                : 'bg-slate-800 text-slate-300 border-slate-700 hover:bg-slate-700'
            }`}
            title="Simuler une coupure réseau sur site d'extraction minière"
          >
            {isOfflineMode ? <WifiOff className="w-3.5 h-3.5 text-amber-400" /> : <Wifi className="w-3.5 h-3.5 text-emerald-400" />}
            <span className="hidden md:inline">{isOfflineMode ? 'Réseau Coupé' : 'En Ligne'}</span>
          </button>

          {/* Sync Button if queue has items */}
          {offlineQueue.length > 0 && !isOfflineMode && (
            <button
              onClick={handleSync}
              className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-amber-500 hover:bg-amber-400 text-slate-950 text-xs font-bold transition shadow"
              title="Synchroniser la file d'attente locale"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Sync ({offlineQueue.length})</span>
            </button>
          )}

          {/* Alert badge */}
          <div className="relative">
            <button
              className="p-2 text-slate-400 hover:text-slate-200 bg-slate-800 rounded-lg border border-slate-700 hover:bg-slate-700 transition"
              title="Alertes opérationnelles"
            >
              <Bell className="w-4 h-4" />
              {alertCount > 0 && (
                <span className="absolute -top-1 -right-1 w-4 h-4 bg-red-500 text-white rounded-full text-[10px] font-bold flex items-center justify-center">
                  {alertCount}
                </span>
              )}
            </button>
          </div>

          {/* User Profile & Role Switcher */}
          <div className="relative">
            <button
              onClick={() => setIsRoleDropdownOpen(!isRoleDropdownOpen)}
              className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800 border border-slate-700 hover:border-slate-600 transition text-left"
            >
              <div className="w-7 h-7 rounded-full bg-slate-700 flex items-center justify-center font-bold text-xs text-amber-300 border border-slate-600">
                {currentUser.name.charAt(0)}
              </div>
              <div className="hidden lg:block text-xs">
                <div className="font-semibold text-slate-200 leading-tight">{currentUser.name}</div>
                <div className="text-[10px] text-amber-400 font-medium">
                  {ROLE_LABELS[currentUser.role]?.label || currentUser.role}
                </div>
              </div>
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            </button>

            {/* Dropdown to switch user role */}
            {isRoleDropdownOpen && (
              <div className="absolute right-0 mt-2 w-80 bg-slate-800 border border-slate-700 rounded-xl shadow-2xl py-2 z-50">
                <div className="px-3 py-2 border-b border-slate-700">
                  <div className="text-xs font-bold text-slate-300 uppercase tracking-wider">
                    Simulateur de profil & droits (Annexe B)
                  </div>
                  <p className="text-[11px] text-slate-400 mt-0.5">
                    Changez de rôle en 1 clic pour tester la matrice de permissions et les règles SOD :
                  </p>
                </div>
                <div className="max-h-80 overflow-y-auto py-1">
                  {users.map((u) => {
                    const isSelected = u.id === currentUser.id;
                    const roleInfo = ROLE_LABELS[u.role];
                    return (
                      <button
                        key={u.id}
                        onClick={() => {
                          setCurrentUser(u);
                          setIsRoleDropdownOpen(false);
                        }}
                        className={`w-full text-left px-3 py-2 text-xs flex items-center justify-between hover:bg-slate-700/80 transition ${
                          isSelected ? 'bg-amber-500/10 border-l-2 border-amber-500' : ''
                        }`}
                      >
                        <div>
                          <div className="font-medium text-slate-200">{u.name}</div>
                          <div className="text-[10px] text-slate-400">{u.email}</div>
                        </div>
                        <span className={`text-[10px] font-bold px-2 py-0.5 rounded border ${roleInfo.badgeColor}`}>
                          {roleInfo.label.split(' ')[0]}
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};
