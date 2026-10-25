import React, { useState } from 'react';
import { useApp } from '../context/AppContext.tsx';
import {
  FileText,
  Plus,
  CreditCard,
  DollarSign,
  AlertCircle,
  CheckCircle2,
  Printer,
  X,
  FileMinus,
  Building,
  Calendar,
  Lock,
} from 'lucide-react';
import { formatGNF, calculateClientBalance } from '../utils/rules.ts';
import { Invoice, Payment } from '../types/index.ts';

export const InvoiceView: React.FC = () => {
  const {
    invoices,
    createInvoiceFromPrestations,
    emitInvoice,
    recordPayment,
    issueCreditNote,
    payments,
    creditNotes,
    contracts,
    currentUser,
    canAccess,
  } = useApp();

  const [activeTab, setActiveTab] = useState<'invoices' | 'payments' | 'credit_notes'>('invoices');
  const [selectedInvoiceForPrint, setSelectedInvoiceForPrint] = useState<Invoice | null>(null);
  const [isGenerateModalOpen, setIsGenerateModalOpen] = useState(false);
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState<{ invoiceId: string; remainingGNF: number; invNumber: string } | null>(null);
  const [isCreditNoteModalOpen, setIsCreditNoteModalOpen] = useState<{ invoiceId: string; totalGNF: number; invNumber: string } | null>(null);
  const [notification, setNotification] = useState<{ text: string; type: 'success' | 'error' } | null>(null);

  // Filter state (FIN-08)
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [filterClient, setFilterClient] = useState<string>('all');

  // Generation Form (FIN-01)
  const [genContractId, setGenContractId] = useState(contracts[0]?.id || '');
  const [periodStart, setPeriodStart] = useState('2026-10-01');
  const [periodEnd, setPeriodEnd] = useState('2026-10-22');
  const [taxRate, setTaxRate] = useState<number>(0); // 0% or 18%
  const [genNotes, setGenNotes] = useState('Facturation sur la base des pesées contradictoires certifiées.');

  // Payment Form (FIN-09)
  const [payAmount, setPayAmount] = useState<number>(10000000);
  const [payMethod, setPayMethod] = useState<Payment['paymentMethod']>('virement');
  const [payReference, setPayReference] = useState(`VIR-ECOBANK-${Date.now().toString().slice(-5)}`);

  // Credit Note Form (FIN-11)
  const [creditAmount, setCreditAmount] = useState<number>(1000000);
  const [creditReason, setCreditReason] = useState('Écart de pesée contradictoire mine');

  const selectedContract = contracts.find((c) => c.id === genContractId);

  // Filter invoices
  const filteredInvoices = invoices.filter((inv) => {
    // If current role is client, only show their company's invoices (ACC-03)
    if (currentUser.role === 'client' && inv.clientId !== 'cli-smb') {
      return false;
    }
    if (filterStatus !== 'all' && inv.status !== filterStatus && inv.paymentStatus !== filterStatus) {
      return false;
    }
    if (filterClient !== 'all' && inv.clientId !== filterClient) {
      return false;
    }
    return true;
  });

  const handleGenerateInvoice = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedContract) return;

    const res = createInvoiceFromPrestations(
      selectedContract.clientId,
      selectedContract.id,
      periodStart,
      periodEnd,
      taxRate,
      genNotes
    );

    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsGenerateModalOpen(false);
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleEmit = (invId: string) => {
    const res = emitInvoice(invId);
    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleRecordPaymentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isPaymentModalOpen) return;

    const res = recordPayment({
      invoiceId: isPaymentModalOpen.invoiceId,
      amountGNF: payAmount,
      paymentMethod: payMethod,
      reference: payReference,
    });

    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsPaymentModalOpen(null);
    } else {
      setNotification({ text: res.message, type: 'error' });
    }
  };

  const handleCreateCreditNoteSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isCreditNoteModalOpen) return;

    const res = issueCreditNote(isCreditNoteModalOpen.invoiceId, creditAmount, creditReason);
    if (res.success) {
      setNotification({ text: res.message, type: 'success' });
      setIsCreditNoteModalOpen(null);
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
            <span className="text-xs uppercase font-extrabold text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
              Module FIN-01 à FIN-16
            </span>
            <h2 className="text-xl font-black text-slate-900 tracking-tight">
              Facturation Centralisée, Avoirs & Encaissements
            </h2>
          </div>
          <p className="text-xs text-slate-500 mt-1">
            Génération depuis relevés validés, numérotation séquentielle certifiée, verrouillage à l'émission et règle de non-suppression (RG-08).
          </p>
        </div>

        {canAccess('invoice_create') && (
          <button
            onClick={() => setIsGenerateModalOpen(true)}
            className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-4 py-2 rounded-xl text-xs shadow transition self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Générer Facture depuis Prestations (FIN-01)</span>
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="flex border-b border-slate-200 gap-6 text-xs font-bold">
        <button
          onClick={() => setActiveTab('invoices')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'invoices' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Registre Factures Client ({filteredInvoices.length})
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'payments' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Encaissements & Règlements ({payments.length})
        </button>
        <button
          onClick={() => setActiveTab('credit_notes')}
          className={`pb-2.5 transition border-b-2 ${
            activeTab === 'credit_notes' ? 'border-emerald-600 text-emerald-700' : 'border-transparent text-slate-500 hover:text-slate-800'
          }`}
        >
          Avoirs & Rectifications ({creditNotes.length})
        </button>
      </div>

      {/* Filters (FIN-08) */}
      <div className="p-3 bg-white rounded-xl border border-slate-200 flex flex-wrap items-center gap-3 text-xs">
        <span className="font-bold text-slate-600">Filtres rapides (FIN-08) :</span>
        <select
          value={filterStatus}
          onChange={(e) => setFilterStatus(e.target.value)}
          className="border border-slate-300 rounded-lg px-2.5 py-1 text-xs"
        >
          <option value="all">Tous les états</option>
          <option value="emise">Émise (Verrouillée)</option>
          <option value="brouillon">Brouillon</option>
          <option value="partiellement_payee">Partiellement payée</option>
          <option value="payee">Soldée / Payée</option>
          <option value="echue">Échue / En retard</option>
        </select>
      </div>

      {/* Tab 1: Invoices Table */}
      {activeTab === 'invoices' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase tracking-wider">
                <tr>
                  <th className="p-3">N° Facture (FIN-03)</th>
                  <th className="p-3">Client & Activité</th>
                  <th className="p-3">Période Prestation</th>
                  <th className="p-3 text-right">Montant Total</th>
                  <th className="p-3 text-right">Déjà Encaissé</th>
                  <th className="p-3 text-right">Reste Dû</th>
                  <th className="p-3">Statut Émission</th>
                  <th className="p-3">Statut Règlement</th>
                  <th className="p-3 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredInvoices.map((inv) => (
                  <tr key={inv.id} className="hover:bg-slate-50 transition">
                    <td className="p-3 font-mono font-bold text-slate-900">
                      <div className="flex items-center gap-1.5">
                        <span>{inv.invoiceNumber}</span>
                        {inv.status === 'emise' && (
                          <Lock className="w-3 h-3 text-slate-400" title="Verrouillée après émission (FIN-06)" />
                        )}
                      </div>
                      <div className="text-[10px] text-slate-400 font-sans font-normal">Émise le {inv.issueDate}</div>
                    </td>

                    <td className="p-3">
                      <div className="font-black text-slate-900">{inv.clientName}</div>
                      <span className="text-[10px] font-semibold text-slate-500 uppercase">{inv.originType}</span>
                    </td>

                    <td className="p-3 text-slate-600">
                      <div>Du {inv.periodStart} au {inv.periodEnd}</div>
                      <div className="text-[10px] text-slate-400">Échéance: {inv.dueDate}</div>
                    </td>

                    <td className="p-3 text-right font-black text-slate-900 text-sm">
                      {formatGNF(inv.totalGNF)}
                    </td>

                    <td className="p-3 text-right font-bold text-emerald-700">
                      {formatGNF(inv.paidAmountGNF)}
                    </td>

                    <td className="p-3 text-right font-extrabold text-amber-700">
                      {formatGNF(inv.remainingAmountGNF)}
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase ${
                          inv.status === 'emise'
                            ? 'bg-slate-900 text-white'
                            : 'bg-amber-100 text-amber-800'
                        }`}
                      >
                        {inv.status}
                      </span>
                    </td>

                    <td className="p-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-black uppercase border ${
                          inv.paymentStatus === 'payee'
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : inv.paymentStatus === 'partiellement_payee'
                            ? 'bg-blue-50 text-blue-800 border-blue-200'
                            : inv.paymentStatus === 'echue'
                            ? 'bg-rose-50 text-rose-800 border-rose-200 animate-pulse'
                            : 'bg-slate-100 text-slate-700 border-slate-200'
                        }`}
                      >
                        {inv.paymentStatus === 'echue' ? 'Échue / En Retard' : inv.paymentStatus}
                      </span>
                    </td>

                    <td className="p-3 text-right">
                      <div className="flex items-center justify-end gap-1.5">
                        {/* Print / View PDF */}
                        <button
                          onClick={() => setSelectedInvoiceForPrint(inv)}
                          className="p-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 transition"
                          title="Imprimer / Télécharger Facture PDF"
                        >
                          <Printer className="w-3.5 h-3.5" />
                        </button>

                        {/* Emit lock button if draft */}
                        {inv.status === 'brouillon' && canAccess('invoice_emit') && (
                          <button
                            onClick={() => handleEmit(inv.id)}
                            className="px-2 py-1 bg-slate-900 hover:bg-slate-800 text-white rounded text-[10px] font-bold shadow"
                            title="Verrouiller et émettre officiellement"
                          >
                            Émettre
                          </button>
                        )}

                        {/* Pay button if remaining > 0 and issued */}
                        {inv.status === 'emise' && inv.remainingAmountGNF > 0 && canAccess('payment_record') && (
                          <button
                            onClick={() => {
                              setIsPaymentModalOpen({
                                invoiceId: inv.id,
                                remainingGNF: inv.remainingAmountGNF,
                                invNumber: inv.invoiceNumber,
                              });
                              setPayAmount(inv.remainingAmountGNF);
                            }}
                            className="px-2 py-1 bg-emerald-600 hover:bg-emerald-500 text-white rounded text-[10px] font-bold shadow"
                          >
                            Encaisser
                          </button>
                        )}

                        {/* Credit note button if issued */}
                        {inv.status === 'emise' && canAccess('invoice_create') && (
                          <button
                            onClick={() => {
                              setIsCreditNoteModalOpen({
                                invoiceId: inv.id,
                                totalGNF: inv.totalGNF,
                                invNumber: inv.invoiceNumber,
                              });
                              setCreditAmount(Math.round(inv.totalGNF * 0.05));
                            }}
                            className="px-2 py-1 bg-amber-100 hover:bg-amber-200 text-amber-800 rounded text-[10px] font-bold"
                            title="Créer un Avoir rectificatif (FIN-11)"
                          >
                            Avoir
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Payments Registry (FIN-09) */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
            Journal des Règlements & Quittances (FIN-09)
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs text-slate-600">
              <thead className="bg-slate-100 text-[11px] font-bold text-slate-700 uppercase">
                <tr>
                  <th className="p-3">Date</th>
                  <th className="p-3">Facture Affectée</th>
                  <th className="p-3">Mode de Règlement</th>
                  <th className="p-3">Référence Virement / Chèque</th>
                  <th className="p-3 text-right">Montant Encaissé</th>
                  <th className="p-3">N° Quittance</th>
                  <th className="p-3 text-right">Statut</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {payments.map((p) => {
                  const inv = invoices.find((i) => i.id === p.invoiceId);
                  return (
                    <tr key={p.id} className="hover:bg-slate-50 transition">
                      <td className="p-3 font-mono text-slate-800">{p.date}</td>
                      <td className="p-3 font-bold text-slate-900">
                        {inv ? `${inv.invoiceNumber} (${inv.clientName})` : p.invoiceId}
                      </td>
                      <td className="p-3 uppercase font-semibold text-slate-700">{p.paymentMethod}</td>
                      <td className="p-3 font-mono text-slate-600">{p.reference}</td>
                      <td className="p-3 text-right font-black text-emerald-700 text-sm">
                        {formatGNF(p.amountGNF)}
                      </td>
                      <td className="p-3 font-mono text-slate-500">{p.receiptRef}</td>
                      <td className="p-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-emerald-100 text-emerald-800">
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 3: Credit Notes (Avoirs FIN-11) */}
      {activeTab === 'credit_notes' && (
        <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
          <div className="p-4 bg-slate-50 border-b border-slate-200 text-xs font-bold text-slate-700 uppercase">
            Avoirs & Rectifications sans effacement de l'original (FIN-11)
          </div>

          <div className="divide-y divide-slate-100">
            {creditNotes.map((cn) => (
              <div key={cn.id} className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 text-xs">
                <div>
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-slate-900 text-sm">{cn.creditNoteNumber}</span>
                    <span className="text-slate-400">Rattaché à : <strong>{cn.originalInvoiceNumber}</strong></span>
                    <span className="text-slate-400 font-mono">Date : {cn.date}</span>
                  </div>
                  <p className="mt-1 font-semibold text-slate-700 italic">"{cn.reason}"</p>
                </div>
                <div className="text-right font-black text-amber-700 text-base">
                  -{formatGNF(cn.amountGNF)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Modal: Generate Invoice (FIN-01) */}
      {isGenerateModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex items-center justify-between pb-3 border-b border-slate-100">
              <h3 className="font-black text-slate-900 text-base flex items-center gap-2">
                <FileText className="w-5 h-5 text-emerald-600" />
                Générer Facture depuis Prestations (FIN-01)
              </h3>
              <button onClick={() => setIsGenerateModalOpen(false)} className="text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleGenerateInvoice} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Contrat Client Source</label>
                <select
                  value={genContractId}
                  onChange={(e) => setGenContractId(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 font-bold"
                >
                  {contracts.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} - {c.clientName} ({c.billingUnit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Début de Période</label>
                  <input
                    type="date"
                    value={periodStart}
                    onChange={(e) => setPeriodStart(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Fin de Période</label>
                  <input
                    type="date"
                    value={periodEnd}
                    onChange={(e) => setPeriodEnd(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Taux TVA Guinéenne (FIN-13)</label>
                <select
                  value={taxRate}
                  onChange={(e) => setTaxRate(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                >
                  <option value={0}>0% (Exonération secteur minier conventionné)</option>
                  <option value={18}>18% (Taux normal standard Guinée)</option>
                </select>
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Mentions & Notes de Facturation</label>
                <textarea
                  value={genNotes}
                  onChange={(e) => setGenNotes(e.target.value)}
                  className="w-full border border-slate-300 rounded-lg p-2 h-16"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsGenerateModalOpen(false)}
                  className="px-4 py-2 border border-slate-300 rounded-xl"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow"
                >
                  Calculer & Créer Brouillon
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Record Payment (FIN-09) */}
      {isPaymentModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base mb-1">
              Enregistrer un Règlement (FIN-09)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              Facture {isPaymentModalOpen.invNumber} • Reste dû :{' '}
              <strong className="text-amber-700">{formatGNF(isPaymentModalOpen.remainingGNF)}</strong>
            </p>

            <form onSubmit={handleRecordPaymentSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant du Paiement (GNF)</label>
                <input
                  type="number"
                  value={payAmount}
                  onChange={(e) => setPayAmount(Number(e.target.value))}
                  max={isPaymentModalOpen.remainingGNF}
                  className="w-full border border-slate-300 rounded-lg p-2 font-black text-emerald-700 text-sm"
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Mode de Paiement</label>
                  <select
                    value={payMethod}
                    onChange={(e) => setPayMethod(e.target.value as any)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-medium"
                  >
                    <option value="virement">Virement Bancaire</option>
                    <option value="cheque">Chèque Certifié</option>
                    <option value="especes">Espèces (Caisse)</option>
                    <option value="orange_money">Orange Money</option>
                    <option value="mtn_momo">MTN Mobile Money</option>
                  </select>
                </div>
                <div>
                  <label className="font-bold text-slate-700 block mb-1">Référence Pièce / Bordereau</label>
                  <input
                    type="text"
                    value={payReference}
                    onChange={(e) => setPayReference(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2 font-mono"
                    required
                  />
                </div>
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsPaymentModalOpen(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-lg shadow"
                >
                  Valider l'Encaissement
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Issue Credit Note (FIN-11) */}
      {isCreditNoteModalOpen && (
        <div className="fixed inset-0 z-50 bg-slate-900/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <h3 className="font-black text-slate-900 text-base mb-1">
              Émettre un Avoir Rectificatif (FIN-11)
            </h3>
            <p className="text-xs text-slate-500 mb-4">
              En conformité avec <strong>RG-08</strong>, la facture émise originale {isCreditNoteModalOpen.invNumber} n'est jamais supprimée ; la réduction de créance fait l'objet d'un avoir numéroté.
            </p>

            <form onSubmit={handleCreateCreditNoteSubmit} className="space-y-4 text-xs">
              <div>
                <label className="font-bold text-slate-700 block mb-1">Montant de l'Avoir (GNF)</label>
                <input
                  type="number"
                  value={creditAmount}
                  onChange={(e) => setCreditAmount(Number(e.target.value))}
                  className="w-full border border-slate-300 rounded-lg p-2 font-black text-amber-800"
                  required
                />
              </div>

              <div>
                <label className="font-bold text-slate-700 block mb-1">Motif Juridique & Commercial de l'Avoir</label>
                <textarea
                  value={creditReason}
                  onChange={(e) => setCreditReason(e.target.value)}
                  placeholder="Ex: Rectification de 25 tonnes suite à pesée conjointe portuaire..."
                  className="w-full border border-slate-300 rounded-lg p-2 h-20"
                  required
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreditNoteModalOpen(null)}
                  className="px-3 py-1.5 border border-slate-300 rounded-lg"
                >
                  Annuler
                </button>
                <button
                  type="submit"
                  className="px-4 py-1.5 bg-amber-600 hover:bg-amber-500 text-white font-bold rounded-lg shadow"
                >
                  Émettre l'Avoir Légal
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Official Printable Invoice (FIN-07) */}
      {selectedInvoiceForPrint && (
        <div className="fixed inset-0 z-50 bg-slate-900/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-8 shadow-2xl max-h-[90vh] overflow-y-auto">
            {/* Action Bar */}
            <div className="flex justify-between items-center pb-4 border-b border-slate-200 mb-6 print:hidden">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wider">
                Aperçu Document Officiel (FIN-07)
              </span>
              <div className="flex gap-2">
                <button
                  onClick={() => window.print()}
                  className="flex items-center gap-1.5 px-4 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-bold shadow"
                >
                  <Printer className="w-4 h-4" />
                  <span>Imprimer / PDF</span>
                </button>
                <button
                  onClick={() => setSelectedInvoiceForPrint(null)}
                  className="px-3 py-2 border border-slate-300 rounded-xl text-xs font-semibold"
                >
                  Fermer
                </button>
              </div>
            </div>

            {/* Invoice Printable Sheet */}
            <div className="border border-slate-200 p-8 rounded-xl bg-white text-slate-800 text-xs shadow-sm">
              {/* Header Header */}
              <div className="flex justify-between items-start pb-6 border-b-2 border-slate-900">
                <div>
                  <div className="flex items-center gap-2">
                    <div className="w-9 h-9 rounded bg-amber-500 flex items-center justify-center font-black text-slate-950 text-base">
                      EP
                    </div>
                    <div>
                      <h1 className="text-xl font-black text-slate-950 tracking-tight">EDEP GUINÉE</h1>
                      <div className="text-[10px] text-slate-500">Entreprise d'Ibrahima et Prestations</div>
                    </div>
                  </div>
                  <div className="text-[10px] text-slate-500 mt-2 space-y-0.5">
                    <div>Siège Social : Conakry / Boffa, République de Guinée</div>
                    <div>RCCM : GN.TCC.2024.B.04912 • NIF : 0092144810-M</div>
                    <div>Tél : +224 622 10 20 30 • contact@edep-guinee.com</div>
                  </div>
                </div>

                <div className="text-right">
                  <span className="text-xs font-black uppercase text-amber-600 bg-amber-50 px-2 py-0.5 rounded border border-amber-200">
                    Facture Définitive
                  </span>
                  <div className="text-xl font-mono font-black text-slate-900 mt-2">
                    {selectedInvoiceForPrint.invoiceNumber}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-1">
                    Date d'émission : <strong>{selectedInvoiceForPrint.issueDate}</strong>
                  </div>
                  <div className="text-[11px] text-slate-500">
                    Date d'échéance : <strong>{selectedInvoiceForPrint.dueDate}</strong>
                  </div>
                </div>
              </div>

              {/* Client & Contract block */}
              <div className="grid grid-cols-2 gap-6 my-6 p-4 bg-slate-50 rounded-xl border border-slate-100">
                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Facturé à :</div>
                  <div className="text-sm font-black text-slate-950 mt-1">{selectedInvoiceForPrint.clientName}</div>
                  <div className="text-[11px] text-slate-600 mt-0.5">{selectedInvoiceForPrint.clientAddress}</div>
                  <div className="text-[11px] text-slate-500 mt-0.5">NIF Client : {selectedInvoiceForPrint.clientNIF || 'Exonéré'}</div>
                </div>

                <div>
                  <div className="text-[10px] font-bold text-slate-400 uppercase">Prestation & Période :</div>
                  <div className="font-bold text-slate-800 mt-1">
                    Période du {selectedInvoiceForPrint.periodStart} au {selectedInvoiceForPrint.periodEnd}
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Devise légale : <strong>Franc Guinéen (GNF)</strong>
                  </div>
                  <div className="text-[11px] text-slate-500 mt-0.5">
                    Conditions : Règlement à 30 jours par virement bancaire
                  </div>
                </div>
              </div>

              {/* Items Table */}
              <table className="w-full text-left border-collapse my-6">
                <thead>
                  <tr className="border-b-2 border-slate-900 text-[11px] font-black uppercase text-slate-800">
                    <th className="py-2">Désignation de la prestation</th>
                    <th className="py-2 text-right">Quantité</th>
                    <th className="py-2 text-right">Unité</th>
                    <th className="py-2 text-right">Prix Unitaire</th>
                    <th className="py-2 text-right">Total HT (GNF)</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-200">
                  {selectedInvoiceForPrint.items.map((item) => (
                    <tr key={item.id}>
                      <td className="py-2.5 font-semibold text-slate-900">{item.description}</td>
                      <td className="py-2.5 text-right font-mono">{item.quantity.toLocaleString('fr-FR')}</td>
                      <td className="py-2.5 text-right capitalize">{item.unit}</td>
                      <td className="py-2.5 text-right font-mono">{formatGNF(item.unitPriceGNF)}</td>
                      <td className="py-2.5 text-right font-bold text-slate-950 font-mono">{formatGNF(item.totalGNF)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>

              {/* Totals Block */}
              <div className="flex justify-end my-6">
                <div className="w-64 space-y-2 text-xs">
                  <div className="flex justify-between text-slate-600">
                    <span>Sous-total HT :</span>
                    <span className="font-bold text-slate-900 font-mono">{formatGNF(selectedInvoiceForPrint.subtotalGNF)}</span>
                  </div>
                  <div className="flex justify-between text-slate-600">
                    <span>TVA ({selectedInvoiceForPrint.taxRatePercent}%) :</span>
                    <span className="font-bold text-slate-900 font-mono">{formatGNF(selectedInvoiceForPrint.taxAmountGNF)}</span>
                  </div>
                  <div className="flex justify-between text-sm font-black text-slate-950 pt-2 border-t-2 border-slate-900">
                    <span>TOTAL TTC :</span>
                    <span className="text-amber-800 font-mono">{formatGNF(selectedInvoiceForPrint.totalGNF)}</span>
                  </div>
                  <div className="flex justify-between text-slate-500 pt-1">
                    <span>Montant réglé :</span>
                    <span className="text-emerald-700 font-bold font-mono">{formatGNF(selectedInvoiceForPrint.paidAmountGNF)}</span>
                  </div>
                  <div className="flex justify-between text-xs font-extrabold text-amber-900 pt-1 border-t border-slate-200">
                    <span>SOLDE RESTANT DÛ :</span>
                    <span className="font-mono">{formatGNF(selectedInvoiceForPrint.remainingAmountGNF)}</span>
                  </div>
                </div>
              </div>

              {/* Footer Signatures */}
              <div className="pt-8 border-t border-slate-200 grid grid-cols-2 gap-8 text-[11px] text-slate-500">
                <div>
                  <div className="font-bold text-slate-800 uppercase">Pour le Client (Bon pour accord) :</div>
                  <div className="h-16 border-b border-dashed border-slate-300 mt-2"></div>
                  <div className="mt-1 text-[10px]">Date et Cachet commercial</div>
                </div>
                <div className="text-right">
                  <div className="font-bold text-slate-800 uppercase">Pour EDEP (Direction Générale) :</div>
                  <div className="h-16 border-b border-dashed border-slate-300 mt-2 flex items-center justify-end">
                    <span className="font-serif italic text-slate-400 text-xs pr-4">Cachet et Signature autorisée</span>
                  </div>
                  <div className="mt-1 text-[10px]">Facture établie selon les dispositions du Code Général des Impôts de Guinée</div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
