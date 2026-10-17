"use client";

import React, { useState, useEffect } from "react";
import { 
  Boxes, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, 
  Search, Download, Trash2, Edit3, MessageCircle, RefreshCw, 
  Layers, CheckCircle2, DollarSign, PackageOpen, Sparkles, Filter,
  FileText, Users, Calculator, CreditCard, ChevronRight, Check
} from "lucide-react";
import toast from "react-hot-toast";

export interface InventoryItem {
  id: string;
  name: string;
  category: "Dairy" | "Grocery" | "Poultry & Meat" | "Vegetables" | "Beverages" | "Packaging" | "Spices" | "Bakery";
  currentStock: number;
  unit: "kg" | "L" | "Pcs" | "Packets" | "Grams";
  minAlertStock: number;
  costPerUnit: number;
  vendorName: string;
  vendorPhone: string;
  lastUpdated: string;
}

export interface VendorPurchase {
  id: string;
  invoiceNo: string;
  vendorName: string;
  vendorPhone: string;
  date: string;
  itemsSummary: string;
  totalAmount: number;
  paymentStatus: "PAID" | "PENDING_CREDIT";
  paymentMethod?: "CASH" | "UPI" | "BANK_TRANSFER";
  notes?: string;
}

export interface VendorAccount {
  id: string;
  name: string;
  category: string;
  phone: string;
  totalPurchased: number;
  totalPaid: number;
  pendingDue: number;
  lastPaymentDate: string;
}

export interface DailyReconciliation {
  id: string;
  itemName: string;
  unit: string;
  openingStock: number;
  inwardToday: number;
  consumedSales: number;
  wastage: number;
  expectedClosing: number;
  physicalClosing: number;
  variance: number;
  status: "MATCHED" | "LEAKAGE_THEFT" | "SURPLUS" | "HIGH_VARIANCE_THEFT_ALERT";
  costLoss?: number;
}

export interface StockLog {
  id: string;
  itemName: string;
  type: "INWARD" | "WASTAGE" | "CONSUMPTION";
  quantity: number;
  unit: string;
  notes: string;
  cost: number;
  timestamp: string;
}

export interface RecipeBOM {
  menuItem: string;
  category: string;
  ingredients: { name: string; qty: number; unit: string }[];
}

// Initial realistic default inventory for Hotel White Bliss
const INITIAL_INVENTORY: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Amul Malai Paneer",
    category: "Dairy",
    currentStock: 3.2,
    unit: "kg",
    minAlertStock: 5.0,
    costPerUnit: 340,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Today, 10:30 AM"
  },
  {
    id: "inv-2",
    name: "Mozzarella Pizza Cheese",
    category: "Dairy",
    currentStock: 1.5,
    unit: "kg",
    minAlertStock: 3.0,
    costPerUnit: 480,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Yesterday, 06:15 PM"
  },
  {
    id: "inv-3",
    name: "Fresh Chicken Breast",
    category: "Poultry & Meat",
    currentStock: 14.0,
    unit: "kg",
    minAlertStock: 6.0,
    costPerUnit: 220,
    vendorName: "Al-Madina Poultry",
    vendorPhone: "9890123456",
    lastUpdated: "Today, 08:00 AM"
  },
  {
    id: "inv-4",
    name: "India Gate Basmati Rice",
    category: "Grocery",
    currentStock: 42.0,
    unit: "kg",
    minAlertStock: 15.0,
    costPerUnit: 110,
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    lastUpdated: "3 days ago"
  },
  {
    id: "inv-5",
    name: "Refined Sunflower Cooking Oil",
    category: "Grocery",
    currentStock: 25.0,
    unit: "L",
    minAlertStock: 10.0,
    costPerUnit: 135,
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    lastUpdated: "2 days ago"
  },
  {
    id: "inv-6",
    name: "Fresh Full Cream Milk",
    category: "Dairy",
    currentStock: 8.0,
    unit: "L",
    minAlertStock: 12.0,
    costPerUnit: 64,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Today, 07:15 AM"
  },
  {
    id: "inv-7",
    name: "Burger & Pav Buns",
    category: "Packaging",
    currentStock: 18,
    unit: "Pcs",
    minAlertStock: 30,
    costPerUnit: 8,
    vendorName: "Golden Bakery",
    vendorPhone: "9765432100",
    lastUpdated: "Today, 09:00 AM"
  },
  {
    id: "inv-8",
    name: "Lavazza Coffee Beans",
    category: "Beverages",
    currentStock: 5.5,
    unit: "kg",
    minAlertStock: 2.0,
    costPerUnit: 750,
    vendorName: "Roast Master Supplies",
    vendorPhone: "9881122334",
    lastUpdated: "5 days ago"
  },
  {
    id: "inv-9",
    name: "3-Compartment Meal Delivery Boxes",
    category: "Packaging",
    currentStock: 180,
    unit: "Pcs",
    minAlertStock: 50,
    costPerUnit: 9.5,
    vendorName: "EcoPack Solutions",
    vendorPhone: "9922001122",
    lastUpdated: "1 week ago"
  },
  {
    id: "inv-10",
    name: "Farm Fresh Tomatoes",
    category: "Vegetables",
    currentStock: 18.0,
    unit: "kg",
    minAlertStock: 8.0,
    costPerUnit: 35,
    vendorName: "Nashik Mandi Direct",
    vendorPhone: "9422778899",
    lastUpdated: "Today, 06:45 AM"
  }
];

// Initial Inward Vendor Purchase Invoices
const INITIAL_PURCHASES: VendorPurchase[] = [
  {
    id: "pur-1",
    invoiceNo: "INV-KD-104",
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    date: "Today, 08:30 AM",
    itemsSummary: "Full Cream Milk (15L), Paneer (5kg)",
    totalAmount: 2660,
    paymentStatus: "PAID",
    paymentMethod: "UPI",
    notes: "Batch morning quality verified"
  },
  {
    id: "pur-2",
    invoiceNo: "INV-ALM-89",
    vendorName: "Al-Madina Poultry",
    vendorPhone: "9890123456",
    date: "Today, 07:45 AM",
    itemsSummary: "Fresh Chicken Breast (15kg)",
    totalAmount: 3300,
    paymentStatus: "PENDING_CREDIT",
    notes: "Credit bill - to be cleared on Friday"
  },
  {
    id: "pur-3",
    invoiceNo: "INV-MT-552",
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    date: "Yesterday, 04:15 PM",
    itemsSummary: "Basmati Rice (50kg), Sunflower Oil (30L)",
    totalAmount: 9550,
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    notes: "Monthly bulk grocery replenishment"
  },
  {
    id: "pur-4",
    invoiceNo: "INV-GB-21",
    vendorName: "Golden Bakery",
    vendorPhone: "9765432100",
    date: "Yesterday, 09:00 AM",
    itemsSummary: "Burger & Pav Buns (40 Pcs)",
    totalAmount: 320,
    paymentStatus: "PAID",
    paymentMethod: "UPI"
  },
  {
    id: "pur-5",
    invoiceNo: "INV-NM-12",
    vendorName: "Nashik Mandi Direct",
    vendorPhone: "9422778899",
    date: "2 days ago",
    itemsSummary: "Tomatoes (25kg), Onions (30kg), Coriander (5kg)",
    totalAmount: 1850,
    paymentStatus: "PAID",
    paymentMethod: "CASH"
  }
];

