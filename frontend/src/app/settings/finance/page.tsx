"use client";

import React, { useEffect, useState } from "react";
import { Loader2, Plus, MoreHorizontal, CreditCard, ShieldCheck } from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface InsuranceProvider {
  id: string;
  provider_name: string;
  provider_code: string | null;
  is_accepted: boolean;
  ai_verification_ready: boolean;
}

interface PaymentMethod {
  id: string;
  method_type: string;
  is_active: boolean;
}

export default function FinancePage() {
  const [insurance, setInsurance] = useState<InsuranceProvider[]>([]);
  const [payments, setPayments] = useState<PaymentMethod[]>([]);
  const [loading, setLoading] = useState(true);

  // Modals
  const [isInsModalOpen, setIsInsModalOpen] = useState(false);
  const [isPayModalOpen, setIsPayModalOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const [insData, setInsData] = useState({ provider_name: "", provider_code: "", is_accepted: true });
  const [payData, setPayData] = useState({ method_type: "credit_card", is_active: true });

  const loadData = async () => {
    setLoading(true);
    try {
      const [insRes, payRes] = await Promise.all([
        fetchApi<InsuranceProvider[]>("/clinic/insurance"),
        fetchApi<PaymentMethod[]>("/clinic/payments")
      ]);
      setInsurance(insRes);
      setPayments(payRes);
    } catch (err) {
      console.error("Failed to load finance data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleAddInsurance = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newIns = await fetchApi<InsuranceProvider>("/clinic/insurance", {
        method: "POST",
        body: JSON.stringify(insData),
      });
      setInsurance([...insurance, newIns]);
      setIsInsModalOpen(false);
      setInsData({ provider_name: "", provider_code: "", is_accepted: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  const handleAddPayment = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    try {
      const newPay = await fetchApi<PaymentMethod>("/clinic/payments", {
        method: "POST",
        body: JSON.stringify(payData),
      });
      setPayments([...payments, newPay]);
      setIsPayModalOpen(false);
      setPayData({ method_type: "credit_card", is_active: true });
    } catch (err) {
      console.error(err);
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="p-6 md:p-8 max-w-5xl space-y-10">
      
      {/* Insurance Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Insurance Providers</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Manage accepted insurance networks and AI eligibility verification settings.
            </p>
          </div>
          <Button onClick={() => setIsInsModalOpen(true)} className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Provider
          </Button>
        </div>

        <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Network Name</th>
                  <th className="px-4 py-3 font-medium">Payer ID</th>
                  <th className="px-4 py-3 font-medium">AI Verification</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : insurance.length === 0 ? (
                  <tr>
                    <td colSpan={4} className="h-24 text-center text-muted-foreground">
                      No insurance providers added.
                    </td>
                  </tr>
                ) : (
                  insurance.map((ins) => (
                    <tr key={ins.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3 font-medium">{ins.provider_name}</td>
                      <td className="px-4 py-3 text-muted-foreground">{ins.provider_code || "—"}</td>
                      <td className="px-4 py-3">
                        {ins.ai_verification_ready ? (
                          <span className="inline-flex items-center gap-1 text-xs text-indigo-500 font-medium">
                            <ShieldCheck className="h-3.5 w-3.5" /> Supported
                          </span>
                        ) : (
                          <span className="text-xs text-muted-foreground">Manual</span>
                        )}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${ins.is_accepted ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                          <span className="text-xs font-medium text-muted-foreground">{ins.is_accepted ? 'Accepted' : 'Not Accepted'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Payment Methods Section */}
      <section>
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold tracking-tight">Payment Methods</h1>
            <p className="text-muted-foreground text-sm mt-1">
              Configure accepted payment forms for online booking and invoicing.
            </p>
          </div>
          <Button onClick={() => setIsPayModalOpen(true)} variant="secondary" className="flex items-center gap-2">
            <Plus className="h-4 w-4" /> Add Method
          </Button>
        </div>

        <div className="rounded-xl border bg-background shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="bg-muted/50 border-b text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Payment Type</th>
                  <th className="px-4 py-3 font-medium text-right">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {loading ? (
                  <tr>
                    <td colSpan={2} className="h-24 text-center">
                      <Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" />
                    </td>
                  </tr>
                ) : payments.length === 0 ? (
                  <tr>
                    <td colSpan={2} className="h-24 text-center text-muted-foreground">
                      No payment methods configured.
                    </td>
                  </tr>
                ) : (
                  payments.map((pay) => (
                    <tr key={pay.id} className="hover:bg-muted/30 transition-colors group">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <CreditCard className="h-4 w-4 text-muted-foreground" />
                          <span className="font-medium capitalize">{pay.method_type.replace("_", " ")}</span>
                        </div>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <span className="inline-flex items-center gap-1.5">
                          <span className={`h-1.5 w-1.5 rounded-full ${pay.is_active ? 'bg-emerald-500' : 'bg-slate-500'}`}></span>
                          <span className="text-xs font-medium text-muted-foreground">{pay.is_active ? 'Active' : 'Disabled'}</span>
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* Modals */}
      {isInsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold">Add Insurance Network</h2>
            <form onSubmit={handleAddInsurance} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Network Name</label>
                <input required autoFocus value={insData.provider_name} onChange={(e) => setInsData({ ...insData, provider_name: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Payer ID (Optional)</label>
                <input value={insData.provider_code} onChange={(e) => setInsData({ ...insData, provider_code: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring" />
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsInsModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

      {isPayModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-background/80 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border bg-background p-6 shadow-xl animate-in fade-in zoom-in-95 duration-200">
            <h2 className="text-lg font-bold">Add Payment Method</h2>
            <form onSubmit={handleAddPayment} className="space-y-4 mt-4">
              <div className="space-y-1.5">
                <label className="text-xs font-medium">Type</label>
                <select value={payData.method_type} onChange={(e) => setPayData({ ...payData, method_type: e.target.value })} className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm focus-visible:ring-2 focus-visible:ring-ring">
                  <option value="credit_card">Credit Card (Stripe)</option>
                  <option value="bank_transfer">Bank Transfer (ACH)</option>
                  <option value="care_credit">CareCredit</option>
                  <option value="cash">Cash / In-Office</option>
                </select>
              </div>
              <div className="pt-4 flex items-center justify-end gap-3">
                <Button type="button" variant="ghost" onClick={() => setIsPayModalOpen(false)}>Cancel</Button>
                <Button type="submit" disabled={isSaving}>{isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : "Save"}</Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}
