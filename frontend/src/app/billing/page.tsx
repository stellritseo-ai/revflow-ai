"use client";

import React, { useEffect, useState, useMemo } from "react";
import {
  CreditCard, DollarSign, FileText, Plus, Search, Calendar, CheckCircle2, AlertCircle,
  Clock, ArrowUpRight, Download, Printer, Filter, X, RefreshCw, ShieldCheck, User,
  Building2, Receipt, Send, Sparkles, PieChart, ChevronRight
} from "lucide-react";
import { fetchApi } from "@/lib/api-client";
import { Button } from "@/components/ui/button";

interface InvoiceItem {
  description: string;
  code?: string;
  amount: number;
}

interface Invoice {
  id: string;
  invoice_number: string;
  patient_name: string;
  patient_phone: string;
  patient_email?: string;
  doctor_name: string;
  issue_date: string;
  due_date: string;
  status: "paid" | "pending" | "overdue" | "insurance_pending";
  payment_method: "Credit Card" | "Insurance Claim" | "Cash / Debit" | "Apple Pay" | "Unpaid";
  items: InvoiceItem[];
  subtotal: number;
  insurance_coverage: number;
  total_amount: number;
}

const defaultInvoices: Invoice[] = [
  {
    id: "inv-1",
    invoice_number: "INV-2026-0891",
    patient_name: "Jack Miller",
    patient_phone: "(555) 234-8901",
    patient_email: "jack.miller@example.com",
    doctor_name: "Dr. Sarah Jenkins, DDS",
    issue_date: "2026-07-24",
    due_date: "2026-08-07",
    status: "paid",
    payment_method: "Credit Card",
    items: [
      { description: "Deep Composite Restoration (Molar Tooth #30)", code: "D2392", amount: 350.00 },
      { description: "Desensitizing Fluoride Varnish Application", code: "D1206", amount: 75.00 },
      { description: "Digital Bitewing Diagnostic X-Rays (4 films)", code: "D0274", amount: 120.00 }
    ],
    subtotal: 545.00,
    insurance_coverage: 245.00,
    total_amount: 300.00
  },
  {
    id: "inv-2",
    invoice_number: "INV-2026-0892",
    patient_name: "Emily Watson",
    patient_phone: "(555) 890-1234",
    patient_email: "emily.w@example.com",
    doctor_name: "Dr. Michael Chen, MS",
    issue_date: "2026-07-20",
    due_date: "2026-08-03",
    status: "paid",
    payment_method: "Apple Pay",
    items: [
      { description: "Invisalign Aligner Tray Set #14 Adjustment & IPR", code: "D8090", amount: 450.00 },
      { description: "Orthodontic Progress Evaluation & 3D Imaging", code: "D8670", amount: 150.00 }
    ],
    subtotal: 600.00,
    insurance_coverage: 200.00,
    total_amount: 400.00
  },
  {
    id: "inv-3",
    invoice_number: "INV-2026-0893",
    patient_name: "Sophia Martinez",
    patient_phone: "(555) 456-7890",
    patient_email: "sophia.m@example.com",
    doctor_name: "Dr. Elena Rostova, DND",
    issue_date: "2026-07-18",
    due_date: "2026-08-01",
    status: "insurance_pending",
    payment_method: "Insurance Claim",
    items: [
      { description: "Pediatric Pit & Fissure Sealants (4 Molars)", code: "D1351", amount: 240.00 },
      { description: "Prophylactic Cleaning & Topical Fluoride Foam", code: "D1120", amount: 110.00 }
    ],
    subtotal: 350.00,
    insurance_coverage: 280.00,
    total_amount: 70.00
  },
  {
    id: "inv-4",
    invoice_number: "INV-2026-0894",
    patient_name: "Robert Vance",
    patient_phone: "(555) 678-9012",
    patient_email: "robert.vance@example.com",
    doctor_name: "Dr. Alex Rivera, DMD",
    issue_date: "2026-07-15",
    due_date: "2026-07-25",
    status: "overdue",
    payment_method: "Unpaid",
    items: [
      { description: "Porcelain Fused to Zirconia Crown (#19)", code: "D2740", amount: 1100.00 },
      { description: "Core Buildup Including Any Pins", code: "D2950", amount: 250.00 }
    ],
    subtotal: 1350.00,
    insurance_coverage: 500.00,
    total_amount: 850.00
  },
  {
    id: "inv-5",
    invoice_number: "INV-2026-0895",
    patient_name: "Amanda Blake",
    patient_phone: "(555) 321-7654",
    patient_email: "amanda.b@example.com",
    doctor_name: "Dr. Sarah Jenkins, DDS",
    issue_date: "2026-07-12",
    due_date: "2026-07-26",
    status: "pending",
    payment_method: "Unpaid",
    items: [
      { description: "Periodontal Scaling & Root Planing - 4 Quadrants", code: "D4341", amount: 800.00 },
      { description: "Localized Antibiotic Delivery (Arestin)", code: "D4381", amount: 180.00 }
    ],
    subtotal: 980.00,
    insurance_coverage: 400.00,
    total_amount: 580.00
  }
];