// Initial Vendor Ledgers & Payables
const INITIAL_VENDORS: VendorAccount[] = [
  {
    id: "v-1",
    name: "Kalyan Dairy",
    category: "Milk, Paneer, Cheese, Butter",
    phone: "9822334455",
    totalPurchased: 34500,
    totalPaid: 28000,
    pendingDue: 6500,
    lastPaymentDate: "Yesterday"
  },
  {
    id: "v-2",
    name: "Al-Madina Poultry",
    category: "Fresh Chicken & Eggs",
    phone: "9890123456",
    totalPurchased: 22400,
    totalPaid: 19100,
    pendingDue: 3300,
    lastPaymentDate: "3 days ago"
  },
  {
    id: "v-3",
    name: "Mahalaxmi Traders",
    category: "Rice, Cooking Oil, Atta, Spices",
    phone: "9823456789",
    totalPurchased: 48000,
    totalPaid: 48000,
    pendingDue: 0,
    lastPaymentDate: "Yesterday"
  },
  {
    id: "v-4",
    name: "Nashik Mandi Direct",
    category: "Daily Farm Vegetables",
    phone: "9422778899",
    totalPurchased: 14200,
    totalPaid: 12000,
    pendingDue: 2200,
    lastPaymentDate: "2 days ago"
  },
  {
    id: "v-5",
    name: "Golden Bakery",
    category: "Buns, Bread & Croissants",
    phone: "9765432100",
    totalPurchased: 3800,
    totalPaid: 3800,
    pendingDue: 0,
    lastPaymentDate: "Yesterday"
  }
];

// Initial Daily Closing Reconciliation Sheet
const INITIAL_RECONCILIATION: DailyReconciliation[] = [
  {
    id: "rec-1",
    itemName: "Amul Malai Paneer",
    unit: "kg",
    openingStock: 5.0,
    inwardToday: 5.0,
    consumedSales: 6.0,
    wastage: 0.8,
    expectedClosing: 3.2,
    physicalClosing: 3.0,
    variance: -0.2, // Minor leakage/portioning
    status: "LEAKAGE_THEFT"
  },
  {
    id: "rec-2",
    itemName: "Mozzarella Pizza Cheese",
    unit: "kg",
    openingStock: 3.0,
    inwardToday: 0.0,
    consumedSales: 1.5,
    wastage: 0.0,
    expectedClosing: 1.5,
    physicalClosing: 1.5,
    variance: 0.0,
    status: "MATCHED"
  },
  {
    id: "rec-3",
    itemName: "Fresh Chicken Breast",
    unit: "kg",
    openingStock: 8.0,
    inwardToday: 15.0,
    consumedSales: 9.0,
    wastage: 0.0,
    expectedClosing: 14.0,
    physicalClosing: 14.0,
    variance: 0.0,
    status: "MATCHED"
  },
  {
    id: "rec-4",
    itemName: "India Gate Basmati Rice",
    unit: "kg",
    openingStock: 50.0,
    inwardToday: 0.0,
    consumedSales: 8.0,
    wastage: 0.0,
    expectedClosing: 42.0,
    physicalClosing: 42.0,
    variance: 0.0,
    status: "MATCHED"
  },
  {
    id: "rec-5",
    itemName: "Burger & Pav Buns",
    unit: "Pcs",
    openingStock: 38.0,
    inwardToday: 0.0,
    consumedSales: 20.0,
    wastage: 0.0,
    expectedClosing: 18.0,
    physicalClosing: 18.0,
    variance: 0.0,
    status: "MATCHED"
  }
];

const INITIAL_LOGS: StockLog[] = [
  {
    id: "log-1",
    itemName: "Fresh Chicken Breast",
    type: "INWARD",
    quantity: 15,
    unit: "kg",
    notes: "Morning delivery batch #401",
    cost: 3300,
    timestamp: "Today, 08:00 AM"
  },
  {
    id: "log-2",
    itemName: "Amul Malai Paneer",
    type: "WASTAGE",
    quantity: 0.8,
    unit: "kg",
    notes: "Tandoor prep excess spoilage",
    cost: 272,
    timestamp: "Yesterday, 11:30 PM"
  },
  {
    id: "log-3",
    itemName: "Refined Sunflower Cooking Oil",
    type: "INWARD",
    quantity: 30,
    unit: "L",
    notes: "Monthly tin replenishment",
    cost: 4050,
    timestamp: "2 days ago"
  }
];

const SAMPLE_RECIPES: RecipeBOM[] = [
  {
    menuItem: "Paneer Butter Masala",
    category: "Main Course",
    ingredients: [
      { name: "Amul Malai Paneer", qty: 200, unit: "Grams" },
      { name: "Fresh Full Cream Milk", qty: 50, unit: "ml" },
      { name: "Farm Fresh Tomatoes", qty: 150, unit: "Grams" },
      { name: "Refined Sunflower Cooking Oil", qty: 30, unit: "ml" }
    ]
  },
  {
    menuItem: "Chicken Dum Biryani",
    category: "Biryani & Rice",
    ingredients: [
      { name: "Fresh Chicken Breast", qty: 250, unit: "Grams" },
      { name: "India Gate Basmati Rice", qty: 200, unit: "Grams" },
      { name: "Refined Sunflower Cooking Oil", qty: 40, unit: "ml" }
    ]
  },
  {
    menuItem: "Cheese Burst Pizza",
    category: "Pizzas",
    ingredients: [
      { name: "Mozzarella Pizza Cheese", qty: 120, unit: "Grams" },
      { name: "Farm Fresh Tomatoes", qty: 50, unit: "Grams" }
    ]
  },
  {
    menuItem: "Cold Coffee with Cream",
    category: "Beverages",
    ingredients: [
      { name: "Fresh Full Cream Milk", qty: 250, unit: "ml" },
      { name: "Lavazza Coffee Beans", qty: 15, unit: "Grams" }
    ]
  }
];

