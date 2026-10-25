import React, { useState } from 'react';
import { AppProvider, useApp } from './context/AppContext.tsx';
import { Header } from './components/Header.tsx';
import { DashboardView } from './components/DashboardView.tsx';
import { ContractsView } from './components/ContractsView.tsx';
import { FleetView } from './components/FleetView.tsx';
import { TransportView } from './components/TransportView.tsx';
import { FuelView } from './components/FuelView.tsx';
import { WateringView } from './components/WateringView.tsx';
import { InvoiceView } from './components/InvoiceView.tsx';
import { ReportsView } from './components/ReportsView.tsx';
import { AuditView } from './components/AuditView.tsx';
import {
  LayoutDashboard,
  FileText,
  Truck,
  Scale,
  Fuel,
  Droplets,
  CreditCard,
  FileSpreadsheet,
  ShieldCheck,
  Menu,
  X,
} from 'lucide-react';

type TabId =
  | 'dashboard'
  | 'contracts'
  | 'fleet'
  | 'transport'
  | 'fuel'
  | 'watering'
  | 'invoices'
  | 'reports'
  | 'audit';

const AppContent: React.FC = () => {
  const { currentUser } = useApp();
  const [activeTab, setActiveTab] = useState<TabId>('dashboard');
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  // Filter tabs according to role
  const isClient = currentUser.role === 'client';
  const isChauffeur = currentUser.role === 'chauffeur';

  const NAV_ITEMS: { id: TabId; label: string; icon: React.ComponentType<{ className?: string }>; roleRestricted?: boolean }[] = [
    { id: 'dashboard', label: 'Tableau de bord', icon: LayoutDashboard },
    { id: 'contracts', label: 'Contrats', icon: FileText },
    { id: 'fleet', label: 'Flotte & Pannes', icon: Truck },
    { id: 'transport', label: 'Transport & Pesée', icon: Scale },
    { id: 'watering', label: 'Arrosage Pistes', icon: Droplets },
    { id: 'fuel', label: 'Citernes & Carburant', icon: Fuel },
    { id: 'invoices', label: isClient ? 'Mes Factures' : 'Facturation & Règlements', icon: CreditCard },
    { id: 'reports', label: 'Rapports & Exports', icon: FileSpreadsheet },
    { id: 'audit', label: 'Audit & Permissions', icon: ShieldCheck },
  ];

  const visibleNavItems = NAV_ITEMS.filter((item) => {
    if (isClient) {
      return item.id === 'invoices' || item.id === 'transport' || item.id === 'dashboard';
    }
    if (isChauffeur) {
      return item.id === 'transport' || item.id === 'fleet' || item.id === 'fuel' || item.id === 'watering';
    }
    return true;
  });

  return (
    <div className="min-h-screen bg-slate-100 flex flex-col font-sans text-slate-800">
      {/* Header */}
      <Header />

      {/* Main Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 flex flex-col md:flex-row gap-6">
        {/* Navigation Sidebar (Desktop) */}
        <aside className="w-64 shrink-0 hidden md:block">
          <div className="bg-white rounded-2xl border border-slate-200 p-3 shadow-sm sticky top-24">
            <div className="px-3 py-2 text-[10px] font-extrabold uppercase tracking-wider text-slate-400">
              Espaces Fonctionnels
            </div>
            <nav className="space-y-1 mt-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => setActiveTab(item.id)}
                    className={`w-full flex items-center gap-3 px-3.5 py-2.5 rounded-xl text-xs font-bold transition text-left ${
                      isActive
                        ? 'bg-amber-500 text-slate-950 shadow-sm'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className={`w-4 h-4 ${isActive ? 'text-slate-950' : 'text-slate-400'}`} />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="mt-6 pt-4 border-t border-slate-100 px-3 text-[11px] text-slate-400">
              <div>EDEP CONNECT v1.1</div>
              <div className="text-[10px] text-slate-400 mt-0.5">Boffa • Boké • Kamsar</div>
            </div>
          </div>
        </aside>

        {/* Mobile Navigation Drawer Toggle */}
        <div className="md:hidden flex items-center justify-between bg-white p-3 rounded-xl border border-slate-200">
          <div className="flex items-center gap-2">
            <span className="font-extrabold text-xs text-slate-900">Module actif :</span>
            <span className="font-bold text-xs text-amber-700 capitalize">
              {NAV_ITEMS.find((n) => n.id === activeTab)?.label}
            </span>
          </div>
          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 bg-slate-100 hover:bg-slate-200 rounded-lg text-slate-700"
          >
            {isMobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>

        {/* Mobile Menu Dropdown */}
        {isMobileMenuOpen && (
          <div className="md:hidden bg-white rounded-xl border border-slate-200 p-2 shadow-lg mb-4">
            <nav className="space-y-1">
              {visibleNavItems.map((item) => {
                const Icon = item.icon;
                const isActive = activeTab === item.id;
                return (
                  <button
                    key={item.id}
                    onClick={() => {
                      setActiveTab(item.id);
                      setIsMobileMenuOpen(false);
                    }}
                    className={`w-full flex items-center gap-3 px-3 py-2 rounded-lg text-xs font-bold text-left ${
                      isActive ? 'bg-amber-500 text-slate-950' : 'text-slate-600 hover:bg-slate-50'
                    }`}
                  >
                    <Icon className="w-4 h-4" />
                    <span>{item.label}</span>
                  </button>
                );
              })}
            </nav>
          </div>
        )}

        {/* Main Content View Container */}
        <main className="flex-1 min-w-0">
          {activeTab === 'dashboard' && <DashboardView />}
          {activeTab === 'contracts' && <ContractsView />}
          {activeTab === 'fleet' && <FleetView />}
          {activeTab === 'transport' && <TransportView />}
          {activeTab === 'fuel' && <FuelView />}
          {activeTab === 'watering' && <WateringView />}
          {activeTab === 'invoices' && <InvoiceView />}
          {activeTab === 'reports' && <ReportsView />}
          {activeTab === 'audit' && <AuditView />}
        </main>
      </div>
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <AppContent />
    </AppProvider>
  );
}