export default function BillingPage() {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [filterStatus, setFilterStatus] = useState<"all" | "paid" | "pending" | "overdue" | "insurance_pending">("all");

  // Modals state
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [isCreateOpen, setIsCreateOpen] = useState(false);

  // New Invoice Form State
  const [formPatientName, setFormPatientName] = useState("");
  const [formPatientPhone, setFormPatientPhone] = useState("");
  const [formDoctor, setFormDoctor] = useState("Dr. Sarah Jenkins, DDS");
  const [formPaymentMethod, setFormPaymentMethod] = useState<Invoice["payment_method"]>("Credit Card");
  const [formItems, setFormItems] = useState<InvoiceItem[]>([
    { description: "General Dental Exam & Consultation", code: "D0150", amount: 150.00 }
  ]);
  const [formInsuranceCov, setFormInsuranceCov] = useState(50.00);
  const [isSavingInvoice, setIsSavingInvoice] = useState(false);

  // Load Invoices
  const loadInvoices = async () => {
    setLoading(true);
    let localInvoices: Invoice[] = [];
    try {
      const raw = localStorage.getItem("revflow_clinic_invoices");
      if (raw) localInvoices = JSON.parse(raw);
    } catch (e) {}

    try {
      const serverData = await fetchApi<any[]>("/revenue/invoices");
      if (serverData && Array.isArray(serverData) && serverData.length > 0) {
        const map = new Map<string, Invoice>();
        serverData.forEach((inv, idx) => {
          map.set(inv.id || `inv-srv-${idx}`, {
            id: inv.id || `inv-srv-${idx}`,
            invoice_number: inv.invoice_number || `INV-2026-${100 + idx}`,
            patient_name: inv.patient_name || "Patient",
            patient_phone: inv.patient_phone || "(555) 000-0000",
            doctor_name: inv.doctor_name || "Dr. Provider",
            issue_date: inv.issue_date || new Date().toISOString().split("T")[0],
            due_date: inv.due_date || new Date().toISOString().split("T")[0],
            status: inv.status || "paid",
            payment_method: inv.payment_method || "Credit Card",
            items: inv.items || [{ description: "Treatment Service", amount: inv.total_amount || 200 }],
            subtotal: inv.subtotal || 250,
            insurance_coverage: inv.insurance_coverage || 50,
            total_amount: inv.total_amount || 200
          });
        });
        localInvoices.forEach(inv => {
          if (!map.has(inv.id)) map.set(inv.id, inv);
        });
        const merged = Array.from(map.values());
        setInvoices(merged);
        try {
          localStorage.setItem("revflow_clinic_invoices", JSON.stringify(merged));
        } catch (e) {}
      } else if (localInvoices.length > 0) {
        setInvoices(localInvoices);
      } else {
        setInvoices(defaultInvoices);
      }
    } catch (err) {
      console.log("Using local invoices cache");
      setInvoices(localInvoices.length > 0 ? localInvoices : defaultInvoices);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadInvoices();
  }, []);

  // Filtered Invoices
  const filteredInvoices = useMemo(() => {
    return invoices.filter(inv => {
      const matchesSearch =
        inv.patient_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.invoice_number.toLowerCase().includes(searchTerm.toLowerCase()) ||
        inv.patient_phone.includes(searchTerm);

      if (!matchesSearch) return false;
      if (filterStatus === "all") return true;
      return inv.status === filterStatus;
    });
  }, [invoices, searchTerm, filterStatus]);

  // Financial Metrics
  const totalRevenue = useMemo(() => {
    return invoices
      .filter(i => i.status === "paid")
      .reduce((sum, i) => sum + i.total_amount, 0);
  }, [invoices]);

  const pendingAmount = useMemo(() => {
    return invoices
      .filter(i => i.status === "pending" || i.status === "overdue")
      .reduce((sum, i) => sum + i.total_amount, 0);
  }, [invoices]);

  const insurancePendingAmount = useMemo(() => {
    return invoices
      .filter(i => i.status === "insurance_pending")
      .reduce((sum, i) => sum + i.insurance_coverage, 0);
  }, [invoices]);

  const settledCount = invoices.filter(i => i.status === "paid").length;

  // Create Invoice Submission
  const handleCreateInvoice = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSavingInvoice) return;
    setIsSavingInvoice(true);

    const subtotal = formItems.reduce((sum, item) => sum + item.amount, 0);
    const netTotal = Math.max(0, subtotal - formInsuranceCov);

    const newInv: Invoice = {
      id: `inv-${Date.now()}`,
      invoice_number: `INV-2026-${Math.floor(1000 + Math.random() * 9000)}`,
      patient_name: formPatientName.trim() || "Jack Miller",
      patient_phone: formPatientPhone.trim() || "(555) 234-8901",
      doctor_name: formDoctor,
      issue_date: new Date().toISOString().split("T")[0],
      due_date: new Date(Date.now() + 14 * 86400000).toISOString().split("T")[0],
      status: formPaymentMethod === "Unpaid" ? "pending" : "paid",
      payment_method: formPaymentMethod,
      items: formItems,
      subtotal,
      insurance_coverage: formInsuranceCov,
      total_amount: netTotal
    };

    const updated = [newInv, ...invoices];
    setInvoices(updated);
    try {
      localStorage.setItem("revflow_clinic_invoices", JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetchApi("/revenue/invoices", {
        method: "POST",
        body: JSON.stringify(newInv)
      });
    } catch (err) {}

    setIsSavingInvoice(false);
    setIsCreateOpen(false);

    // Reset Form
    setFormPatientName("");
    setFormPatientPhone("");
    setFormItems([{ description: "General Dental Exam & Consultation", code: "D0150", amount: 150.00 }]);
    setFormInsuranceCov(50.00);
  };

  // Status Change Handler
  const handleUpdateStatus = async (invoiceId: string, newStatus: Invoice["status"]) => {
    const updated = invoices.map(i => {
      if (i.id === invoiceId) {
        return {
          ...i,
          status: newStatus,
          payment_method: newStatus === "paid" && i.payment_method === "Unpaid" ? ("Credit Card" as const) : i.payment_method
        };
      }
      return i;
    });

    setInvoices(updated);
    if (selectedInvoice && selectedInvoice.id === invoiceId) {
      setSelectedInvoice({
        ...selectedInvoice,
        status: newStatus,
        payment_method: newStatus === "paid" && selectedInvoice.payment_method === "Unpaid" ? "Credit Card" : selectedInvoice.payment_method
      });
    }

    try {
      localStorage.setItem("revflow_clinic_invoices", JSON.stringify(updated));
    } catch (e) {}

    try {
      await fetchApi(`/revenue/invoices/${invoiceId}`, {
        method: "PATCH",
        body: JSON.stringify({ status: newStatus })
      });
    } catch (err) {}
  };

  return (
    <div className="p-6 md:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in zoom-in-95 duration-300">
      
      {/* Header Banner */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-6 bg-gradient-to-r from-slate-900 via-indigo-950 to-slate-900 p-6 md:p-8 rounded-3xl text-white shadow-xl border border-indigo-800/40 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-96 h-96 bg-indigo-500/10 rounded-full blur-3xl -mr-20 -mt-20 pointer-events-none" />

        <div className="space-y-2 relative z-10">
          <div className="flex items-center gap-3">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/20 text-emerald-300 border border-emerald-500/30 backdrop-blur-md">
              <ShieldCheck className="h-3.5 w-3.5 text-emerald-400" />
              Real-Time Billing & Patient Financial Ledger
            </span>
          </div>

          <h1 className="text-3xl font-extrabold tracking-tight flex items-center gap-3 text-white">
            <CreditCard className="h-8 w-8 text-indigo-400" />
            Clinic Billing & Patient Invoicing
          </h1>
          <p className="text-slate-300 text-sm max-w-2xl leading-relaxed">
            Manage patient invoices, insurance claims, credit card transactions, and revenue settlements.
          </p>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-3 relative z-10">
          <Button
            onClick={() => setIsCreateOpen(true)}
            className="bg-indigo-600 hover:bg-indigo-500 text-white rounded-2xl px-5 py-2.5 shadow-lg shadow-indigo-600/30 flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Plus className="h-4 w-4" />
            Create Patient Invoice
          </Button>

          <Button
            onClick={() => window.print()}
            className="bg-white/10 hover:bg-white/20 text-white border border-white/20 rounded-2xl px-4 py-2.5 backdrop-blur-md flex items-center gap-2 font-medium transition-all active:scale-95 text-xs"
          >
            <Printer className="h-4 w-4" />
            Export Ledger
          </Button>
        </div>
      </div>

      {/* KPI Stats Overview */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        
        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Collected Revenue</span>
            <div className="p-2.5 rounded-xl bg-emerald-500/10 text-emerald-600 dark:text-emerald-400">
              <DollarSign className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">${totalRevenue.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1 text-xs text-emerald-600 dark:text-emerald-400 font-medium mt-1">
              <ArrowUpRight className="h-3.5 w-3.5" />
              <span>{settledCount} Settled Invoices</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Pending & Overdue</span>
            <div className="p-2.5 rounded-xl bg-amber-500/10 text-amber-600 dark:text-amber-400">
              <Clock className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">${pendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1 text-xs text-amber-600 dark:text-amber-400 font-medium mt-1">
              <span>Awaiting patient payment</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Insurance Claims</span>
            <div className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-600 dark:text-indigo-400">
              <ShieldCheck className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">${insurancePendingAmount.toLocaleString("en-US", { minimumFractionDigits: 2 })}</div>
            <div className="flex items-center gap-1 text-xs text-indigo-600 dark:text-indigo-400 font-medium mt-1">
              <span>Submitted to carriers</span>
            </div>
          </div>
        </div>

        <div className="p-5 rounded-2xl border bg-background shadow-sm hover:shadow-md transition-all flex flex-col justify-between">
          <div className="flex items-center justify-between">
            <span className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">Average Invoice</span>
            <div className="p-2.5 rounded-xl bg-purple-500/10 text-purple-600 dark:text-purple-400">
              <PieChart className="h-5 w-5" />
            </div>
          </div>
          <div className="mt-4">
            <div className="text-3xl font-extrabold tracking-tight">
              ${invoices.length > 0 ? (invoices.reduce((s, i) => s + i.total_amount, 0) / invoices.length).toFixed(2) : "345.00"}
            </div>
            <div className="flex items-center gap-1 text-xs text-muted-foreground mt-1">
              <span>Per treatment visit</span>
            </div>
          </div>
        </div>

      </div>

      {/* Main Invoices Table Card */}
      <div className="rounded-3xl border bg-background shadow-sm overflow-hidden flex flex-col">
        
        {/* Toolbar & Filter Tabs */}
        <div className="p-4 border-b flex flex-col md:flex-row items-center justify-between gap-4 bg-muted/20">
          
          {/* Search Box */}
          <div className="relative w-full md:w-80">
            <Search className="absolute left-3.5 top-2.5 h-4 w-4 text-muted-foreground" />
            <input
              type="text"
              placeholder="Search invoice #, patient, phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full bg-background border rounded-2xl pl-10 pr-4 py-2 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-indigo-500/20 font-medium"
            />
          </div>

          {/* Filter Categories */}
          <div className="flex items-center bg-muted/50 p-1 rounded-full border text-xs font-medium w-full md:w-auto justify-between overflow-x-auto">
            <button
              onClick={() => setFilterStatus("all")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterStatus === "all" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              All Invoices ({invoices.length})
            </button>

            <button
              onClick={() => setFilterStatus("paid")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterStatus === "paid" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Paid
            </button>

            <button
              onClick={() => setFilterStatus("pending")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterStatus === "pending" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Pending
            </button>

            <button
              onClick={() => setFilterStatus("overdue")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterStatus === "overdue" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Overdue
            </button>

            <button
              onClick={() => setFilterStatus("insurance_pending")}
              className={`px-3.5 py-1 rounded-full transition-all ${
                filterStatus === "insurance_pending" ? "bg-indigo-600 text-white shadow-xs" : "text-muted-foreground hover:text-foreground"
              }`}
            >
              Insurance
            </button>
          </div>

        </div>

        {/* Invoices Table */}
        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-xs text-left">
            <thead className="bg-muted/50 border-b text-muted-foreground uppercase tracking-wider text-[10px] font-bold sticky top-0 z-10 backdrop-blur-md">
              <tr>
                <th className="px-6 py-3.5">Invoice # & Date</th>
                <th className="px-6 py-3.5">Patient Details</th>
                <th className="px-6 py-3.5">Attending Doctor</th>
                <th className="px-6 py-3.5">Payment Method</th>
                <th className="px-6 py-3.5">Status</th>
                <th className="px-6 py-3.5 text-right">Net Amount</th>
                <th className="px-6 py-3.5 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {loading ? (
                <tr>
                  <td colSpan={7} className="h-48 text-center">
                    <RefreshCw className="h-6 w-6 animate-spin mx-auto text-indigo-500" />
                  </td>
                </tr>
              ) : filteredInvoices.length === 0 ? (
                <tr>
                  <td colSpan={7} className="h-48 text-center text-muted-foreground">
                    <Receipt className="h-8 w-8 mx-auto mb-3 opacity-20" />
                    No invoices found matching your criteria.
                  </td>
                </tr>
              ) : (
                filteredInvoices.map((inv) => (
                  <tr
                    key={inv.id}
                    onClick={() => setSelectedInvoice(inv)}
                    className="hover:bg-muted/30 transition-colors group cursor-pointer"
                  >
                    
                    {/* Invoice ID & Date */}
                    <td className="px-6 py-4">
                      <div>
                        <span className="font-mono font-extrabold text-foreground text-xs">{inv.invoice_number}</span>
                        <div className="text-[11px] text-muted-foreground mt-0.5">
                          Issued: {new Date(inv.issue_date).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
                        </div>
                      </div>
                    </td>

                    {/* Patient Details */}
                    <td className="px-6 py-4">
                      <div>
                        <p className="font-bold text-foreground text-xs">{inv.patient_name}</p>
                        <p className="text-[11px] text-muted-foreground font-mono">{inv.patient_phone}</p>
                      </div>
                    </td>

                    {/* Attending Doctor */}
                    <td className="px-6 py-4 font-medium text-foreground">
                      {inv.doctor_name}
                    </td>

                    {/* Payment Method */}
                    <td className="px-6 py-4">
                      <span className="px-2.5 py-1 rounded-xl bg-muted/60 text-muted-foreground font-medium text-[11px] border border-border">
                        {inv.payment_method}
                      </span>
                    </td>

                    {/* Status Badge */}
                    <td className="px-6 py-4">
                      {inv.status === "paid" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-emerald-500/15 text-emerald-700 dark:text-emerald-300 border border-emerald-500/30">
                          <CheckCircle2 className="h-3 w-3 text-emerald-500" /> Settled
                        </span>
                      )}
                      {inv.status === "pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/15 text-amber-700 dark:text-amber-300 border border-amber-500/30">
                          <Clock className="h-3 w-3 text-amber-500" /> Pending
                        </span>
                      )}
                      {inv.status === "overdue" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-rose-500/15 text-rose-700 dark:text-rose-300 border border-rose-500/30">
                          <AlertCircle className="h-3 w-3 text-rose-500" /> Overdue
                        </span>
                      )}
                      {inv.status === "insurance_pending" && (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-[10px] font-extrabold bg-indigo-500/15 text-indigo-700 dark:text-indigo-300 border border-indigo-500/30">
                          <ShieldCheck className="h-3 w-3 text-indigo-500" /> Claim Sent
                        </span>
                      )}
                    </td>

                    {/* Net Amount */}
                    <td className="px-6 py-4 text-right">
                      <span className="font-extrabold text-foreground text-sm font-mono">
                        ${inv.total_amount.toFixed(2)}
                      </span>
                      {inv.insurance_coverage > 0 && (
                        <div className="text-[10px] text-muted-foreground font-mono">
                          Ins: -${inv.insurance_coverage.toFixed(2)}
                        </div>
                      )}
                    </td>

                    {/* Actions */}
                    <td className="px-6 py-4 text-right">
                      <Button
                        onClick={(e: React.MouseEvent) => {
                          e.stopPropagation();
                          setSelectedInvoice(inv);
                        }}
                        variant="ghost" size="sm" className="rounded-full text-indigo-600 dark:text-indigo-400 hover:bg-indigo-500/10 font-bold text-xs"
                      >
                        Receipt <ChevronRight className="h-4 w-4 ml-0.5" />
                      </Button>
                    </td>

                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* MODAL: Printable Invoice Receipt Details */}
      {selectedInvoice && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-background border rounded-3xl p-6 md:p-8 max-w-xl w-full space-y-6 shadow-2xl animate-in zoom-in-95 duration-200">
            
            {/* Header / Letterhead */}
            <div className="flex items-start justify-between border-b pb-4">
              <div>
                <div className="flex items-center gap-2">
                  <div className="h-8 w-8 rounded-lg bg-indigo-600 text-white font-bold flex items-center justify-center text-xs">
                    RV
                  </div>
                  <div>
                    <h3 className="font-bold text-base text-foreground">RevFlow Dental Clinic</h3>
                    <p className="text-[11px] text-muted-foreground">100 Healthcare Boulevard, Suite 400</p>
                  </div>
                </div>
              </div>

              <div className="text-right">
                <span className="font-mono font-extrabold text-base text-indigo-600 dark:text-indigo-400">
                  {selectedInvoice.invoice_number}
                </span>
                <p className="text-[11px] text-muted-foreground">
                  Date: {selectedInvoice.issue_date}
                </p>
              </div>
            </div>

            {/* Patient & Doctor Meta */}
            <div className="grid grid-cols-2 gap-4 text-xs bg-muted/20 p-4 rounded-2xl border">
              <div>
                <span className="text-muted-foreground font-semibold uppercase text-[10px]">Billed To:</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{selectedInvoice.patient_name}</p>
                <p className="font-mono text-muted-foreground">{selectedInvoice.patient_phone}</p>
              </div>

              <div>
                <span className="text-muted-foreground font-semibold uppercase text-[10px]">Provider:</span>
                <p className="font-bold text-foreground text-sm mt-0.5">{selectedInvoice.doctor_name}</p>
                <p className="text-muted-foreground">Payment: {selectedInvoice.payment_method}</p>
              </div>
            </div>

            {/* Itemized Services Breakdown */}
            <div className="space-y-2 text-xs">
              <span className="font-bold text-muted-foreground uppercase text-[10px] tracking-wider">Itemized Dental Procedures</span>
              
              <div className="border rounded-2xl overflow-hidden divide-y">
                <div className="bg-muted/40 px-4 py-2 font-bold text-muted-foreground grid grid-cols-12 text-[10px] uppercase">
                  <div className="col-span-8">Description & CDT Code</div>
                  <div className="col-span-4 text-right">Amount</div>
                </div>

                {selectedInvoice.items.map((item, idx) => (
                  <div key={idx} className="px-4 py-2.5 grid grid-cols-12 items-center">
                    <div className="col-span-8">
                      <p className="font-bold text-foreground">{item.description}</p>
                      {item.code && <span className="font-mono text-[10px] text-muted-foreground">Code: {item.code}</span>}
                    </div>
                    <div className="col-span-4 text-right font-mono font-bold">
                      ${item.amount.toFixed(2)}
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Totals Summary */}
            <div className="space-y-1.5 text-xs pt-2 border-t font-mono">
              <div className="flex justify-between text-muted-foreground">
                <span>Subtotal Fee:</span>
                <span>${selectedInvoice.subtotal.toFixed(2)}</span>
              </div>

              {selectedInvoice.insurance_coverage > 0 && (
                <div className="flex justify-between text-emerald-600 dark:text-emerald-400 font-semibold">
                  <span>Insurance Primary Claim Benefit:</span>
                  <span>-${selectedInvoice.insurance_coverage.toFixed(2)}</span>
                </div>
              )}

              <div className="flex justify-between font-extrabold text-sm text-foreground pt-2 border-t">
                <span>Patient Balance Due:</span>
                <span className="text-indigo-600 dark:text-indigo-400">${selectedInvoice.total_amount.toFixed(2)}</span>
              </div>
            </div>

            {/* Status Change Actions */}
            <div className="space-y-2 pt-2 border-t">
              <span className="text-[11px] font-bold text-muted-foreground uppercase">Update Settlement Status:</span>
              <div className="grid grid-cols-3 gap-2">
                <Button
                  onClick={() => handleUpdateStatus(selectedInvoice.id, "paid")}
                  size="sm"
                  variant={selectedInvoice.status === "paid" ? "default" : "outline"}
                  className="rounded-xl text-xs"
                >
                  Mark Paid
                </Button>

                <Button
                  onClick={() => handleUpdateStatus(selectedInvoice.id, "insurance_pending")}
                  size="sm"
                  variant={selectedInvoice.status === "insurance_pending" ? "default" : "outline"}
                  className="rounded-xl text-xs"
                >
                  Claim Sent
                </Button>

                <Button
                  onClick={() => handleUpdateStatus(selectedInvoice.id, "overdue")}
                  size="sm"
                  variant={selectedInvoice.status === "overdue" ? "destructive" : "outline"}
                  className="rounded-xl text-xs"
                >
                  Overdue
                </Button>
              </div>
            </div>

            {/* Modal Actions */}
            <div className="pt-2 flex items-center justify-between border-t">
              <Button
                onClick={() => window.print()}
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
              >
                <Printer className="h-3.5 w-3.5 mr-1" /> Print Receipt
              </Button>

              <Button
                onClick={() => setSelectedInvoice(null)}
                variant="outline"
                size="sm"
                className="rounded-full text-xs"
              >
                Close
              </Button>
            </div>

          </div>
        </div>
      )}

      {/* MODAL: Create New Patient Invoice */}
      {isCreateOpen && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <form
            onSubmit={handleCreateInvoice}
            className="bg-background border rounded-3xl p-6 max-w-lg w-full space-y-5 shadow-2xl animate-in zoom-in-95 duration-200"
          >
            <div className="flex items-center justify-between border-b pb-3">
              <h3 className="font-bold text-base flex items-center gap-2">
                <CreditCard className="h-5 w-5 text-indigo-500" />
                Generate Patient Invoice
              </h3>
              <button
                type="button"
                onClick={() => setIsCreateOpen(false)}
                className="p-1 rounded-full hover:bg-muted text-muted-foreground"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <div className="space-y-3.5 text-xs">
              
              {/* Patient Name & Phone */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Patient Name</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Jack Miller"
                    value={formPatientName}
                    onChange={(e) => setFormPatientName(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Phone Number</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. (555) 234-8901"
                    value={formPatientPhone}
                    onChange={(e) => setFormPatientPhone(e.target.value)}
                    className="w-full px-3.5 py-2.5 font-mono rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20"
                  />
                </div>
              </div>

              {/* Doctor & Payment Method */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Attending Doctor</label>
                  <select
                    value={formDoctor}
                    onChange={(e) => setFormDoctor(e.target.value)}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  >
                    <option value="Dr. Sarah Jenkins, DDS">Dr. Sarah Jenkins, DDS</option>
                    <option value="Dr. Alex Rivera, DMD">Dr. Alex Rivera, DMD</option>
                    <option value="Dr. Michael Chen, MS">Dr. Michael Chen, MS</option>
                    <option value="Dr. Elena Rostova, DND">Dr. Elena Rostova, DND</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="font-semibold text-muted-foreground">Payment Method</label>
                  <select
                    value={formPaymentMethod}
                    onChange={(e) => setFormPaymentMethod(e.target.value as any)}
                    className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-medium"
                  >
                    <option value="Credit Card">Credit Card</option>
                    <option value="Apple Pay">Apple Pay</option>
                    <option value="Cash / Debit">Cash / Debit</option>
                    <option value="Insurance Claim">Insurance Claim</option>
                    <option value="Unpaid">Unpaid (Bill Patient)</option>
                  </select>
                </div>
              </div>

              {/* Procedure Itemized Rows */}
              <div className="space-y-2 border-t pt-3">
                <div className="flex items-center justify-between">
                  <label className="font-bold text-foreground">Treatment Procedure Line Items</label>
                  <Button
                    type="button"
                    onClick={() => setFormItems([...formItems, { description: "", code: "D0000", amount: 100 }])}
                    variant="outline"
                    size="sm"
                    className="rounded-full text-[11px] h-7 px-3 text-indigo-600"
                  >
                    + Add Item
                  </Button>
                </div>

                {formItems.map((item, idx) => (
                  <div key={idx} className="grid grid-cols-12 gap-2 bg-muted/20 p-2.5 rounded-2xl border">
                    <input
                      type="text"
                      placeholder="Procedure Description"
                      value={item.description}
                      onChange={(e) => {
                        const copy = [...formItems];
                        copy[idx].description = e.target.value;
                        setFormItems(copy);
                      }}
                      className="col-span-7 px-2.5 py-1.5 text-xs rounded-xl border bg-background"
                    />
                    <input
                      type="number"
                      placeholder="Amount ($)"
                      value={item.amount}
                      onChange={(e) => {
                        const copy = [...formItems];
                        copy[idx].amount = parseFloat(e.target.value) || 0;
                        setFormItems(copy);
                      }}
                      className="col-span-5 px-2.5 py-1.5 text-xs rounded-xl border bg-background font-mono"
                    />
                  </div>
                ))}
              </div>

              {/* Insurance Benefit Credit */}
              <div className="space-y-1.5 border-t pt-3">
                <label className="font-semibold text-muted-foreground">Insurance Coverage Benefit ($)</label>
                <input
                  type="number"
                  value={formInsuranceCov}
                  onChange={(e) => setFormInsuranceCov(parseFloat(e.target.value) || 0)}
                  className="w-full px-3.5 py-2.5 rounded-xl border bg-background focus:outline-none focus:ring-2 focus:ring-indigo-500/20 font-mono"
                />
              </div>

            </div>

            <div className="pt-2 flex items-center justify-end gap-3 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => setIsCreateOpen(false)}
                className="rounded-full text-xs"
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSavingInvoice}
                className="bg-indigo-600 hover:bg-indigo-700 text-white rounded-full text-xs px-5 flex items-center gap-2"
              >
                {isSavingInvoice ? (
                  <>
                    <RefreshCw className="h-3.5 w-3.5 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Receipt className="h-3.5 w-3.5" />
                    Generate Invoice
                  </>
                )}
              </Button>
            </div>
          </form>
        </div>
      )}

    </div>
  );
}