export default function InventoryDashboard() {
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [purchases, setPurchases] = useState<VendorPurchase[]>([]);
  const [vendors, setVendors] = useState<VendorAccount[]>([]);
  const [reconciliations, setReconciliations] = useState<DailyReconciliation[]>([]);
  const [logs, setLogs] = useState<StockLog[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"stocks" | "inward" | "vendors" | "audit" | "recipes" | "logs">("stocks");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);

  // Modals
  const [isInwardModalOpen, setIsInwardModalOpen] = useState(false);
  const [isNewInvoiceModalOpen, setIsNewInvoiceModalOpen] = useState(false);
  const [isWastageModalOpen, setIsWastageModalOpen] = useState(false);
  const [isAddItemModalOpen, setIsAddItemModalOpen] = useState(false);
  const [isPayVendorModalOpen, setIsPayVendorModalOpen] = useState(false);
  const [selectedVendorForPay, setSelectedVendorForPay] = useState<VendorAccount | null>(null);

  // Form states
  const [inwardForm, setInwardForm] = useState({ itemId: "", qty: "", costPerUnit: "", notes: "" });
  const [newInvoiceForm, setNewInvoiceForm] = useState({
    invoiceNo: "",
    vendorName: "",
    vendorPhone: "",
    itemsSummary: "",
    totalAmount: "",
    paymentStatus: "PAID" as "PAID" | "PENDING_CREDIT",
    paymentMethod: "UPI" as "CASH" | "UPI" | "BANK_TRANSFER",
    notes: ""
  });
  const [wastageForm, setWastageForm] = useState({ itemId: "", qty: "", reason: "Spoiled / Expired", notes: "" });
  const [newItemForm, setNewItemForm] = useState<Partial<InventoryItem>>({
    name: "",
    category: "Dairy",
    currentStock: 0,
    unit: "kg",
    minAlertStock: 2,
    costPerUnit: 100,
    vendorName: "",
    vendorPhone: ""
  });
  const [payAmount, setPayAmount] = useState("");
  const [isSyncing, setIsSyncing] = useState<boolean>(false);
  const [lastServerSync, setLastServerSync] = useState<string>("Initializing...");

  // Load from Live Server Engine (with localStorage offline fallback)
  const fetchServerInventory = async () => {
    setIsSyncing(true);
    try {
      const res = await fetch("/api/admin/inventory");
      if (res.ok) {
        const data = await res.json();
        if (data.success && data.store) {
          if (Array.isArray(data.store.items)) {
            setItems(data.store.items);
            localStorage.setItem("hwb_inventory_items", JSON.stringify(data.store.items));
          }
          if (Array.isArray(data.store.purchases)) {
            setPurchases(data.store.purchases);
            localStorage.setItem("hwb_inventory_purchases", JSON.stringify(data.store.purchases));
          }
          if (Array.isArray(data.store.vendors)) {
            setVendors(data.store.vendors);
            localStorage.setItem("hwb_inventory_vendors", JSON.stringify(data.store.vendors));
          }
          if (Array.isArray(data.store.reconciliations)) {
            setReconciliations(data.store.reconciliations);
            localStorage.setItem("hwb_inventory_reconciliations", JSON.stringify(data.store.reconciliations));
          }
          if (Array.isArray(data.store.logs)) {
            setLogs(data.store.logs);
            localStorage.setItem("hwb_inventory_logs", JSON.stringify(data.store.logs));
          }
          setLastServerSync(new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
          return;
        }
      }
    } catch (e) {
      console.warn("Live inventory sync notice (falling back to cache):", e);
    } finally {
      setIsSyncing(false);
    }

    // Offline cache fallback
    const savedItems = localStorage.getItem("hwb_inventory_items");
    const savedPurchases = localStorage.getItem("hwb_inventory_purchases");
    const savedVendors = localStorage.getItem("hwb_inventory_vendors");
    const savedRec = localStorage.getItem("hwb_inventory_reconciliations");
    const savedLogs = localStorage.getItem("hwb_inventory_logs");

    if (savedItems) try { setItems(JSON.parse(savedItems)); } catch { setItems(INITIAL_INVENTORY); }
    else setItems(INITIAL_INVENTORY);

    if (savedPurchases) try { setPurchases(JSON.parse(savedPurchases)); } catch { setPurchases(INITIAL_PURCHASES); }
    else setPurchases(INITIAL_PURCHASES);

    if (savedVendors) try { setVendors(JSON.parse(savedVendors)); } catch { setVendors(INITIAL_VENDORS); }
    else setVendors(INITIAL_VENDORS);

    if (savedRec) try { setReconciliations(JSON.parse(savedRec)); } catch { setReconciliations(INITIAL_RECONCILIATION); }
    else setReconciliations(INITIAL_RECONCILIATION);

    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch { setLogs(INITIAL_LOGS); }
    else setLogs(INITIAL_LOGS);
    setLastServerSync("Cached Mode");
  };

  useEffect(() => {
    fetchServerInventory();
  }, []);

  const postServerAction = async (action: string, payload: any) => {
    try {
      await fetch("/api/admin/inventory", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action, payload })
      });
    } catch (e) {
      console.warn(`Failed to sync action ${action} to server:`, e);
    }
  };

  const saveItems = (updated: InventoryItem[]) => {
    setItems(updated);
    localStorage.setItem("hwb_inventory_items", JSON.stringify(updated));
  };

  const savePurchases = (updated: VendorPurchase[]) => {
    setPurchases(updated);
    localStorage.setItem("hwb_inventory_purchases", JSON.stringify(updated));
  };

  const saveVendors = (updated: VendorAccount[]) => {
    setVendors(updated);
    localStorage.setItem("hwb_inventory_vendors", JSON.stringify(updated));
  };

  const saveLogs = (updatedLogs: StockLog[]) => {
    setLogs(updatedLogs);
    localStorage.setItem("hwb_inventory_logs", JSON.stringify(updatedLogs));
  };

  // Top KPI calculations
  const totalValuation = items.reduce((acc, item) => acc + (item.currentStock * item.costPerUnit), 0);
  const totalInwardMonth = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalPendingUdhar = vendors.reduce((acc, v) => acc + v.pendingDue, 0);
  const lowStockItems = items.filter(i => i.currentStock <= i.minAlertStock);
  const totalWastageLoss = logs.filter(l => l.type === "WASTAGE").reduce((acc, l) => acc + l.cost, 0);

  // Filtered Stock items
  const filteredItems = items.filter(item => {
    const matchesCategory = categoryFilter === "ALL" || item.category === categoryFilter;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          item.vendorName.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesLowStock = !showLowStockOnly || item.currentStock <= item.minAlertStock;
    return matchesCategory && matchesSearch && matchesLowStock;
  });

  // Single Item Inward submit
  const handleInwardSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = items.find(i => i.id === inwardForm.itemId);
    if (!targetItem) return toast.error("Please select an item");
    const qty = parseFloat(inwardForm.qty);
    if (isNaN(qty) || qty <= 0) return toast.error("Enter valid quantity");

    const costUnit = inwardForm.costPerUnit ? parseFloat(inwardForm.costPerUnit) : targetItem.costPerUnit;
    const updated = items.map(i => {
      if (i.id === targetItem.id) {
        return {
          ...i,
          currentStock: Number((i.currentStock + qty).toFixed(2)),
          costPerUnit: costUnit,
          lastUpdated: "Just now"
        };
      }
      return i;
    });

    const newLog: StockLog = {
      id: "log-" + Date.now(),
      itemName: targetItem.name,
      type: "INWARD",
      quantity: qty,
      unit: targetItem.unit,
      notes: inwardForm.notes || "Stock purchase refill",
      cost: Number((qty * costUnit).toFixed(2)),
      timestamp: "Just now"
    };

    saveItems(updated);
    saveLogs([newLog, ...logs]);
    postServerAction("STOCK_INWARD", {
      itemId: targetItem.id,
      itemName: targetItem.name,
      qty,
      costPerUnit: costUnit,
      notes: inwardForm.notes
    });
    setIsInwardModalOpen(false);
    setInwardForm({ itemId: "", qty: "", costPerUnit: "", notes: "" });
    toast.success(`+${qty} ${targetItem.unit} added to ${targetItem.name}!`);
  };

  // New Vendor Inward Invoice submit
  const handleNewInvoiceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const amt = parseFloat(newInvoiceForm.totalAmount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter valid total bill amount");

    const newInvoice: VendorPurchase = {
      id: "pur-" + Date.now(),
      invoiceNo: newInvoiceForm.invoiceNo || `INV-${Math.floor(1000 + Math.random() * 9000)}`,
      vendorName: newInvoiceForm.vendorName || "Direct Vendor",
      vendorPhone: newInvoiceForm.vendorPhone || "7499934257",
      date: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      itemsSummary: newInvoiceForm.itemsSummary || "Bulk supplies",
      totalAmount: amt,
      paymentStatus: newInvoiceForm.paymentStatus,
      paymentMethod: newInvoiceForm.paymentMethod,
      notes: newInvoiceForm.notes
    };

    // Update vendor due if credit, or totalPurchased and totalPaid if paid
    const updatedVendors = vendors.map(v => {
      if (v.name.toLowerCase().includes(newInvoiceForm.vendorName.toLowerCase())) {
        if (newInvoiceForm.paymentStatus === "PENDING_CREDIT") {
          return {
            ...v,
            totalPurchased: v.totalPurchased + amt,
            pendingDue: v.pendingDue + amt
          };
        } else {
          return {
            ...v,
            totalPurchased: v.totalPurchased + amt,
            totalPaid: v.totalPaid + amt,
            lastPaymentDate: "Today"
          };
        }
      }
      return v;
    });
    saveVendors(updatedVendors);

    savePurchases([newInvoice, ...purchases]);
    postServerAction("STOCK_INWARD", {
      invoiceNo: newInvoice.invoiceNo,
      vendorName: newInvoice.vendorName,
      vendorPhone: newInvoice.vendorPhone,
      qty: 1,
      costPerUnit: amt,
      notes: newInvoice.notes,
      paymentStatus: newInvoice.paymentStatus,
      paymentMethod: newInvoice.paymentMethod
    });
    setIsNewInvoiceModalOpen(false);
    setNewInvoiceForm({
      invoiceNo: "",
      vendorName: "",
      vendorPhone: "",
      itemsSummary: "",
      totalAmount: "",
      paymentStatus: "PAID",
      paymentMethod: "UPI",
      notes: ""
    });
    toast.success(`Inward Bill #${newInvoice.invoiceNo} (₹${amt}) logged successfully!`);
  };

  // Wastage Log Submit
  const handleWastageSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetItem = items.find(i => i.id === wastageForm.itemId);
    if (!targetItem) return toast.error("Please select an item");
    const qty = parseFloat(wastageForm.qty);
    if (isNaN(qty) || qty <= 0) return toast.error("Enter valid quantity");
    if (qty > targetItem.currentStock) return toast.error("Wastage cannot exceed current stock");

    const costLoss = Number((qty * targetItem.costPerUnit).toFixed(2));
    const updated = items.map(i => {
      if (i.id === targetItem.id) {
        return {
          ...i,
          currentStock: Number((i.currentStock - qty).toFixed(2)),
          lastUpdated: "Just now"
        };
      }
      return i;
    });

    const newLog: StockLog = {
      id: "log-" + Date.now(),
      itemName: targetItem.name,
      type: "WASTAGE",
      quantity: qty,
      unit: targetItem.unit,
      notes: `${wastageForm.reason} - ${wastageForm.notes}`,
      cost: costLoss,
      timestamp: "Just now"
    };

    saveItems(updated);
    saveLogs([newLog, ...logs]);
    postServerAction("LOG_WASTAGE", {
      itemId: targetItem.id,
      itemName: targetItem.name,
      qty,
      reason: wastageForm.reason,
      notes: wastageForm.notes
    });
    setIsWastageModalOpen(false);
    setWastageForm({ itemId: "", qty: "", reason: "Spoiled / Expired", notes: "" });
    toast.error(`Wastage of ${qty} ${targetItem.unit} (₹${costLoss}) recorded`);
  };

  // Add New Item Submit
  const handleAddNewItem = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newItemForm.name) return toast.error("Please provide ingredient name");

    const item: InventoryItem = {
      id: "inv-" + Date.now(),
      name: newItemForm.name,
      category: (newItemForm.category as any) || "Grocery",
      currentStock: Number(newItemForm.currentStock) || 0,
      unit: (newItemForm.unit as any) || "kg",
      minAlertStock: Number(newItemForm.minAlertStock) || 2,
      costPerUnit: Number(newItemForm.costPerUnit) || 100,
      vendorName: newItemForm.vendorName || "Direct Market",
      vendorPhone: newItemForm.vendorPhone || "7499934257",
      lastUpdated: "Just now"
    };

    saveItems([item, ...items]);
    postServerAction("ADD_ITEM", item);
    setIsAddItemModalOpen(false);
    setNewItemForm({
      name: "",
      category: "Dairy",
      currentStock: 0,
      unit: "kg",
      minAlertStock: 2,
      costPerUnit: 100,
      vendorName: "",
      vendorPhone: ""
    });
    toast.success(`${item.name} added to inventory!`);
  };

  // Settle Vendor Payment
  const handleSettleVendorPayment = (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedVendorForPay) return;
    const paidVal = parseFloat(payAmount);
    if (isNaN(paidVal) || paidVal <= 0) return toast.error("Enter valid payment amount");
    if (paidVal > selectedVendorForPay.pendingDue) return toast.error("Payment cannot exceed pending due");

    const updated = vendors.map(v => {
      if (v.id === selectedVendorForPay.id) {
        return {
          ...v,
          totalPaid: v.totalPaid + paidVal,
          pendingDue: v.pendingDue - paidVal,
          lastPaymentDate: "Today"
        };
      }
      return v;
    });

    saveVendors(updated);
    postServerAction("SETTLE_VENDOR_PAYMENT", {
      vendorId: selectedVendorForPay.id,
      amount: paidVal,
      paymentMethod: "UPI"
    });
    setIsPayVendorModalOpen(false);
    setPayAmount("");
    toast.success(`₹${paidVal} paid to ${selectedVendorForPay.name}!`);
  };

  // WhatsApp Vendor Statement Share
  const handleShareVendorStatement = (v: VendorAccount) => {
    const cleanPhone = v.phone.replace(/\D/g, "");
    const msg = `🧾 *VENDOR LEDGER STATEMENT - HOTEL WHITE BLISS*\n` +
      `--------------------------------\n` +
      `*Vendor:* ${v.name}\n` +
      `*Category:* ${v.category}\n` +
      `--------------------------------\n` +
      `*Total Purchased (This Month):* ₹${v.totalPurchased.toLocaleString("en-IN")}\n` +
      `*Total Paid:* ₹${v.totalPaid.toLocaleString("en-IN")}\n` +
      `*Outstanding Balance (Udhar):* ₹${v.pendingDue.toLocaleString("en-IN")}\n` +
      `*Last Payment:* ${v.lastPaymentDate}\n` +
      `--------------------------------\n` +
      `Dhanyawad! Hotel White Bliss Management. 🙏`;

    window.open(`https://wa.me/91${cleanPhone || "7499934257"}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(`Opening WhatsApp statement for ${v.name}`);
  };

  // WhatsApp Vendor Purchase Order Re-order
  const handleWhatsAppReorder = (item: InventoryItem) => {
    const requiredRefill = Math.max(item.minAlertStock * 2, 5);
    const phone = item.vendorPhone.replace(/\D/g, "");
    
    const message = `📦 *PURCHASE ORDER - HOTEL WHITE BLISS*\n` +
      `--------------------------------\n` +
      `*Item:* ${item.name} (${item.category})\n` +
      `*Required Quantity:* ${requiredRefill} ${item.unit}\n` +
      `*Current Stock Status:* ${item.currentStock} ${item.unit} (Running Low ⚠️)\n` +
      `--------------------------------\n` +
      `Kripya jaldi se dispatch kara dijiye.\n` +
      `Delivery Address: Hotel White Bliss, Main Counter.\n` +
      `Dhanyawad! 🙏`;

    window.open(`https://wa.me/91${phone || "7499934257"}?text=${encodeURIComponent(message)}`, "_blank");
    toast.success(`Opening WhatsApp PO for ${item.vendorName}`, { icon: "📲" });
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Item Name,Category,Current Stock,Unit,Min Alert Stock,Cost Per Unit (INR),Total Valuation (INR),Status,Vendor,Vendor Phone"];
    const rows = items.map(i => {
      const status = i.currentStock <= i.minAlertStock ? "LOW STOCK" : "IN STOCK";
      const total = (i.currentStock * i.costPerUnit).toFixed(2);
      return `"${i.name}","${i.category}",${i.currentStock},"${i.unit}",${i.minAlertStock},${i.costPerUnit},${total},"${status}","${i.vendorName}","${i.vendorPhone}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hotel_White_Bliss_Inventory_Audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory Audit Report downloaded as CSV!");
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-[#A18D6D]/15 text-[#8c7653] rounded-2xl">
              <Boxes size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-gray-900 tracking-tight flex items-center gap-2">
                Inventory & Procurement Suite
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Enterprise Suite
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Raw material stocks, daily vendor inward purchases, supplier credit ledgers & closing audit
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-full bg-emerald-50 text-emerald-700 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Synced with Kitchen KDS & QR Orders
                </span>
                <button
                  onClick={fetchServerInventory}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1 text-xs font-bold text-gray-600 hover:text-gray-900 bg-gray-100 px-2.5 py-1 rounded-lg hover:bg-gray-200 transition"
                  title="Force re-sync with server"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin text-amber-600" : ""} />
                  {isSyncing ? "Syncing..." : "Sync Stock"}
                </button>
                <span className="text-[11px] text-gray-400">Last sync: {lastServerSync}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <FileText size={17} /> + Record Inward Bill
          </button>

          <button
            onClick={() => setIsInwardModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <ArrowDownRight size={17} /> + Quick Refill
          </button>

          <button
            onClick={() => setIsWastageModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <ArrowUpRight size={17} /> Log Wastage
          </button>

          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <Plus size={17} /> New Raw Material
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition shadow-sm"
            title="Download CSV Audit"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Stock Value */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Current Stock Value</span>
            <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
              <DollarSign size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            ₹{totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-gray-500 mt-1">Capital in kitchen storage</p>
        </div>

        {/* Monthly Inward Purchases */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Total Inward (Aaya)</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <ArrowDownRight size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            ₹{totalInwardMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-gray-500 mt-1">{purchases.length} Delivery Invoices</p>
        </div>

        {/* Pending Vendor Udhar */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition ${
          totalPendingUdhar > 0 ? "bg-purple-50/70 border-purple-200" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Vendor Udhar (Due)</span>
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-900">
            ₹{totalPendingUdhar.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-purple-700 mt-1">Payable to suppliers</p>
        </div>

        {/* Low Stock Alerts */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden transition-all ${
          lowStockItems.length > 0 ? "bg-amber-50/70 border-amber-300" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-amber-800">Low Stock Alert</span>
            <div className="p-2 bg-amber-500 text-white rounded-xl">
              <AlertTriangle size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-amber-900">
            {lowStockItems.length} Items
          </div>
          <p className="text-xs text-amber-700 mt-1">
            {lowStockItems.length > 0 ? "Re-order needed from vendor" : "Safe levels"}
          </p>
        </div>

        {/* Wastage Loss */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Kitchen Wastage</span>
            <div className="p-2 bg-rose-50 text-rose-600 rounded-xl">
              <ArrowUpRight size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-600">
            ₹{totalWastageLoss.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-xs text-gray-500 mt-1">Spoilage & loss recorded</p>
        </div>
      </div>

      {/* Main Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 overflow-x-auto pb-px">
        <div className="flex gap-1 sm:gap-2 min-w-max">
          <button
            onClick={() => setActiveTab("stocks")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "stocks"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Boxes size={16} /> Raw Materials ({items.length})
          </button>

          <button
            onClick={() => setActiveTab("inward")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "inward"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <FileText size={16} className="text-blue-600" /> Inward Bills & Delivery ({purchases.length})
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "vendors"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Users size={16} className="text-purple-600" /> Vendor Udhar Ledger ({vendors.length})
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "audit"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Calculator size={16} className="text-emerald-600" /> Daily Closing Audit
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "recipes"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Sparkles size={16} className="text-amber-500" /> Recipe BOM
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "logs"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <RefreshCw size={16} /> Audit Logs ({logs.length})
          </button>
        </div>
      </div>

      {/* TAB 1: RAW MATERIALS STOCKS */}
      {activeTab === "stocks" && (
        <div className="space-y-6">
          {/* Filters & Search Bar */}
          <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search ingredient, raw material or vendor..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white"
              />
            </div>

            <div className="flex items-center gap-2">
              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs font-bold py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="ALL">All Categories</option>
                <option value="Dairy">Dairy</option>
                <option value="Grocery">Grocery</option>
                <option value="Poultry & Meat">Poultry & Meat</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Beverages">Beverages</option>
                <option value="Packaging">Packaging</option>
                <option value="Spices">Spices</option>
                <option value="Bakery">Bakery</option>
              </select>

              <button
                onClick={() => setShowLowStockOnly(!showLowStockOnly)}
                className={`flex items-center gap-1.5 text-xs font-bold px-3 py-2 rounded-xl border transition ${
                  showLowStockOnly 
                    ? "bg-amber-500 border-amber-600 text-white shadow-sm"
                    : "bg-white border-gray-200 text-gray-700 hover:bg-gray-50"
                }`}
              >
                <AlertTriangle size={14} />
                <span>Low Stock Only</span>
              </button>
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Ingredient / Raw Material</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Alert Limit</th>
                  <th className="py-3.5 px-4 text-right">Cost Rate</th>
                  <th className="py-3.5 px-4 text-right">Valuation</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => {
                  const isLow = item.currentStock <= item.minAlertStock;
                  const itemValue = item.currentStock * item.costPerUnit;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{item.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Vendor: <span className="text-gray-600 font-medium">{item.vendorName}</span> ({item.vendorPhone})
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="text-xs font-semibold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                          {item.category}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center">
                        <span className={`text-base font-extrabold ${isLow ? "text-amber-600 font-black" : "text-gray-900"}`}>
                          {item.currentStock} {item.unit}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-center text-xs text-gray-500">
                        {item.minAlertStock} {item.unit}
                      </td>
                      <td className="py-4 px-4 text-right font-medium text-gray-700">
                        ₹{item.costPerUnit} / {item.unit}
                      </td>
                      <td className="py-4 px-4 text-right font-bold text-gray-900">
                        ₹{itemValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </td>
                      <td className="py-4 px-4">
                        {isLow ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-amber-100 text-amber-800 animate-pulse">
                            <span className="w-2 h-2 rounded-full bg-amber-600"></span> LOW STOCK
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            <span className="w-2 h-2 rounded-full bg-green-500"></span> In Stock
                          </span>
                        )}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="flex items-center justify-end gap-1.5">
                          {isLow && (
                            <button
                              onClick={() => handleWhatsAppReorder(item)}
                              className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-sm"
                              title="Send 1-Click WhatsApp Purchase Order to Vendor"
                            >
                              <MessageCircle size={14} /> Re-Order
                            </button>
                          )}
                          <button
                            onClick={() => {
                              setInwardForm({ itemId: item.id, qty: "", costPerUnit: String(item.costPerUnit), notes: "" });
                              setIsInwardModalOpen(true);
                            }}
                            className="p-1.5 text-emerald-600 hover:bg-emerald-50 rounded-lg transition"
                            title="Quick Refill / Inward"
                          >
                            <ArrowDownRight size={17} />
                          </button>
                          <button
                            onClick={() => {
                              setWastageForm({ itemId: item.id, qty: "", reason: "Spoiled / Expired", notes: "" });
                              setIsWastageModalOpen(true);
                            }}
                            className="p-1.5 text-rose-600 hover:bg-rose-50 rounded-lg transition"
                            title="Log Wastage"
                          >
                            <ArrowUpRight size={17} />
                          </button>
                          <button
                            onClick={() => {
                              if (confirm(`Delete ${item.name} from inventory?`)) {
                                saveItems(items.filter(i => i.id !== item.id));
                                postServerAction("DELETE_ITEM", { id: item.id });
                                toast.success("Item removed");
                              }
                            }}
                            className="p-1.5 text-gray-400 hover:text-rose-600 hover:bg-gray-100 rounded-lg transition"
                            title="Delete Item"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden space-y-3">
            {filteredItems.map(item => {
              const isLow = item.currentStock <= item.minAlertStock;
              const itemValue = item.currentStock * item.costPerUnit;

              return (
                <div key={item.id} className={`bg-white p-4 rounded-2xl border shadow-sm space-y-3 ${
                  isLow ? "border-amber-300 ring-1 ring-amber-300" : "border-gray-200"
                }`}>
                  <div className="flex items-start justify-between">
                    <div>
                      <h3 className="font-bold text-gray-900">{item.name}</h3>
                      <p className="text-xs text-gray-500">
                        {item.category} • {item.vendorName}
                      </p>
                    </div>
                    {isLow ? (
                      <span className="text-[11px] font-black bg-amber-100 text-amber-800 px-2 py-0.5 rounded-full">
                        ⚠️ LOW STOCK
                      </span>
                    ) : (
                      <span className="text-[11px] font-bold bg-green-100 text-green-700 px-2 py-0.5 rounded-full">
                        🟢 IN STOCK
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl text-center text-xs">
                    <div>
                      <div className="text-gray-400 font-medium">Stock</div>
                      <div className={`font-black text-sm mt-0.5 ${isLow ? "text-amber-600" : "text-gray-900"}`}>
                        {item.currentStock} {item.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium">Alert At</div>
                      <div className="font-bold text-sm text-gray-700 mt-0.5">
                        {item.minAlertStock} {item.unit}
                      </div>
                    </div>
                    <div>
                      <div className="text-gray-400 font-medium">Valuation</div>
                      <div className="font-bold text-sm text-gray-900 mt-0.5">
                        ₹{itemValue.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-2 pt-1 border-t border-gray-100">
                    {isLow && (
                      <button
                        onClick={() => handleWhatsAppReorder(item)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-[#25D366] text-white text-xs font-bold rounded-xl active:scale-95 transition shadow-sm"
                      >
                        <MessageCircle size={15} /> Re-Order on WA
                      </button>
                    )}
                    <button
                      onClick={() => {
                        setInwardForm({ itemId: item.id, qty: "", costPerUnit: String(item.costPerUnit), notes: "" });
                        setIsInwardModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-emerald-50 text-emerald-700 text-xs font-bold rounded-xl border border-emerald-200"
                    >
                      <ArrowDownRight size={14} /> + Refill
                    </button>
                    <button
                      onClick={() => {
                        setWastageForm({ itemId: item.id, qty: "", reason: "Spoiled / Expired", notes: "" });
                        setIsWastageModalOpen(true);
                      }}
                      className="flex-1 flex items-center justify-center gap-1 py-2 bg-rose-50 text-rose-700 text-xs font-bold rounded-xl border border-rose-200"
                    >
                      <ArrowUpRight size={14} /> Wastage
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 2: INWARD BILLS & DELIVERIES (Kitna Samaan Aaya Register) */}
      {activeTab === "inward" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 text-base flex items-center gap-2">
                <span>📥</span> Daily Vendor Inward Register (Khareedi / Purchase Bills)
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Every delivery from dairy, meat, mandi & grocery logged with bill number, items and payment status
              </p>
            </div>
            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-bold transition shadow-sm"
            >
              <Plus size={15} /> + Add Inward Delivery Bill
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Invoice / Date</th>
                  <th className="py-3.5 px-4">Vendor Name</th>
                  <th className="py-3.5 px-4">Delivered Items Summary</th>
                  <th className="py-3.5 px-4 text-right">Bill Amount</th>
                  <th className="py-3.5 px-4 text-center">Payment Status</th>
                  <th className="py-3.5 px-5 text-right">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-4 px-5">
                      <div className="font-bold text-gray-900">{p.invoiceNo}</div>
                      <div className="text-xs text-gray-400 mt-0.5">{p.date}</div>
                    </td>
                    <td className="py-4 px-4 font-semibold text-gray-800">
                      <div>{p.vendorName}</div>
                      <div className="text-xs text-gray-400">{p.vendorPhone}</div>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-700 max-w-xs font-medium">
                      {p.itemsSummary}
                    </td>
                    <td className="py-4 px-4 text-right font-extrabold text-base text-gray-900">
                      ₹{p.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-center">
                      {p.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                          <Check size={12} /> PAID ({p.paymentMethod || "CASH"})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-purple-100 text-purple-800 animate-pulse">
                          🟡 CREDIT (Udhar)
                        </span>
                      )}
                    </td>
                    <td className="py-4 px-5 text-right text-xs text-gray-400">
                      {p.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR UDHAR LEDGER (Kaun Se Supplier Ka Kitna Baki Hai) */}
      {activeTab === "vendors" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl flex items-start gap-3">
            <Users className="text-purple-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-purple-950 text-sm">Supplier Accounts & Udhar Payables (Khata Book)</h3>
              <p className="text-xs text-purple-800 mt-0.5 leading-relaxed">
                Track how much stock came from each supplier, how much has been paid, and exact pending credit due. Send WhatsApp payment receipts with 1-click!
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-start justify-between border-b pb-3 border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{v.name}</h3>
                    <p className="text-xs text-gray-400 mt-0.5">{v.category}</p>
                    <p className="text-xs text-gray-500 font-medium mt-1">📱 {v.phone}</p>
                  </div>
                  {v.pendingDue > 0 ? (
                    <span className="text-xs font-bold px-2.5 py-1 bg-purple-100 text-purple-800 rounded-lg">
                      Due: ₹{v.pendingDue.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-700 rounded-lg">
                      All Clear ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-gray-50 p-3 rounded-xl text-center text-xs">
                  <div>
                    <span className="text-gray-400 block font-medium">Purchased</span>
                    <span className="font-bold text-gray-900 mt-0.5 block text-sm">
                      ₹{v.totalPurchased.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Paid</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block text-sm">
                      ₹{v.totalPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-gray-400 block font-medium">Pending Udhar</span>
                    <span className={`font-black mt-0.5 block text-sm ${v.pendingDue > 0 ? "text-purple-700" : "text-gray-400"}`}>
                      ₹{v.pendingDue.toLocaleString("en-IN")}
                    </span>
                  </div>
                </div>

                <div className="flex items-center gap-2 pt-1">
                  {v.pendingDue > 0 && (
                    <button
                      onClick={() => {
                        setSelectedVendorForPay(v);
                        setPayAmount(String(v.pendingDue));
                        setIsPayVendorModalOpen(true);
                      }}
                      className="flex-1 py-2.5 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
                    >
                      💳 Settle Payment
                    </button>
                  )}
                  <button
                    onClick={() => handleShareVendorStatement(v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2.5 bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95"
                  >
                    <MessageCircle size={15} /> Send Ledger on WA
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 4: DAILY STOCK CLOSING RECONCILIATION AUDIT */}
      {activeTab === "audit" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3 justify-between">
            <div className="flex items-start gap-3">
              <Calculator className="text-emerald-700 mt-0.5 shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">End of Day Stock Reconciliation (Daily Closing Sheet)</h3>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Formula: <strong>Opening + Inward Received (-) Sales Consumed (-) Wastage = Expected Closing</strong>. If Physical count is lower than Expected, the system flags it in Red to catch kitchen theft and over-portioning!
                </p>
              </div>
            </div>
            <button
              onClick={async () => {
                await postServerAction("SAVE_RECONCILIATION", { reconciliations });
                toast.success("Daily Stock Reconciliation Audit saved to server!");
              }}
              className="shrink-0 px-3.5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white text-xs font-bold rounded-xl transition shadow-sm active:scale-95 flex items-center gap-1.5"
            >
              <Check size={14} /> Save Audit
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Raw Material</th>
                  <th className="py-3.5 px-4 text-center">Opening</th>
                  <th className="py-3.5 px-4 text-center text-emerald-700">+ Inward</th>
                  <th className="py-3.5 px-4 text-center text-blue-700">- Sales Used</th>
                  <th className="py-3.5 px-4 text-center text-rose-700">- Wastage</th>
                  <th className="py-3.5 px-4 text-center font-bold">System Expected</th>
                  <th className="py-3.5 px-4 text-center font-black">Physical Count</th>
                  <th className="py-3.5 px-5 text-right font-black">Variance / Difference</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {reconciliations.map(r => {
                  const hasLeakage = r.variance < 0;

                  return (
                    <tr key={r.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-5 font-bold text-gray-900">
                        {r.itemName}
                      </td>
                      <td className="py-4 px-4 text-center text-gray-600 font-medium">
                        {r.openingStock} {r.unit}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-emerald-600">
                        +{r.inwardToday} {r.unit}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-blue-600">
                        -{r.consumedSales} {r.unit}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-rose-600">
                        -{r.wastage} {r.unit}
                      </td>
                      <td className="py-4 px-4 text-center font-extrabold text-gray-900 bg-gray-50/70">
                        {r.expectedClosing} {r.unit}
                      </td>
                      <td className="py-2 px-3 text-center bg-gray-50/70">
                        <div className="flex items-center justify-center gap-1">
                          <input
                            type="number"
                            step="0.1"
                            value={r.physicalClosing}
                            onChange={(e) => {
                              const newPhysical = parseFloat(e.target.value) || 0;
                              const variance = Number((newPhysical - r.expectedClosing).toFixed(2));
                              const item = items.find(i => i.name.toLowerCase() === r.itemName.toLowerCase());
                              const costUnit = item ? item.costPerUnit : 100;
                              let status: "MATCHED" | "LEAKAGE_THEFT" | "SURPLUS" | "HIGH_VARIANCE_THEFT_ALERT" = "MATCHED";
                              let costLoss = 0;
                              if (variance <= -0.5) {
                                status = "HIGH_VARIANCE_THEFT_ALERT";
                                costLoss = Number((Math.abs(variance) * costUnit).toFixed(2));
                              } else if (variance < 0) {
                                status = "LEAKAGE_THEFT";
                                costLoss = Number((Math.abs(variance) * costUnit).toFixed(2));
                              } else if (variance > 0) {
                                status = "SURPLUS";
                              }
                              setReconciliations(prev => prev.map(rec => rec.id === r.id ? {
                                ...rec,
                                physicalClosing: newPhysical,
                                variance,
                                status,
                                costLoss
                              } : rec));
                            }}
                            className="w-20 px-2 py-1 text-center font-bold text-gray-900 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                          />
                          <span className="text-xs text-gray-500">{r.unit}</span>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        {r.status === "HIGH_VARIANCE_THEFT_ALERT" || r.variance <= -0.5 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-black bg-rose-600 text-white shadow-sm animate-pulse">
                            🚨 HIGH_VARIANCE_THEFT_ALERT ({r.variance} {r.unit} | Loss: ₹{r.costLoss || Math.abs(Number((r.variance * (items.find(i => i.name.toLowerCase() === r.itemName.toLowerCase())?.costPerUnit || 100)).toFixed(2)))})
                          </span>
                        ) : r.variance < 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-amber-100 text-amber-900">
                            ⚠️ Leakage: {r.variance} {r.unit} (Loss: ₹{r.costLoss || Math.abs(Number((r.variance * (items.find(i => i.name.toLowerCase() === r.itemName.toLowerCase())?.costPerUnit || 100)).toFixed(2)))})
                          </span>
                        ) : r.variance > 0 ? (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-blue-100 text-blue-800">
                            + {r.variance} {r.unit} (Surplus)
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                            ✓ 0.0 {r.unit} (Exact Match)
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
      )}

      {/* TAB 5: RECIPE BOM MAPPING */}
      {activeTab === "recipes" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-amber-50/60 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <Sparkles className="text-amber-600 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Automated Kitchen BOM (Bill of Materials)</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Jab bhi Cashier par koi dish settle hoti hai, system automatically backend se exact ingredients deduct karta hai. Isse kitchen theft aur unaccounted raw material loss 0% ho jata hai.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {SAMPLE_RECIPES.map((recipe, idx) => (
              <div key={idx} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-4">
                <div className="flex items-center justify-between border-b pb-3 border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{recipe.menuItem}</h3>
                    <span className="text-xs text-gray-400">{recipe.category}</span>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-blue-50 text-blue-700 rounded-lg">
                    Auto-Deduct ON
                  </span>
                </div>

                <div className="space-y-2.5">
                  <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Required Ingredients per Portion:</span>
                  {recipe.ingredients.map((ing, iIdx) => (
                    <div key={iIdx} className="flex items-center justify-between text-xs py-1 px-2.5 bg-gray-50 rounded-lg">
                      <span className="font-semibold text-gray-800">{ing.name}</span>
                      <span className="font-extrabold text-gray-900 bg-white px-2 py-0.5 rounded border border-gray-200 shadow-2xs">
                        {ing.qty} {ing.unit}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 6: STOCK LOGS & AUDIT */}
      {activeTab === "logs" && (
        <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden animate-in fade-in duration-200">
          <div className="p-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-bold text-gray-900 text-sm">Recent Inventory Movements & History</h3>
            <span className="text-xs text-gray-400">{logs.length} Total Logs</span>
          </div>
          <div className="divide-y divide-gray-100">
            {logs.map(log => (
              <div key={log.id} className="p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-2 hover:bg-gray-50/50 transition">
                <div className="flex items-center gap-3">
                  <div className={`p-2 rounded-xl text-xs font-bold ${
                    log.type === "INWARD" 
                      ? "bg-emerald-100 text-emerald-800" 
                      : log.type === "WASTAGE"
                      ? "bg-rose-100 text-rose-800"
                      : "bg-blue-100 text-blue-800"
                  }`}>
                    {log.type === "INWARD" ? <ArrowDownRight size={18} /> : <ArrowUpRight size={18} />}
                  </div>
                  <div>
                    <div className="font-bold text-gray-900 text-sm">
                      {log.type === "INWARD" ? "+ Refill" : "Wastage"}: {log.quantity} {log.unit} of {log.itemName}
                    </div>
                    <div className="text-xs text-gray-400 mt-0.5">
                      {log.notes} • {log.timestamp}
                    </div>
                  </div>
                </div>

                <div className="text-right sm:self-center">
                  <div className={`text-sm font-extrabold ${log.type === "WASTAGE" ? "text-rose-600" : "text-gray-900"}`}>
                    ₹{log.cost.toLocaleString("en-IN")}
                  </div>
                  <div className="text-[11px] text-gray-400">Transaction Value</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: SINGLE ITEM STOCK INWARD */}
      {isInwardModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowDownRight className="text-emerald-600" /> + Quick Stock Inward Refill
              </h2>
              <button onClick={() => setIsInwardModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleInwardSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Raw Material</label>
                <select
                  value={inwardForm.itemId}
                  onChange={e => setInwardForm({ ...inwardForm, itemId: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Current: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Quantity Received</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="e.g. 10"
                    value={inwardForm.qty}
                    onChange={e => setInwardForm({ ...inwardForm, qty: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    step="1"
                    placeholder="e.g. 340"
                    value={inwardForm.costPerUnit}
                    onChange={e => setInwardForm({ ...inwardForm, costPerUnit: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-emerald-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Vendor Bill / Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Invoice #902 from Kalyan Dairy"
                  value={inwardForm.notes}
                  onChange={e => setInwardForm({ ...inwardForm, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-emerald-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsInwardModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Confirm Inward
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: FULL VENDOR INWARD INVOICE */}
      {isNewInvoiceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <FileText className="text-blue-600" /> Record Vendor Inward Delivery Bill
              </h2>
              <button onClick={() => setIsNewInvoiceModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleNewInvoiceSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendor Bill / Invoice #</label>
                  <input
                    type="text"
                    placeholder="e.g. INV-KD-901"
                    value={newInvoiceForm.invoiceNo}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, invoiceNo: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Bill Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4500"
                    value={newInvoiceForm.totalAmount}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, totalAmount: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendor / Supplier Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kalyan Dairy"
                    value={newInvoiceForm.vendorName}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, vendorName: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendor Phone (WhatsApp)</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9822334455"
                    value={newInvoiceForm.vendorPhone}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, vendorPhone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Delivered Items Summary</label>
                <input
                  type="text"
                  placeholder="e.g. Paneer (10kg), Milk (20L), Butter (5kg)"
                  value={newInvoiceForm.itemsSummary}
                  onChange={e => setNewInvoiceForm({ ...newInvoiceForm, itemsSummary: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Status</label>
                  <select
                    value={newInvoiceForm.paymentStatus}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, paymentStatus: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="PAID">PAID (Clear)</option>
                    <option value="PENDING_CREDIT">CREDIT (Udhar / Pending)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Payment Method</label>
                  <select
                    value={newInvoiceForm.paymentMethod}
                    onChange={e => setNewInvoiceForm({ ...newInvoiceForm, paymentMethod: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-blue-500 outline-none"
                  >
                    <option value="UPI">UPI / GPay / PhonePe</option>
                    <option value="CASH">Cash Counter</option>
                    <option value="BANK_TRANSFER">NEFT / Bank Transfer</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Staff / Delivery Notes</label>
                <input
                  type="text"
                  placeholder="e.g. Received by Chef Manoj, weighed and checked"
                  value={newInvoiceForm.notes}
                  onChange={e => setNewInvoiceForm({ ...newInvoiceForm, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-blue-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewInvoiceModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Save Inward Bill
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: SETTLE VENDOR PAYMENT */}
      {isPayVendorModalOpen && selectedVendorForPay && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <CreditCard className="text-purple-600" /> Settle Vendor Udhar
              </h2>
              <button onClick={() => setIsPayVendorModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleSettleVendorPayment} className="space-y-4">
              <div className="bg-purple-50 p-3.5 rounded-xl text-xs space-y-1 text-purple-900">
                <div className="font-bold text-sm text-purple-950">{selectedVendorForPay.name}</div>
                <div>Outstanding Balance: <strong className="text-base text-purple-900">₹{selectedVendorForPay.pendingDue.toLocaleString("en-IN")}</strong></div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Paying Amount (₹)</label>
                <input
                  type="number"
                  placeholder="e.g. 5000"
                  value={payAmount}
                  onChange={e => setPayAmount(e.target.value)}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsPayVendorModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Record Payment
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 4: LOG WASTAGE */}
      {isWastageModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <ArrowUpRight className="text-rose-600" /> Log Spoilage & Kitchen Wastage
              </h2>
              <button onClick={() => setIsWastageModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleWastageSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Raw Material</label>
                <select
                  value={wastageForm.itemId}
                  onChange={e => setWastageForm({ ...wastageForm, itemId: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">-- Choose Item --</option>
                  {items.map(i => (
                    <option key={i.id} value={i.id}>
                      {i.name} (Available: {i.currentStock} {i.unit})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Wasted Quantity</label>
                <input
                  type="number"
                  step="0.1"
                  placeholder="e.g. 1.5"
                  value={wastageForm.qty}
                  onChange={e => setWastageForm({ ...wastageForm, qty: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Spoilage</label>
                <select
                  value={wastageForm.reason}
                  onChange={e => setWastageForm({ ...wastageForm, reason: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="Spoiled / Expired">Spoiled / Expired</option>
                  <option value="Burnt during cooking">Burnt during cooking</option>
                  <option value="Milk Curdled">Milk Curdled / Sour</option>
                  <option value="Spilled / Dropped">Spilled / Dropped</option>
                  <option value="Customer Return Quality Issue">Customer Return Quality Issue</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Extra Details / Staff Note</label>
                <input
                  type="text"
                  placeholder="e.g. Fridge cooling failed overnight"
                  value={wastageForm.notes}
                  onChange={e => setWastageForm({ ...wastageForm, notes: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsWastageModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Record Loss
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 5: ADD NEW RAW MATERIAL */}
      {isAddItemModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-lg p-6 space-y-5 shadow-2xl">
            <div className="flex items-center justify-between border-b pb-3">
              <h2 className="text-lg font-bold text-gray-900 flex items-center gap-2">
                <Plus className="text-blue-600" /> Add New Raw Material / Ingredient
              </h2>
              <button onClick={() => setIsAddItemModalOpen(false)} className="text-gray-400 hover:text-gray-600 font-bold text-lg">✕</button>
            </div>

            <form onSubmit={handleAddNewItem} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Ingredient Name</label>
                <input
                  type="text"
                  placeholder="e.g. Kesar Elaichi Ice Cream Tub"
                  value={newItemForm.name}
                  onChange={e => setNewItemForm({ ...newItemForm, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Category</label>
                  <select
                    value={newItemForm.category}
                    onChange={e => setNewItemForm({ ...newItemForm, category: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    <option value="Dairy">Dairy</option>
                    <option value="Grocery">Grocery</option>
                    <option value="Poultry & Meat">Poultry & Meat</option>
                    <option value="Vegetables">Vegetables</option>
                    <option value="Beverages">Beverages</option>
                    <option value="Packaging">Packaging</option>
                    <option value="Spices">Spices</option>
                    <option value="Bakery">Bakery</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Measuring Unit</label>
                  <select
                    value={newItemForm.unit}
                    onChange={e => setNewItemForm({ ...newItemForm, unit: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="L">L (Liters)</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Packets">Packets</option>
                    <option value="Grams">Grams</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Opening Stock</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="0"
                    value={newItemForm.currentStock}
                    onChange={e => setNewItemForm({ ...newItemForm, currentStock: parseFloat(e.target.value) || 0 })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Alert Limit</label>
                  <input
                    type="number"
                    step="0.1"
                    placeholder="2"
                    value={newItemForm.minAlertStock}
                    onChange={e => setNewItemForm({ ...newItemForm, minAlertStock: parseFloat(e.target.value) || 2 })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Cost Rate (₹)</label>
                  <input
                    type="number"
                    placeholder="100"
                    value={newItemForm.costPerUnit}
                    onChange={e => setNewItemForm({ ...newItemForm, costPerUnit: parseFloat(e.target.value) || 100 })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Primary Vendor Name</label>
                  <input
                    type="text"
                    placeholder="e.g. Kalyan Dairy"
                    value={newItemForm.vendorName}
                    onChange={e => setNewItemForm({ ...newItemForm, vendorName: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Vendor WhatsApp Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9822334455"
                    value={newItemForm.vendorPhone}
                    onChange={e => setNewItemForm({ ...newItemForm, vendorPhone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddItemModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Save to Inventory
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
