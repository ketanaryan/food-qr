"use client";

import React, { useState, useEffect } from "react";
import { 
  Boxes, Plus, AlertTriangle, ArrowDownRight, ArrowUpRight, 
  Search, Download, Trash2, Edit3, MessageCircle, RefreshCw, 
  Layers, CheckCircle2, DollarSign, PackageOpen, Sparkles, Filter,
  FileText, Users, Calculator, CreditCard, ChevronRight, Check,
  ShoppingCart, Send, ChefHat, Truck, ArrowRight, Eye, CheckSquare, Square, Clock, X, Building2, MapPin
} from "lucide-react";
import toast from "react-hot-toast";
import { openWhatsApp } from "@/lib/whatsapp";
import {
  PurchaseOrder,
  SubRecipePrep,
  MultiStageRecipe,
  InternalTransfer,
  DEFAULT_PURCHASE_ORDERS,
  DEFAULT_SUB_RECIPES,
  DEFAULT_MULTI_STAGE_RECIPES,
  DEFAULT_INTERNAL_TRANSFERS
} from "@/lib/inventoryTypes";

export interface InventoryItem {
  id: string;
  name: string;
  category: "Dairy" | "Grocery" | "Vegetables" | "Fruits" | "Beverages" | "Packaging" | "Spices" | "Bakery";
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

// Initial realistic default inventory for Hotel Marquis
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
    name: "Green Bell Pepper (Capsicum)",
    category: "Vegetables",
    currentStock: 5.0,
    unit: "kg",
    minAlertStock: 8.0,
    costPerUnit: 65,
    vendorName: "Parthiv Agency",
    vendorPhone: "9890123456",
    lastUpdated: "Today, 08:00 AM"
  },
  {
    id: "inv-mango",
    name: "Fresh Alphonso Mango Pulp",
    category: "Fruits",
    currentStock: 10.0,
    unit: "kg",
    minAlertStock: 4.0,
    costPerUnit: 220,
    vendorName: "Nashik Mandi Direct",
    vendorPhone: "9422778899",
    lastUpdated: "Yesterday"
  },
  {
    id: "inv-wheat",
    name: "Whole Wheat Flour (Atta)",
    category: "Grocery",
    currentStock: 45.0,
    unit: "kg",
    minAlertStock: 15.0,
    costPerUnit: 42,
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    lastUpdated: "3 days ago"
  },
  {
    id: "inv-pizza-base",
    name: "Artisanal Pizza Base (8-inch)",
    category: "Bakery",
    currentStock: 24,
    unit: "Pcs",
    minAlertStock: 15,
    costPerUnit: 22,
    vendorName: "Golden Bakery",
    vendorPhone: "9765432100",
    lastUpdated: "Today, 09:00 AM"
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
    invoiceNo: "INV-PA-89",
    vendorName: "Parthiv Agency",
    vendorPhone: "9890123456",
    date: "Today, 07:45 AM",
    itemsSummary: "Green Bell Pepper (Capsicum 20kg), Broccoli (5kg)",
    totalAmount: 2600,
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
    name: "Parthiv Agency",
    category: "Fresh Capsicum, Broccoli & Herbs",
    phone: "9890123456",
    totalPurchased: 18400,
    totalPaid: 15800,
    pendingDue: 2600,
    lastPaymentDate: "3 days ago"
  },
  {
    id: "v-radhe",
    name: "Radhe Dairy",
    category: "Cottage Cheese, Malai Paneer & Cow Ghee",
    phone: "9822114477",
    totalPurchased: 19800,
    totalPaid: 17127,
    pendingDue: 2673,
    lastPaymentDate: "Yesterday"
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
    itemName: "Green Bell Pepper (Capsicum)",
    unit: "kg",
    openingStock: 8.0,
    inwardToday: 5.0,
    consumedSales: 7.8,
    wastage: 0.2,
    expectedClosing: 5.0,
    physicalClosing: 5.0,
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
    itemName: "Green Bell Pepper (Capsicum)",
    type: "INWARD",
    quantity: 15,
    unit: "kg",
    notes: "Morning delivery from Parthiv Agency",
    cost: 975,
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
    menuItem: "Shahi Veg Dum Biryani",
    category: "Biryani & Rice",
    ingredients: [
      { name: "Rich Cashew Nut Kernels (Kaju)", qty: 50, unit: "Grams" },
      { name: "India Gate Basmati Rice", qty: 200, unit: "Grams" },
      { name: "Green Bell Pepper (Capsicum)", qty: 60, unit: "Grams" },
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
  const [purchaseOrders, setPurchaseOrders] = useState<PurchaseOrder[]>([]);
  const [subRecipes, setSubRecipes] = useState<SubRecipePrep[]>([]);
  const [multiStageRecipes, setMultiStageRecipes] = useState<MultiStageRecipe[]>([]);
  const [internalTransfers, setInternalTransfers] = useState<InternalTransfer[]>([]);

  // Navigation tab state
  const [activeTab, setActiveTab] = useState<"stocks" | "po" | "multistage" | "recipes" | "transfers" | "inward" | "vendors" | "audit" | "logs">("stocks");
  const [categoryFilter, setCategoryFilter] = useState<string>("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [showLowStockOnly, setShowLowStockOnly] = useState(false);
  const [outletFilter, setOutletFilter] = useState<string>("All Outlets / Sections");

  // Petpooja Quick Reorder state (Screenshot 1 Right)
  const [isReorderModalOpen, setIsReorderModalOpen] = useState(false);
  const [selectedReorderItem, setSelectedReorderItem] = useState<InventoryItem | null>(null);
  const [reorderQty, setReorderQty] = useState("12");
  const [reorderUnit, setReorderUnit] = useState("kg");
  const [reorderPrice, setReorderPrice] = useState("2280");

  // Petpooja Raise PO state (Screenshot 2 Right)
  const [isPOModalOpen, setIsPOModalOpen] = useState(false);
  const [poForm, setPoForm] = useState({
    vendorName: "Parthiv Agency",
    vendorPhone: "9890123456",
    itemName: "Green Bell Pepper (Capsicum)",
    qty: "12",
    unit: "Kg",
    estimatedPrice: "65",
    outlet: "Central Kitchen / Main Store",
    notes: ""
  });

  // Petpooja Sub-Recipe Conversion state (Screenshot 2 Left)
  const [isConvertModalOpen, setIsConvertModalOpen] = useState(false);
  const [selectedSubRecipe, setSelectedSubRecipe] = useState<SubRecipePrep | null>(null);
  const [batchMultiplier, setBatchMultiplier] = useState(1);

  // Petpooja Internal Transfer state (Screenshot 1 Left)
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);
  const [transferForm, setTransferForm] = useState({
    fromOutlet: "Central Kitchen / Main Store",
    toOutlet: "Banquet Hall Pantry",
    item: "Amul Malai Paneer",
    qty: "10",
    unit: "Kg",
    notes: "Banquet dinner buffet preparation"
  });

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
          if (Array.isArray(data.store.purchaseOrders)) {
            setPurchaseOrders(data.store.purchaseOrders);
            localStorage.setItem("hwb_inventory_purchase_orders", JSON.stringify(data.store.purchaseOrders));
          }
          if (Array.isArray(data.store.subRecipes)) {
            setSubRecipes(data.store.subRecipes);
            localStorage.setItem("hwb_inventory_sub_recipes", JSON.stringify(data.store.subRecipes));
          }
          if (Array.isArray(data.store.multiStageRecipes)) {
            setMultiStageRecipes(data.store.multiStageRecipes);
            localStorage.setItem("hwb_inventory_multistage_recipes", JSON.stringify(data.store.multiStageRecipes));
          }
          if (Array.isArray(data.store.internalTransfers)) {
            setInternalTransfers(data.store.internalTransfers);
            localStorage.setItem("hwb_inventory_internal_transfers", JSON.stringify(data.store.internalTransfers));
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
    const savedPOs = localStorage.getItem("hwb_inventory_purchase_orders");
    const savedSub = localStorage.getItem("hwb_inventory_sub_recipes");
    const savedMulti = localStorage.getItem("hwb_inventory_multistage_recipes");
    const savedTrans = localStorage.getItem("hwb_inventory_internal_transfers");

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

    if (savedPOs) try { setPurchaseOrders(JSON.parse(savedPOs)); } catch { setPurchaseOrders(DEFAULT_PURCHASE_ORDERS); }
    else setPurchaseOrders(DEFAULT_PURCHASE_ORDERS);

    if (savedSub) try { setSubRecipes(JSON.parse(savedSub)); } catch { setSubRecipes(DEFAULT_SUB_RECIPES); }
    else setSubRecipes(DEFAULT_SUB_RECIPES);

    if (savedMulti) try { setMultiStageRecipes(JSON.parse(savedMulti)); } catch { setMultiStageRecipes(DEFAULT_MULTI_STAGE_RECIPES); }
    else setMultiStageRecipes(DEFAULT_MULTI_STAGE_RECIPES);

    if (savedTrans) try { setInternalTransfers(JSON.parse(savedTrans)); } catch { setInternalTransfers(DEFAULT_INTERNAL_TRANSFERS); }
    else setInternalTransfers(DEFAULT_INTERNAL_TRANSFERS);

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

  const savePurchaseOrders = (updated: PurchaseOrder[]) => {
    setPurchaseOrders(updated);
    localStorage.setItem("hwb_inventory_purchase_orders", JSON.stringify(updated));
  };

  const saveSubRecipes = (updated: SubRecipePrep[]) => {
    setSubRecipes(updated);
    localStorage.setItem("hwb_inventory_sub_recipes", JSON.stringify(updated));
  };

  const saveMultiStageRecipes = (updated: MultiStageRecipe[]) => {
    setMultiStageRecipes(updated);
    localStorage.setItem("hwb_inventory_multistage_recipes", JSON.stringify(updated));
  };

  const saveInternalTransfers = (updated: InternalTransfer[]) => {
    setInternalTransfers(updated);
    localStorage.setItem("hwb_inventory_internal_transfers", JSON.stringify(updated));
  };

  // Open Petpooja Quick Reorder Modal (Screenshot 1 Right)
  const handleOpenReorder = (item: InventoryItem) => {
    setSelectedReorderItem(item);
    setReorderQty("12");
    setReorderUnit(item.unit || "kg");
    setReorderPrice(String(item.costPerUnit * 12));
    setIsReorderModalOpen(true);
  };

  // Submit Petpooja Quick Reorder
  const handleReorderSubmit = (sendWhatsApp: boolean = true) => {
    if (!selectedReorderItem) return;
    const qty = parseFloat(reorderQty);
    if (isNaN(qty) || qty <= 0) return toast.error("Enter valid quantity");
    const price = parseFloat(reorderPrice) || (selectedReorderItem.costPerUnit * qty);
    const poNum = `PO${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const newPO: PurchaseOrder = {
      id: "po-" + Date.now(),
      poNumber: poNum,
      vendorName: selectedReorderItem.vendorName || "Parthiv Agency",
      vendorPhone: selectedReorderItem.vendorPhone || "9890123456",
      itemName: selectedReorderItem.name,
      qty,
      unit: reorderUnit,
      currentStockAtOrder: selectedReorderItem.currentStock,
      estimatedPrice: selectedReorderItem.costPerUnit,
      totalAmount: price,
      status: sendWhatsApp ? "Processed" : "Saved",
      createdAt: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      outlet: "Central Kitchen / Main Store",
      notes: "Quick reorder via Petpooja low stock alert"
    };

    savePurchaseOrders([newPO, ...purchaseOrders]);
    postServerAction("RAISE_PURCHASE_ORDER", newPO);

    if (sendWhatsApp) {
      const waMsg = [
        `*HOTEL MARQUIS - PURCHASE ORDER #${newPO.poNumber}* 📦`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `Namaste *${newPO.vendorName}*,`,
        `Please supply the following urgent stock replenishment:`,
        ``,
        `🛒 *Item:* ${newPO.itemName}`,
        `⚖️ *Order Qty:* ${newPO.qty} ${newPO.unit}`,
        `💰 *Estimated Value:* ₹${newPO.totalAmount}`,
        `📍 *Delivery Location:* Hotel Marquis, Sula Vineyard Road, Nashik`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `_Generated via Hotel Marquis Petpooja ERP Desk_`
      ].join('\n');
      openWhatsApp(newPO.vendorPhone, waMsg);
    }

    setIsReorderModalOpen(false);
    toast.success(`Purchase Order #${poNum} created for ${newPO.itemName}!`);
  };

  // Submit Raise PO Modal (Screenshot 2 Right)
  const handleRaisePOSubmit = (sendWhatsApp: boolean = false) => {
    const qty = parseFloat(poForm.qty);
    if (isNaN(qty) || qty <= 0) return toast.error("Enter valid quantity");
    const rate = parseFloat(poForm.estimatedPrice) || 65;
    const total = Number((qty * rate).toFixed(2));
    const poNum = `PO${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

    const targetItem = items.find(i => i.name.toLowerCase().includes(poForm.itemName.toLowerCase()));

    const newPO: PurchaseOrder = {
      id: "po-" + Date.now(),
      poNumber: poNum,
      vendorName: poForm.vendorName,
      vendorPhone: poForm.vendorPhone || (targetItem ? targetItem.vendorPhone : "9890123456"),
      itemName: poForm.itemName,
      qty,
      unit: poForm.unit,
      currentStockAtOrder: targetItem ? targetItem.currentStock : 0,
      estimatedPrice: rate,
      totalAmount: total,
      status: sendWhatsApp ? "Processed" : "Saved",
      createdAt: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      outlet: poForm.outlet,
      notes: poForm.notes
    };

    savePurchaseOrders([newPO, ...purchaseOrders]);
    postServerAction("RAISE_PURCHASE_ORDER", newPO);

    if (sendWhatsApp) {
      const waMsg = [
        `*HOTEL MARQUIS - PURCHASE ORDER #${newPO.poNumber}* 📦`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `Namaste *${newPO.vendorName}*,`,
        `Please confirm supply for:`,
        `🛒 *${newPO.itemName}* - ${newPO.qty} ${newPO.unit}`,
        `💰 *Estimated Total:* ₹${newPO.totalAmount}`,
        `🏢 *Outlet / Section:* ${newPO.outlet}`,
        `━━━━━━━━━━━━━━━━━━━━`,
        `_Hotel Marquis Central Kitchen Procurement_`
      ].join('\n');
      openWhatsApp(newPO.vendorPhone, waMsg);
    }

    setIsPOModalOpen(false);
    toast.success(`PO #${newPO.poNumber} (${newPO.status}) saved successfully!`);
  };

  // Receive PO & Convert to GRN
  const handleReceivePO = (po: PurchaseOrder) => {
    const updated = purchaseOrders.map(p => p.id === po.id ? { ...p, status: "Received" as const } : p);
    savePurchaseOrders(updated);

    // Update raw inventory item stock
    const itemTarget = items.find(i => i.name.toLowerCase().includes(po.itemName.toLowerCase()));
    if (itemTarget) {
      const updatedItems = items.map(i => i.id === itemTarget.id ? {
        ...i,
        currentStock: Number((i.currentStock + po.qty).toFixed(2)),
        costPerUnit: po.estimatedPrice || i.costPerUnit,
        lastUpdated: "PO #" + po.poNumber
      } : i);
      saveItems(updatedItems);
    }

    postServerAction("UPDATE_PO_STATUS", { poId: po.id, status: "Received" });
    toast.success(`PO #${po.poNumber} received & added to live inventory!`);
  };

  // Sub-recipe batch conversion (Screenshot 2 Left: [ Convert ])
  const handleConvertSubRecipe = (subRecipe: SubRecipePrep, multiplier: number) => {
    const mult = Math.max(1, multiplier);
    const batchYield = (subRecipe.outputYield || 500) * mult;

    // Deduct raw materials
    let updatedItems = [...items];
    for (const mat of subRecipe.materials) {
      const needed = mat.qty * mult;
      const deduction = mat.unit.toLowerCase() === "gms" || mat.unit.toLowerCase() === "ml" ? needed / 1000 : needed;
      updatedItems = updatedItems.map(i => {
        if (i.name.toLowerCase().includes(mat.materialName.toLowerCase())) {
          return {
            ...i,
            currentStock: Math.max(0, Number((i.currentStock - deduction).toFixed(2))),
            lastUpdated: "Batch Converted"
          };
        }
        return i;
      });
    }
    saveItems(updatedItems);

    // Increment sub-recipe stock
    const updatedSub = subRecipes.map(s => s.id === subRecipe.id ? {
      ...s,
      currentStock: Number(((s.currentStock || 0) + batchYield).toFixed(1)),
      lastConverted: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    } : s);
    saveSubRecipes(updatedSub);

    postServerAction("CONVERT_SUB_RECIPE_BATCH", { subRecipeId: subRecipe.id, batchMultiplier: mult });
    setIsConvertModalOpen(false);
    toast.success(`Successfully converted ${batchYield}${subRecipe.yieldUnit} of ${subRecipe.name}!`);
  };

  // Internal Transfer Submit (Screenshot 1 Left)
  const handleTransferSubmit = () => {
    const qty = parseFloat(transferForm.qty);
    if (isNaN(qty) || qty <= 0) return toast.error("Enter valid transfer quantity");

    const reqNo = `P0${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;
    const newTr: InternalTransfer = {
      id: "tr-" + Date.now(),
      reqNo,
      fromOutlet: transferForm.fromOutlet,
      toOutlet: transferForm.toOutlet,
      item: transferForm.item,
      qty,
      unit: transferForm.unit,
      status: "Saved",
      date: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      notes: transferForm.notes
    };

    saveInternalTransfers([newTr, ...internalTransfers]);
    postServerAction("CREATE_INTERNAL_TRANSFER", newTr);
    setIsTransferModalOpen(false);
    toast.success(`Transfer Request #${reqNo} to ${newTr.toOutlet} logged!`);
  };

  // Toggle Auto Convert in Multi-Stage Recipe
  const handleToggleAutoConvert = (recipeId: string) => {
    const updated = multiStageRecipes.map(m => m.id === recipeId ? { ...m, autoConvert: !m.autoConvert } : m);
    saveMultiStageRecipes(updated);
    const target = updated.find(m => m.id === recipeId);
    if (target) {
      postServerAction("SAVE_MULTI_STAGE_RECIPE", { recipe: target });
      toast.success(`${target.conversionName} auto-convert ${target.autoConvert ? 'enabled' : 'disabled'}`);
    }
  };

  // Top KPI calculations
  const totalValuation = items.reduce((acc, item) => acc + (item.currentStock * item.costPerUnit), 0);
  const totalInwardMonth = purchases.reduce((acc, p) => acc + p.totalAmount, 0);
  const totalAccountsPayable = vendors.reduce((acc, v) => acc + v.pendingDue, 0);
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
    const msg = `🧾 *VENDOR ACCOUNT STATEMENT - HOTEL MARQUIS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Vendor:* ${v.name}\n` +
      `*Category:* ${v.category}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Total Invoiced:* ₹${v.totalPurchased.toLocaleString("en-IN")}\n` +
      `*Total Paid:* ₹${v.totalPaid.toLocaleString("en-IN")}\n` +
      `*Outstanding Balance (Payables):* ₹${v.pendingDue.toLocaleString("en-IN")}\n` +
      `*Last Settlement:* ${v.lastPaymentDate}\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Regards,\nHotel Marquis Management.`;

    openWhatsApp(cleanPhone || "7499934257", msg);
    toast.success(`Opening WhatsApp statement for ${v.name}`);
  };

  // WhatsApp Vendor Purchase Order Re-order
  const handleWhatsAppReorder = (item: InventoryItem) => {
    const requiredRefill = Math.max(item.minAlertStock * 2, 5);
    const phone = item.vendorPhone.replace(/\D/g, "");
    
    const message = `📦 *PURCHASE ORDER - HOTEL MARQUIS*\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `*Item:* ${item.name} (${item.category})\n` +
      `*Required Quantity:* ${requiredRefill} ${item.unit}\n` +
      `*Current Stock Status:* ${item.currentStock} ${item.unit} (Below Par Level ⚠️)\n` +
      `━━━━━━━━━━━━━━━━━━━━\n` +
      `Delivery Address: Hotel Marquis Main Kitchen.\n` +
      `Please acknowledge and deliver at earliest.\n\n` +
      `Regards,\nHotel Marquis Purchase Desk`;

    openWhatsApp(phone || "7499934257", message);
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
    link.setAttribute("download", `Hotel_Marquis_Inventory_Audit_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inventory Audit Report downloaded as CSV!");
  };

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-slate-900 text-white rounded-xl shadow-xs">
              <Boxes size={24} />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                  Inventory & Stock Management
                </h1>
                <span className="text-[11px] bg-slate-100 text-slate-700 font-semibold px-2.5 py-0.5 rounded-md border border-slate-200 uppercase tracking-wide">
                  Petpooja ERP Standard
                </span>
              </div>
              <p className="text-xs sm:text-sm text-slate-500 mt-0.5">
                Raw material master, purchase orders, goods received notes (GRN), supplier payables & live recipe depletion
              </p>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                <span className="inline-flex items-center gap-1.5 text-xs font-medium px-2.5 py-1 rounded-md bg-emerald-50 text-emerald-800 border border-emerald-200">
                  <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
                  Live Recipe Deduction Active (POS & KDS Linked)
                </span>
                <button
                  onClick={fetchServerInventory}
                  disabled={isSyncing}
                  className="inline-flex items-center gap-1.5 text-xs font-medium text-slate-700 hover:text-slate-900 bg-white border border-slate-200 px-2.5 py-1 rounded-md hover:bg-slate-50 transition shadow-2xs"
                  title="Force re-sync with server"
                >
                  <RefreshCw size={12} className={isSyncing ? "animate-spin text-slate-600" : "text-slate-500"} />
                  {isSyncing ? "Syncing..." : "Sync Stock"}
                </button>
                <span className="text-[11px] text-slate-400 font-mono">Last sync: {lastServerSync}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons Toolbar */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={() => setIsNewInvoiceModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
          >
            <FileText size={15} /> + Record GRN / Inward
          </button>

          <button
            onClick={() => setIsAddItemModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <Plus size={15} /> + Add Material
          </button>

          <button
            onClick={() => setIsInwardModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <ArrowDownRight size={15} className="text-emerald-600" /> Quick Refill
          </button>

          <button
            onClick={() => setIsWastageModalOpen(true)}
            className="flex items-center gap-1.5 px-3.5 py-2 bg-white hover:bg-rose-50 text-rose-700 border border-rose-200 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95"
          >
            <ArrowUpRight size={15} className="text-rose-600" /> Log Wastage
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2 bg-white hover:bg-slate-50 text-slate-700 border border-slate-300 rounded-lg text-xs font-semibold shadow-2xs transition active:scale-95"
            title="Export CSV Audit"
          >
            <Download size={16} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid - Enterprise Petpooja Standard */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3.5">
        {/* Total Stock Value */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Stock Valuation</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
              <DollarSign size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            ₹{totalValuation.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500">Live storage inventory value</p>
        </div>

        {/* Monthly Purchases (Inward / GRN) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Purchases / GRN (Month)</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
              <ArrowDownRight size={15} className="text-emerald-600" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            ₹{totalInwardMonth.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500">{purchases.length} Inward Delivery Invoices</p>
        </div>

        {/* Accounts Payable (Outstanding Supplier Dues) */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Accounts Payable</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
              <CreditCard size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            ₹{totalAccountsPayable.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <div className="flex items-center justify-between">
            <p className="text-[11px] text-slate-500">Pending supplier dues</p>
            {totalAccountsPayable > 0 && (
              <span className="text-[10px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded border border-amber-200">
                Action Due
              </span>
            )}
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Low Stock Alerts</span>
            <div className={`p-1.5 rounded-md ${lowStockItems.length > 0 ? "bg-amber-100 text-amber-800" : "bg-slate-100 text-slate-600"}`}>
              <AlertTriangle size={15} />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            {lowStockItems.length} <span className="text-sm font-normal text-slate-500">Items</span>
          </div>
          <p className="text-[11px] text-slate-500">
            {lowStockItems.length > 0 ? "Below minimum par level" : "All materials optimal"}
          </p>
        </div>

        {/* Kitchen Wastage */}
        <div className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-1">
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Kitchen Wastage</span>
            <div className="p-1.5 bg-slate-100 text-slate-600 rounded-md">
              <ArrowUpRight size={15} className="text-rose-600" />
            </div>
          </div>
          <div className="text-2xl font-bold tracking-tight text-slate-900 font-mono">
            ₹{totalWastageLoss.toLocaleString("en-IN", { maximumFractionDigits: 0 })}
          </div>
          <p className="text-[11px] text-slate-500">Recorded food spoilage loss</p>
        </div>
      </div>

      {/* Main Navigation Tabs - Petpooja ERP Standard */}
      <div className="flex items-center justify-between border-b border-slate-200 overflow-x-auto pb-px">
        <div className="flex gap-1.5 min-w-max">
          <button
            onClick={() => setActiveTab("stocks")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "stocks"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Boxes size={15} /> Raw Materials
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {items.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("po")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "po"
                ? "border-[#991b1b] text-[#991b1b]"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ShoppingCart size={15} /> Purchase Orders (PO)
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-amber-100 text-amber-800 font-bold">
              {purchaseOrders.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("multistage")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "multistage"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <ChefHat size={15} /> Multi-Stage Recipes
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {subRecipes.length + multiStageRecipes.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("recipes")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "recipes"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Sparkles size={15} /> Recipe BOM
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {SAMPLE_RECIPES.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("transfers")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "transfers"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Truck size={15} /> Central Kitchen Transfers
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {internalTransfers.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("inward")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "inward"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <FileText size={15} /> Goods Received (GRN)
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {purchases.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("vendors")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "vendors"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Users size={15} /> Vendor Payables Ledger
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {vendors.length}
            </span>
          </button>

          <button
            onClick={() => setActiveTab("audit")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "audit"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <Calculator size={15} /> Stock Audit & Variance
          </button>

          <button
            onClick={() => setActiveTab("logs")}
            className={`pb-3 px-3 font-semibold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "logs"
                ? "border-slate-900 text-slate-900"
                : "border-transparent text-slate-500 hover:text-slate-800"
            }`}
          >
            <RefreshCw size={15} /> Movement History
            <span className="font-mono text-[11px] px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
              {logs.length}
            </span>
          </button>
        </div>
      </div>

      {/* TAB 1: RAW MATERIALS STOCKS - Petpooja Standard */}
      {activeTab === "stocks" && (
        <div className="space-y-5">
          {/* Petpooja Low-Stock Critical Alert Banner (Screenshot 1 Right) */}
          {lowStockItems.length > 0 && (
            <div className="bg-amber-50/95 border-2 border-amber-300 rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 shadow-xs">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-amber-500 text-white flex items-center justify-center font-black text-xl shadow-2xs">
                  !
                </div>
                <div>
                  <div className="text-sm font-extrabold text-amber-950 flex items-center gap-2">
                    <span>Running low on stock! Re-stock soon.</span>
                    <span className="text-[11px] font-bold px-2.5 py-0.5 rounded-full bg-amber-200 text-amber-900 font-mono">
                      {lowStockItems.length} items
                    </span>
                  </div>
                  <p className="text-xs text-amber-800/90 mt-0.5">
                    Critical replenishment needed for: <span className="font-bold">{lowStockItems.map(i => i.name).slice(0, 3).join(", ")}</span>
                    {lowStockItems.length > 3 ? ` and ${lowStockItems.length - 3} others` : ""}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => handleOpenReorder(lowStockItems[0])}
                  className="px-4 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-xl text-xs font-bold transition shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <ShoppingCart size={14} /> Quick Re-Order Drawer
                </button>
              </div>
            </div>
          )}

          {/* Filters, Outlet Section & Search Bar */}
          <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3 bg-white p-3.5 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search raw material, vendor, category..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 focus:bg-white"
              />
            </div>

            <div className="flex flex-wrap items-center gap-2">
              {/* Outlet / Section Selector (Screenshot 1 Right) */}
              <div className="flex items-center gap-1.5 bg-gray-50 px-3 py-1.5 border border-gray-200 rounded-xl">
                <Building2 size={14} className="text-gray-500" />
                <span className="text-xs text-gray-500 font-medium">Outlet:</span>
                <select
                  value={outletFilter}
                  onChange={e => setOutletFilter(e.target.value)}
                  className="text-xs font-bold bg-transparent text-gray-900 focus:outline-none"
                >
                  <option value="All Outlets / Sections">Marquis Main Store</option>
                  <option value="Central Kitchen / Main Store">Central Kitchen</option>
                  <option value="Restaurant Line Kitchen">Line Kitchen</option>
                  <option value="Banquet Hall Pantry">Banquet Pantry</option>
                  <option value="Mocktail & Beverage Bar">Mocktail Bar</option>
                  <option value="Bakery Section">Bakery Counter</option>
                </select>
              </div>

              <select
                value={categoryFilter}
                onChange={e => setCategoryFilter(e.target.value)}
                className="text-xs font-bold py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700 focus:outline-none focus:ring-1 focus:ring-gray-900"
              >
                <option value="ALL">All Categories</option>
                <option value="Dairy">Dairy</option>
                <option value="Grocery">Grocery</option>
                <option value="Vegetables">Vegetables</option>
                <option value="Fruits">Fruits</option>
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
                  <th className="py-3.5 px-3 w-8 text-center"><CheckSquare size={14} className="text-gray-400" /></th>
                  <th className="py-3.5 px-4">Raw Material / Ingredient</th>
                  <th className="py-3.5 px-4">Category</th>
                  <th className="py-3.5 px-4 text-center">Current Stock</th>
                  <th className="py-3.5 px-4 text-center">Alert Par</th>
                  <th className="py-3.5 px-4 text-right">Cost Rate</th>
                  <th className="py-3.5 px-4 text-right">Valuation</th>
                  <th className="py-3.5 px-4 text-center">Status</th>
                  <th className="py-3.5 px-5 text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredItems.map(item => {
                  const isLow = item.currentStock <= item.minAlertStock;
                  const itemValue = item.currentStock * item.costPerUnit;

                  return (
                    <tr key={item.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-3 text-center">
                        <Square size={14} className="text-gray-300 hover:text-gray-600 cursor-pointer inline" />
                      </td>
                      <td className="py-4 px-4">
                        <div className="font-bold text-gray-900 flex items-center gap-1.5">
                          {item.name}
                          <button onClick={() => handleOpenReorder(item)} title="Quick View & Reorder" className="text-gray-400 hover:text-gray-700">
                            <Eye size={13} />
                          </button>
                        </div>
                        <div className="text-xs text-gray-400 mt-0.5">
                          Supplier: <span className="text-gray-600 font-medium">{item.vendorName}</span> ({item.vendorPhone})
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
                      <td className="py-4 px-4 text-center">
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
                          <button
                            onClick={() => handleOpenReorder(item)}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-lg transition active:scale-95 shadow-2xs"
                            title="Petpooja Re-Order Drawer"
                          >
                            <ShoppingCart size={13} /> Reorder
                          </button>
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

      {/* TAB: PURCHASE ORDER MANAGEMENT (Screenshot 2 Right) */}
      {activeTab === "po" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          {/* Header Banner */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ShoppingCart size={18} className="text-[#991b1b]" /> Purchase Order Management
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Raise & accept purchase order tickets directly from suppliers or central kitchen right from the dashboard.
              </p>
            </div>
            <button
              onClick={() => setIsPOModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-[#991b1b] hover:bg-[#7f1d1d] text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus size={15} /> + Raise New Purchase Order
            </button>
          </div>

          {/* PO Creation Card & Active Status Grid (matching Screenshot 2 Right) */}
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
            {/* Left Card: Quick Raise PO Card (matching Screenshot 2 Right) */}
            <div className="bg-[#fefce8]/60 p-5 rounded-2xl border border-amber-200 shadow-2xs space-y-4">
              <div className="flex items-center justify-between border-b border-amber-200 pb-2.5">
                <span className="text-xs font-extrabold text-amber-950 uppercase tracking-wider">
                  Quick PO Ticket
                </span>
                <span className="text-[11px] font-mono text-amber-800 font-bold bg-amber-100 px-2 py-0.5 rounded-md">
                  Express Supplier Dispatch
                </span>
              </div>

              <div className="space-y-3">
                <div>
                  <label className="block text-xs font-bold text-slate-700 mb-1">From Supplier</label>
                  <select
                    value={poForm.vendorName}
                    onChange={e => {
                      const v = vendors.find(vend => vend.name === e.target.value);
                      setPoForm({
                        ...poForm,
                        vendorName: e.target.value,
                        vendorPhone: v ? v.phone : poForm.vendorPhone
                      });
                    }}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name} ({v.phone})</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label className="text-xs font-bold text-slate-700">Item Name</label>
                    {(() => {
                      const target = items.find(i => i.name.toLowerCase().includes(poForm.itemName.toLowerCase()));
                      return target ? (
                        <span className="text-[11px] font-extrabold text-amber-700 font-mono">
                          Current Stock: {target.currentStock} {target.unit}
                        </span>
                      ) : null;
                    })()}
                  </div>
                  <select
                    value={poForm.itemName}
                    onChange={e => {
                      const item = items.find(i => i.name === e.target.value);
                      setPoForm({
                        ...poForm,
                        itemName: e.target.value,
                        unit: item ? item.unit : "Kg",
                        estimatedPrice: item ? String(item.costPerUnit) : "65"
                      });
                    }}
                    className="w-full text-xs font-bold p-2.5 bg-white border border-slate-300 rounded-xl focus:ring-2 focus:ring-slate-900"
                  >
                    {items.map(i => (
                      <option key={i.id} value={i.name}>{i.name} (Cur: {i.currentStock} {i.unit})</option>
                    ))}
                  </select>
                </div>

                <div className="grid grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Order Qty</label>
                    <input
                      type="number"
                      value={poForm.qty}
                      onChange={e => setPoForm({ ...poForm, qty: e.target.value })}
                      placeholder="12"
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block text-xs font-bold text-slate-700 mb-1">Unit</label>
                    <select
                      value={poForm.unit}
                      onChange={e => setPoForm({ ...poForm, unit: e.target.value })}
                      className="w-full text-xs font-bold p-2 bg-white border border-slate-300 rounded-xl"
                    >
                      <option value="Kg">Kg</option>
                      <option value="L">L</option>
                      <option value="Pcs">Pcs</option>
                      <option value="Grams">Grams</option>
                      <option value="Packets">Packets</option>
                    </select>
                  </div>
                </div>

                <div className="flex items-center justify-between p-2.5 bg-white rounded-xl border border-amber-200">
                  <span className="text-xs text-slate-600 font-medium">Estimated PO Total:</span>
                  <span className="text-sm font-extrabold text-slate-900 font-mono">
                    ₹{((parseFloat(poForm.qty) || 0) * (parseFloat(poForm.estimatedPrice) || 0)).toLocaleString("en-IN")}
                  </span>
                </div>

                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    onClick={() => handleRaisePOSubmit(false)}
                    className="flex-1 py-2.5 bg-white hover:bg-slate-50 text-slate-700 text-xs font-bold rounded-xl border border-slate-300 transition active:scale-95 shadow-2xs"
                  >
                    Save Draft
                  </button>
                  <button
                    type="button"
                    onClick={() => handleRaisePOSubmit(true)}
                    className="flex-1 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white text-xs font-bold rounded-xl transition active:scale-95 shadow-xs flex items-center justify-center gap-1.5"
                  >
                    <Send size={13} /> Send Request
                  </button>
                </div>
              </div>
            </div>

            {/* Right 2 Columns: Purchase Orders Master Table (Screenshot 2 Right) */}
            <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-4 border-b border-slate-200 flex items-center justify-between">
                  <div className="font-extrabold text-slate-900 text-sm flex items-center gap-2">
                    <FileText size={16} className="text-slate-600" />
                    <span>Purchase Orders Master Table</span>
                  </div>
                  <span className="text-xs text-slate-500 font-mono">
                    {purchaseOrders.length} Total Tickets
                  </span>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left text-sm">
                    <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                      <tr>
                        <th className="py-3 px-4">From (Supplier)</th>
                        <th className="py-3 px-3 font-mono">PO No.</th>
                        <th className="py-3 px-3">Item & Qty</th>
                        <th className="py-3 px-3 text-right">Total (₹)</th>
                        <th className="py-3 px-3 text-center">Status</th>
                        <th className="py-3 px-4 text-right">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-100">
                      {purchaseOrders.map(po => {
                        const isSaved = po.status === "Saved";
                        const isProcessed = po.status === "Processed";
                        const isReceived = po.status === "Received";

                        return (
                          <tr key={po.id} className="hover:bg-slate-50/70 transition">
                            <td className="py-3 px-4">
                              <div className="font-bold text-slate-900">{po.vendorName}</div>
                              <div className="text-[11px] text-slate-400">{po.outlet || "Central Kitchen"}</div>
                            </td>
                            <td className="py-3 px-3 font-mono font-bold text-slate-700 text-xs">
                              {po.poNumber}
                            </td>
                            <td className="py-3 px-3">
                              <div className="font-semibold text-xs text-slate-800">{po.itemName}</div>
                              <div className="text-[11px] text-slate-500">{po.qty} {po.unit}</div>
                            </td>
                            <td className="py-3 px-3 text-right font-extrabold text-slate-900 font-mono">
                              ₹{po.totalAmount.toLocaleString("en-IN")}
                            </td>
                            <td className="py-3 px-3 text-center">
                              {isSaved && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-amber-50 text-amber-800 border border-amber-300">
                                  Saved
                                </span>
                              )}
                              {isProcessed && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-teal-50 text-teal-800 border border-teal-300">
                                  Processed
                                </span>
                              )}
                              {isReceived && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-bold bg-emerald-50 text-emerald-800 border border-emerald-300">
                                  Received
                                </span>
                              )}
                            </td>
                            <td className="py-3 px-4 text-right">
                              <div className="flex items-center justify-end gap-1.5">
                                {po.status !== "Received" && (
                                  <button
                                    onClick={() => handleReceivePO(po)}
                                    className="px-2.5 py-1 bg-emerald-600 hover:bg-emerald-700 text-white rounded-md text-xs font-bold transition shadow-2xs"
                                    title="Receive stock & convert to GRN"
                                  >
                                    Receive Stock
                                  </button>
                                )}
                                <button
                                  onClick={() => {
                                    const msg = `*HOTEL MARQUIS - PO #${po.poNumber}*\nNamaste ${po.vendorName}, please dispatch ${po.itemName} (${po.qty} ${po.unit}) Total: ₹${po.totalAmount}`;
                                    openWhatsApp(po.vendorPhone, msg);
                                  }}
                                  className="p-1.5 bg-[#25D366] text-white rounded-md hover:bg-[#1ebd5b] transition"
                                  title="WhatsApp Supplier"
                                >
                                  <MessageCircle size={14} />
                                </button>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB: MULTI-STAGE RECIPE MANAGEMENT (Screenshot 2 Left) */}
      {activeTab === "multistage" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <ChefHat size={18} className="text-slate-800" /> Multi-Stage Recipe Management (BOM & Pre-Preps)
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Automatically deduct stock when dishes are ordered. Convert base gravies and semi-finished preps, and manage multi-stage consumption.
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={() => {
                  if (subRecipes.length > 0) {
                    setSelectedSubRecipe(subRecipes[0]);
                    setBatchMultiplier(1);
                    setIsConvertModalOpen(true);
                  }
                }}
                className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
              >
                <Plus size={15} /> + Convert Pre-Prep Batch
              </button>
            </div>
          </div>

          {/* Two Side-by-Side Cards (matching Screenshot 2 Left) */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Card 1: Sub-Recipe / Pre-Prep (e.g. Tomato Sauce) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base flex items-center gap-2">
                    {subRecipes[0]?.name || "Tomato Sauce / Base Gravy"}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Semi-finished Kitchen Prep • Ready in Pantry: <span className="font-bold text-slate-900 font-mono">{subRecipes[0]?.currentStock || 4500} {subRecipes[0]?.yieldUnit || 'gms'}</span>
                  </span>
                </div>
                <button
                  onClick={() => toast.success("Sub-recipe templates active")}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800"
                >
                  + Add New
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Material</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {(subRecipes[0]?.materials || [
                      { materialName: "Farm Fresh Tomatoes", qty: 475, unit: "gms" },
                      { materialName: "Onions & Garlic Pods", qty: 25, unit: "gms" },
                      { materialName: "Refined Sunflower Cooking Oil", qty: 14, unit: "gms" }
                    ]).map((mat, idx) => (
                      <tr key={idx} className="hover:bg-slate-50/50">
                        <td className="py-2 px-3 font-semibold text-slate-800">{mat.materialName}</td>
                        <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">{mat.qty}</td>
                        <td className="py-2 px-3 text-right text-slate-500">{mat.unit}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs text-slate-400 font-mono">
                  Last Batch: {subRecipes[0]?.lastConverted || "Today, 07:30 AM"}
                </span>
                <button
                  onClick={() => {
                    if (subRecipes[0]) {
                      setSelectedSubRecipe(subRecipes[0]);
                      setBatchMultiplier(1);
                      setIsConvertModalOpen(true);
                    }
                  }}
                  className="px-4 py-2 bg-slate-900 hover:bg-black text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5 active:scale-95"
                >
                  <RefreshCw size={13} /> Convert / Cook Batch
                </button>
              </div>
            </div>

            {/* Card 2: Final Dish Multi-Stage Recipe (e.g. Margherita Pizza) */}
            <div className="bg-white p-5 rounded-2xl border border-slate-200 shadow-sm space-y-4">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div>
                  <h4 className="font-extrabold text-slate-900 text-base">
                    {multiStageRecipes[0]?.conversionName || "Margherita Pizza"}
                  </h4>
                  <span className="text-xs text-slate-500">
                    Assembled Menu Item • Category: {multiStageRecipes[0]?.category || "Pizzas"}
                  </span>
                </div>
                <button
                  onClick={() => toast.success("Multi-stage dish templates active")}
                  className="text-xs font-bold text-rose-700 hover:text-rose-800"
                >
                  + Add New
                </button>
              </div>

              <div className="border border-slate-100 rounded-xl overflow-hidden">
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">Material / Sub-Prep</th>
                      <th className="py-2.5 px-3 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Unit</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="bg-amber-50/40">
                      <td className="py-2 px-3 font-semibold text-amber-900">
                        Tomato Sauce (Sub-Recipe Prep)
                      </td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">525</td>
                      <td className="py-2 px-3 text-right text-slate-500">gms</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">Artisanal Pizza Base (8-inch)</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">255</td>
                      <td className="py-2 px-3 text-right text-slate-500">gms</td>
                    </tr>
                    <tr>
                      <td className="py-2 px-3 font-semibold text-slate-800">Mozzarella Pizza Cheese</td>
                      <td className="py-2 px-3 text-center font-mono font-bold text-slate-900">350</td>
                      <td className="py-2 px-3 text-right text-slate-500">gms</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="flex items-center justify-between pt-1">
                <span className="text-xs font-bold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md border border-emerald-200">
                  Ready to serve on POS punch
                </span>
                <span className="text-xs font-bold text-slate-600">
                  Deducts automatically upon KOT
                </span>
              </div>
            </div>
          </div>

          {/* Multi-Stage Recipe Master Register Table (matching Screenshot 2 Left) */}
          <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-slate-200 flex items-center justify-between">
              <span className="font-extrabold text-slate-900 text-sm">
                Multi-Stage Recipe Master Register
              </span>
              <span className="text-xs text-slate-500 font-mono">
                {multiStageRecipes.length} Active Conversions
              </span>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs font-bold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">Conversion Name</th>
                  <th className="py-3 px-4">Category</th>
                  <th className="py-3 px-4">Pre-Prep Component</th>
                  <th className="py-3 px-4 text-center">Auto Convert</th>
                  <th className="py-3 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {multiStageRecipes.map(recipe => (
                  <tr key={recipe.id} className="hover:bg-slate-50/70 transition">
                    <td className="py-3.5 px-4 font-bold text-slate-900">
                      {recipe.conversionName}
                    </td>
                    <td className="py-3.5 px-4 text-xs">
                      <span className="px-2 py-0.5 bg-slate-100 text-slate-700 rounded-md font-semibold">
                        {recipe.category}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-700">
                      {recipe.subRecipes.map(s => `${s.subRecipeName} (${s.qty}${s.unit})`).join(', ') || 'Direct Raw'}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      <button
                        onClick={() => handleToggleAutoConvert(recipe.id)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-full text-xs font-extrabold transition ${
                          recipe.autoConvert 
                            ? "bg-emerald-100 text-emerald-800 border border-emerald-300"
                            : "bg-slate-100 text-slate-500 border border-slate-200"
                        }`}
                      >
                        {recipe.autoConvert ? <Check size={12} /> : null}
                        {recipe.autoConvert ? "Active" : "Manual"}
                      </button>
                    </td>
                    <td className="py-3.5 px-4 text-right">
                      <button
                        onClick={() => toast.success(`Viewing ${recipe.conversionName} conversion map`)}
                        className="px-3 py-1 bg-white hover:bg-slate-50 text-slate-700 rounded-lg text-xs font-bold border border-slate-200 transition"
                      >
                        Edit
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB: CENTRAL KITCHEN & INTERNAL TRANSFERS (Screenshot 1 Left) */}
      {activeTab === "transfers" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <Truck size={18} className="text-slate-800" /> Central Kitchen Module & Section Routing
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Manage stock transfers from Central Kitchen / Main Store to restaurant sections, banquets, and satellite outlets.
              </p>
            </div>
            <button
              onClick={() => setIsTransferModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-black text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus size={15} /> + Request Internal Transfer
            </button>
          </div>

          {/* Central Kitchen Routing Cards / Nodes (Screenshot 1 Left) */}
          <div className="bg-slate-900 text-white p-5 rounded-2xl shadow-sm space-y-4">
            <div className="flex items-center justify-between border-b border-slate-800 pb-2">
              <span className="text-xs font-extrabold uppercase tracking-wider text-slate-400">
                Central Kitchen Supply Hub
              </span>
              <span className="text-xs font-mono text-emerald-400 font-bold bg-emerald-950/80 px-2.5 py-0.5 rounded-full border border-emerald-800">
                ● Live Dispatch Network
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { name: "Central Kitchen", tag: "Main Hub", count: items.length },
                { name: "Line Kitchen", tag: "Ground Floor", count: 24 },
                { name: "Banquet Pantry", tag: "1st Floor", count: 18 },
                { name: "Mocktail Bar", tag: "Beverages", count: 12 },
                { name: "Bakery Counter", tag: "Desserts", count: 8 },
                { name: "Vastrapur Outlet", tag: "Satellite", count: 14 }
              ].map((hub, idx) => (
                <div key={idx} className="bg-slate-800/80 p-3 rounded-xl border border-slate-700/80 text-center space-y-1">
                  <div className="text-xs font-bold text-slate-200">{hub.name}</div>
                  <div className="text-[10px] text-slate-400">{hub.tag}</div>
                  <div className="text-sm font-extrabold text-amber-400 font-mono">{hub.count} items</div>
                </div>
              ))}
            </div>
          </div>

          {/* Two Tables matching Screenshot 1 Left */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
            {/* Table 1: Outlet Purchase Order Demands (Screenshot 1 Left) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Outlet Purchase Order Demands
                  </span>
                  <span className="text-[11px] font-mono text-slate-500">2 Requests</span>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">To Outlet</th>
                      <th className="py-2.5 px-2 font-mono">Req. No</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Vastrapur Outlet</td>
                      <td className="py-2.5 px-2 font-mono text-slate-600 font-bold">P0324G</td>
                      <td className="py-2.5 px-3 text-slate-800">Fresh Alphonso Mango Pulp</td>
                      <td className="py-2.5 px-2 text-center font-bold font-mono">10 kg</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-amber-50 text-amber-800 border border-amber-300">
                          Saved
                        </span>
                      </td>
                    </tr>
                    <tr className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3 font-semibold text-slate-900">Makaraba Outlet</td>
                      <td className="py-2.5 px-2 font-mono text-slate-600 font-bold">P0456K</td>
                      <td className="py-2.5 px-3 text-slate-800">Green Bell Pepper (Capsicum)</td>
                      <td className="py-2.5 px-2 text-center font-bold font-mono">6 kg</td>
                      <td className="py-2.5 px-3 text-right">
                        <span className="px-2 py-0.5 rounded text-[11px] font-bold bg-teal-50 text-teal-800 border border-teal-300">
                          Processed
                        </span>
                      </td>
                    </tr>
                  </tbody>
                </table>
              </div>
            </div>

            {/* Table 2: Internal Transfers (Screenshot 1 Left) */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden flex flex-col justify-between">
              <div>
                <div className="p-3.5 border-b border-slate-200 flex items-center justify-between bg-slate-50">
                  <span className="text-xs font-extrabold text-slate-900 uppercase tracking-wider">
                    Internal Transfer Slips
                  </span>
                  <div className="flex items-center gap-1 text-[11px] text-slate-500 font-mono">
                    <span>Today's Log</span>
                  </div>
                </div>
                <table className="w-full text-left text-xs">
                  <thead className="bg-slate-50 text-slate-500 font-bold uppercase tracking-wider border-b border-slate-100">
                    <tr>
                      <th className="py-2.5 px-3">To Outlet</th>
                      <th className="py-2.5 px-2 font-mono">Req. No</th>
                      <th className="py-2.5 px-3">Item</th>
                      <th className="py-2.5 px-2 text-center">Qty</th>
                      <th className="py-2.5 px-3 text-right">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100">
                    {internalTransfers.map(tr => (
                      <tr key={tr.id} className="hover:bg-slate-50/50">
                        <td className="py-2.5 px-3 font-semibold text-slate-900">{tr.toOutlet}</td>
                        <td className="py-2.5 px-2 font-mono text-slate-600 font-bold">{tr.reqNo}</td>
                        <td className="py-2.5 px-3 text-slate-800">{tr.item}</td>
                        <td className="py-2.5 px-2 text-center font-bold font-mono">{tr.qty} {tr.unit}</td>
                        <td className="py-2.5 px-3 text-right">
                          <span className={`px-2 py-0.5 rounded text-[11px] font-bold ${
                            tr.status === "Saved" 
                              ? "bg-amber-50 text-amber-800 border border-amber-300"
                              : "bg-teal-50 text-teal-800 border border-teal-300"
                          }`}>
                            {tr.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: GOODS RECEIVED NOTES (GRN) & PURCHASE INVOICES */}
      {activeTab === "inward" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-slate-200 shadow-2xs">
            <div>
              <h3 className="font-bold text-slate-900 text-sm sm:text-base flex items-center gap-2">
                <FileText size={18} className="text-slate-700" /> Goods Received Notes (GRN) & Purchase Register
              </h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Verified delivery logs recording supplier invoices, physical receiving dates, bill amounts, and payment status.
              </p>
            </div>
            <button
              onClick={() => setIsNewInvoiceModalOpen(true)}
              className="flex items-center gap-1.5 px-3.5 py-2 bg-slate-900 hover:bg-slate-800 text-white rounded-lg text-xs font-semibold shadow-xs transition active:scale-95"
            >
              <Plus size={15} /> + Record GRN / Purchase
            </button>
          </div>

          <div className="bg-white rounded-xl border border-slate-200 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-600 text-xs font-semibold uppercase tracking-wider border-b border-slate-200">
                <tr>
                  <th className="py-3 px-4">GRN / Invoice #</th>
                  <th className="py-3 px-4">Supplier</th>
                  <th className="py-3 px-4">Delivered Items Summary</th>
                  <th className="py-3 px-4 text-right">Invoice Value</th>
                  <th className="py-3 px-4 text-center">Payment Status</th>
                  <th className="py-3 px-4 text-right">Receiving Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {purchases.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50/60 transition">
                    <td className="py-3.5 px-4">
                      <div className="font-semibold text-slate-900">{p.invoiceNo}</div>
                      <div className="text-xs text-slate-400 mt-0.5">{p.date}</div>
                    </td>
                    <td className="py-3.5 px-4 text-slate-800">
                      <div className="font-medium text-slate-900">{p.vendorName}</div>
                      <div className="text-xs text-slate-400">{p.vendorPhone}</div>
                    </td>
                    <td className="py-3.5 px-4 text-xs text-slate-600 max-w-xs">
                      {p.itemsSummary}
                    </td>
                    <td className="py-3.5 px-4 text-right font-bold text-slate-900 font-mono">
                      ₹{p.totalAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-3.5 px-4 text-center">
                      {p.paymentStatus === "PAID" ? (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
                          <Check size={11} /> PAID ({p.paymentMethod || "CASH"})
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
                          CREDIT (Pending)
                        </span>
                      )}
                    </td>
                    <td className="py-3.5 px-4 text-right text-xs text-slate-400">
                      {p.notes || "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 3: VENDOR PAYABLES LEDGER */}
      {activeTab === "vendors" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
            <Users className="text-slate-700 mt-0.5 shrink-0" size={18} />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Supplier Accounts & Accounts Payable Ledger</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Track cumulative deliveries, payments released, and live outstanding balances per supplier. Send 1-click WhatsApp account statements.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {vendors.map(v => (
              <div key={v.id} className="bg-white p-4 rounded-xl border border-slate-200 shadow-2xs space-y-3">
                <div className="flex items-start justify-between border-b pb-2.5 border-slate-100">
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm sm:text-base">{v.name}</h3>
                    <p className="text-xs text-slate-400 mt-0.5">{v.category}</p>
                    <p className="text-xs text-slate-500 font-mono mt-0.5">📞 {v.phone}</p>
                  </div>
                  {v.pendingDue > 0 ? (
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-amber-50 text-amber-800 border border-amber-200 rounded-md font-mono">
                      Due: ₹{v.pendingDue.toLocaleString("en-IN")}
                    </span>
                  ) : (
                    <span className="text-xs font-semibold px-2.5 py-0.5 bg-emerald-50 text-emerald-700 border border-emerald-200 rounded-md">
                      Settled ✓
                    </span>
                  )}
                </div>

                <div className="grid grid-cols-3 gap-2 bg-slate-50 p-2.5 rounded-lg text-center text-xs">
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Invoiced</span>
                    <span className="font-bold text-slate-900 mt-0.5 block text-xs sm:text-sm font-mono">
                      ₹{v.totalPurchased.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Settled</span>
                    <span className="font-bold text-emerald-700 mt-0.5 block text-xs sm:text-sm font-mono">
                      ₹{v.totalPaid.toLocaleString("en-IN")}
                    </span>
                  </div>
                  <div>
                    <span className="text-slate-400 block text-[11px] font-medium">Outstanding</span>
                    <span className={`font-bold mt-0.5 block text-xs sm:text-sm font-mono ${v.pendingDue > 0 ? "text-amber-800 font-black" : "text-slate-400"}`}>
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
                      className="flex-1 py-2 bg-slate-900 hover:bg-slate-800 text-white text-xs font-semibold rounded-lg transition shadow-2xs active:scale-95"
                    >
                      Settle Balance
                    </button>
                  )}
                  <button
                    onClick={() => handleShareVendorStatement(v)}
                    className="flex-1 flex items-center justify-center gap-1.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white text-xs font-semibold rounded-lg transition shadow-2xs active:scale-95"
                  >
                    <MessageCircle size={14} /> Send Statement
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
          <div className="bg-slate-50 border border-slate-200 p-4 rounded-xl flex items-start gap-3">
            <Sparkles className="text-amber-500 mt-0.5 shrink-0" size={18} />
            <div>
              <h3 className="font-bold text-slate-900 text-sm">Automated Kitchen BOM (Bill of Materials)</h3>
              <p className="text-xs text-slate-600 mt-0.5 leading-relaxed">
                Standard recipes are linked directly to POS orders and KDS tickets. When an order is settled, the engine automatically depletes proportional raw material weights, tracking food cost and eliminating inventory shrinkage.
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
                    <option value="PAID">PAID (Settled)</option>
                    <option value="PENDING_CREDIT">CREDIT (Pending Payable)</option>
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
                  className="flex-1 py-3 bg-slate-900 hover:bg-black text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Record GRN Invoice
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
                <CreditCard className="text-slate-700" /> Settle Vendor Balance
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

      {/* ======================================================== */}
      {/* PETPOOJA MODAL 1: QUICK RE-STOCK DRAWER (Screenshot 1 Right) */}
      {/* ======================================================== */}
      {isReorderModalOpen && selectedReorderItem && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-amber-50 text-amber-700 rounded-lg border border-amber-200">
                  <AlertTriangle size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Quick Re-Stock Raw Material
                  </h2>
                  <p className="text-xs text-slate-500">Petpooja Low Stock Restock Drawer • Hotel Marquis</p>
                </div>
              </div>
              <button 
                onClick={() => setIsReorderModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Petpooja Alert Banner */}
            <div className="bg-amber-50 border border-amber-200 rounded-xl p-3 flex items-start gap-2.5 text-xs text-amber-900">
              <AlertTriangle size={16} className="text-amber-600 shrink-0 mt-0.5" />
              <div>
                <p className="font-semibold text-amber-950">Running low on stock! Re-stock soon.</p>
                <p className="text-amber-800 text-[11px] mt-0.5">
                  Current stock is <strong>{selectedReorderItem.currentStock} {selectedReorderItem.unit}</strong> against minimum par alert level of <strong>{selectedReorderItem.minAlertStock} {selectedReorderItem.unit}</strong>.
                </p>
              </div>
            </div>

            {/* Item Details */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Material Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedReorderItem.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Category:</span>
                <span className="font-medium text-slate-700 bg-white px-2 py-0.5 rounded border border-slate-200">{selectedReorderItem.category}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Assigned Vendor:</span>
                <span className="font-medium text-slate-900">{selectedReorderItem.vendorName || "Parthiv Agency"} ({selectedReorderItem.vendorPhone})</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500">Unit Cost Rate:</span>
                <span className="font-semibold text-slate-900 font-mono">₹{selectedReorderItem.costPerUnit} / {selectedReorderItem.unit}</span>
              </div>
            </div>

            {/* Form Fields */}
            <div className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={reorderQty}
                    onChange={(e) => {
                      const val = e.target.value;
                      setReorderQty(val);
                      const q = parseFloat(val) || 0;
                      setReorderPrice(String(Number((q * selectedReorderItem.costPerUnit).toFixed(2))));
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="e.g. 12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={reorderUnit}
                    onChange={(e) => setReorderUnit(e.target.value)}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-sm font-semibold text-slate-900 focus:ring-2 focus:ring-amber-500 outline-none"
                  >
                    <option value="kg">kg (Kilograms)</option>
                    <option value="L">L (Liters)</option>
                    <option value="Pcs">Pcs (Pieces)</option>
                    <option value="Packets">Packets</option>
                    <option value="Grams">Grams</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Total Estimated Price (₹)</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-sm font-bold text-slate-400">₹</span>
                  <input
                    type="number"
                    value={reorderPrice}
                    onChange={(e) => setReorderPrice(e.target.value)}
                    className="w-full pl-7 pr-3 py-2.5 border border-slate-300 rounded-lg text-sm font-bold text-slate-900 font-mono focus:ring-2 focus:ring-amber-500 outline-none"
                    placeholder="2280"
                  />
                </div>
                <p className="text-[10px] text-slate-500 mt-1">Calculated automatically as Order Qty × Unit Cost Rate</p>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Destination</label>
                <input
                  type="text"
                  readOnly
                  value="Central Kitchen / Main Store (Hotel Marquis)"
                  className="w-full bg-slate-100 border border-slate-200 rounded-lg p-2.5 text-xs text-slate-600 font-medium cursor-not-allowed"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsReorderModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2 w-full sm:flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => handleReorderSubmit(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs transition shadow-2xs"
                >
                  Save Draft PO
                </button>
                <button
                  type="button"
                  onClick={() => handleReorderSubmit(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-semibold rounded-lg text-xs shadow-xs transition active:scale-95"
                >
                  <Send size={13} /> Send PO via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PETPOOJA MODAL 2: RAISE PURCHASE ORDER (Screenshot 2 Right) */}
      {/* ======================================================== */}
      {isPOModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-xl p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <ShoppingCart size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Raise Purchase Order (PO)
                  </h2>
                  <p className="text-xs text-slate-500">Create & dispatch procurement order to verified supplier</p>
                </div>
              </div>
              <button 
                onClick={() => setIsPOModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* Supplier Selection */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Supplier / Vendor</label>
                  <select
                    value={poForm.vendorName}
                    onChange={(e) => {
                      const vName = e.target.value;
                      const vendorObj = vendors.find(v => v.name === vName);
                      setPoForm({
                        ...poForm,
                        vendorName: vName,
                        vendorPhone: vendorObj ? vendorObj.phone : poForm.vendorPhone
                      });
                    }}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  >
                    {vendors.map(v => (
                      <option key={v.id} value={v.name}>{v.name} ({v.category})</option>
                    ))}
                    <option value="Parthiv Agency">Parthiv Agency (Grocery & Veg)</option>
                    <option value="Radhe Dairy">Radhe Dairy (Fresh Dairy)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Vendor WhatsApp Phone</label>
                  <input
                    type="tel"
                    value={poForm.vendorPhone}
                    onChange={(e) => setPoForm({ ...poForm, vendorPhone: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-medium text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="9890123456"
                  />
                </div>
              </div>

              {/* Item Selection with Live Current Stock */}
              <div>
                <div className="flex justify-between items-center mb-1">
                  <label className="block text-xs font-semibold text-slate-700">Raw Material / Item Name</label>
                  {(() => {
                    const matchedItem = items.find(i => i.name.toLowerCase() === poForm.itemName.toLowerCase());
                    return matchedItem ? (
                      <span className={`text-[11px] font-semibold px-2 py-0.5 rounded border ${
                        matchedItem.currentStock <= matchedItem.minAlertStock 
                          ? "bg-amber-50 text-amber-800 border-amber-200" 
                          : "bg-emerald-50 text-emerald-800 border-emerald-200"
                      }`}>
                        Current Stock: {matchedItem.currentStock} {matchedItem.unit} (Par: {matchedItem.minAlertStock})
                      </span>
                    ) : null;
                  })()}
                </div>
                <select
                  value={poForm.itemName}
                  onChange={(e) => {
                    const itemName = e.target.value;
                    const matched = items.find(i => i.name === itemName);
                    setPoForm({
                      ...poForm,
                      itemName,
                      unit: matched ? (matched.unit === "kg" ? "Kg" : matched.unit) : poForm.unit,
                      estimatedPrice: matched ? String(matched.costPerUnit) : poForm.estimatedPrice
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  {items.map(i => (
                    <option key={i.id} value={i.name}>
                      {i.name} (Stock: {i.currentStock} {i.unit} • ₹{i.costPerUnit}/{i.unit})
                    </option>
                  ))}
                </select>
              </div>

              {/* Qty, Unit, Est Price & Total */}
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Order Quantity</label>
                  <input
                    type="number"
                    step="0.5"
                    min="1"
                    value={poForm.qty}
                    onChange={(e) => setPoForm({ ...poForm, qty: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="12"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={poForm.unit}
                    onChange={(e) => setPoForm({ ...poForm, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  >
                    <option value="Kg">Kg</option>
                    <option value="L">L</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Packets">Packets</option>
                    <option value="Grams">Grams</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Rate / Unit (₹)</label>
                  <input
                    type="number"
                    value={poForm.estimatedPrice}
                    onChange={(e) => setPoForm({ ...poForm, estimatedPrice: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-mono font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="65"
                  />
                </div>
              </div>

              {/* Total Calculation Card */}
              <div className="bg-slate-50 border border-slate-200 rounded-xl p-3 flex items-center justify-between">
                <div>
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Estimated PO Total:</span>
                  <div className="text-lg font-bold text-slate-900 font-mono">
                    ₹{((parseFloat(poForm.qty) || 0) * (parseFloat(poForm.estimatedPrice) || 0)).toLocaleString("en-IN", { minimumFractionDigits: 2 })}
                  </div>
                </div>
                <div className="text-right">
                  <span className="text-[11px] font-semibold text-slate-500 uppercase tracking-wider">Target Outlet:</span>
                  <p className="text-xs font-medium text-slate-800">{poForm.outlet}</p>
                </div>
              </div>

              {/* Destination Outlet */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Receiving Section</label>
                  <select
                    value={poForm.outlet}
                    onChange={(e) => setPoForm({ ...poForm, outlet: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs font-medium text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                  >
                    <option value="Central Kitchen / Main Store">Central Kitchen / Main Store</option>
                    <option value="Line Kitchen">Line Kitchen</option>
                    <option value="Banquet Hall Pantry">Banquet Hall Pantry</option>
                    <option value="Mocktail Bar">Mocktail Bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Delivery Remarks / Note</label>
                  <input
                    type="text"
                    value={poForm.notes}
                    onChange={(e) => setPoForm({ ...poForm, notes: e.target.value })}
                    placeholder="e.g. Early morning delivery required"
                    className="w-full border border-slate-300 rounded-lg p-2 text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                  />
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="flex flex-col sm:flex-row items-center gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsPOModalOpen(false)}
                className="w-full sm:w-auto px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <div className="flex items-center gap-2 w-full sm:flex-1 justify-end">
                <button
                  type="button"
                  onClick={() => handleRaisePOSubmit(false)}
                  className="flex-1 sm:flex-none px-4 py-2.5 bg-white border border-slate-300 hover:bg-slate-50 text-slate-700 font-semibold rounded-lg text-xs transition shadow-2xs"
                >
                  Save Draft PO
                </button>
                <button
                  type="button"
                  onClick={() => handleRaisePOSubmit(true)}
                  className="flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-semibold rounded-lg text-xs shadow-xs transition active:scale-95"
                >
                  <Send size={13} /> Send Request via WhatsApp
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PETPOOJA MODAL 3: SUB-RECIPE BATCH CONVERSION (Screenshot 2 Left) */}
      {/* ======================================================== */}
      {isConvertModalOpen && selectedSubRecipe && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <ChefHat size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    Convert Sub-Recipe Batch
                  </h2>
                  <p className="text-xs text-slate-500">Cook / prep semi-finished gravy & auto-deduct raw materials</p>
                </div>
              </div>
              <button 
                onClick={() => setIsConvertModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            {/* Recipe Header */}
            <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 space-y-2 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Sub-Recipe Name:</span>
                <span className="font-bold text-slate-900 text-sm">{selectedSubRecipe.name}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Standard Batch Yield:</span>
                <span className="font-mono font-semibold text-slate-900">{selectedSubRecipe.outputYield} {selectedSubRecipe.yieldUnit}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-slate-500 font-medium">Current Prepped Stock:</span>
                <span className="font-mono font-semibold text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded border border-emerald-200">
                  {selectedSubRecipe.currentStock} {selectedSubRecipe.yieldUnit}
                </span>
              </div>
            </div>

            {/* Multiplier Selector */}
            <div className="space-y-2">
              <label className="block text-xs font-semibold text-slate-700">Select Batch Multiplier:</label>
              <div className="grid grid-cols-4 gap-2">
                {[1, 2, 5, 10].map(m => (
                  <button
                    key={m}
                    type="button"
                    onClick={() => setBatchMultiplier(m)}
                    className={`py-2 text-xs font-bold rounded-lg border transition ${
                      batchMultiplier === m 
                        ? "bg-[#991b1b] text-white border-[#991b1b] shadow-xs" 
                        : "bg-white text-slate-700 border-slate-200 hover:bg-slate-50"
                    }`}
                  >
                    {m}x Batch
                  </button>
                ))}
              </div>
              <p className="text-[11px] text-slate-500">
                Total Output to Prep: <strong className="text-slate-900 font-mono">{(selectedSubRecipe.outputYield || 500) * batchMultiplier} {selectedSubRecipe.yieldUnit}</strong>
              </p>
            </div>

            {/* Required Raw Materials Depletion Breakdown */}
            <div className="space-y-2">
              <span className="text-xs font-semibold text-slate-700">Raw Material Consumption Breakdown:</span>
              <div className="border border-slate-200 rounded-xl overflow-hidden divide-y divide-slate-100 text-xs">
                {selectedSubRecipe.materials.map((mat, idx) => {
                  const required = mat.qty * batchMultiplier;
                  const itemInStock = items.find(i => i.name.toLowerCase().includes(mat.materialName.toLowerCase()));
                  const stockDisplay = itemInStock ? `${itemInStock.currentStock} ${itemInStock.unit}` : "N/A";
                  return (
                    <div key={idx} className="p-2.5 flex items-center justify-between bg-white hover:bg-slate-50/60">
                      <div>
                        <span className="font-semibold text-slate-900">{mat.materialName}</span>
                        <div className="text-[11px] text-slate-500">
                          In Storage: <span className="font-mono font-medium text-slate-700">{stockDisplay}</span>
                        </div>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-[#991b1b] font-mono">-{required} {mat.unit}</span>
                        <div className="text-[10px] text-slate-400">will be deducted</div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Notice */}
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-3 text-[11px] text-blue-900">
              <p className="font-semibold">Petpooja Auto-Conversion Note:</p>
              <p className="text-blue-800 mt-0.5">
                Gram/ml measurements will be accurately deducted from kilogram/liter inventory storage without rounding skew.
              </p>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsConvertModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => handleConvertSubRecipe(selectedSubRecipe, batchMultiplier)}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-[#991b1b] hover:bg-[#7f1d1d] text-white font-semibold rounded-lg text-xs shadow-xs transition active:scale-95"
              >
                <ChefHat size={14} /> Cook & Convert Batch (+{(selectedSubRecipe.outputYield || 500) * batchMultiplier}{selectedSubRecipe.yieldUnit})
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* PETPOOJA MODAL 4: INTERNAL OUTLET TRANSFER (Screenshot 1 Left) */}
      {/* ======================================================== */}
      {isTransferModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-lg p-6 space-y-5 shadow-2xl border border-slate-200">
            <div className="flex items-center justify-between border-b border-slate-200 pb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 bg-slate-900 text-white rounded-lg">
                  <Truck size={18} />
                </div>
                <div>
                  <h2 className="text-base font-bold text-slate-900">
                    New Internal Transfer Slip
                  </h2>
                  <p className="text-xs text-slate-500">Petpooja Central Kitchen to Outlet Routing</p>
                </div>
              </div>
              <button 
                onClick={() => setIsTransferModalOpen(false)} 
                className="text-slate-400 hover:text-slate-600 font-bold text-lg p-1"
              >
                ✕
              </button>
            </div>

            <div className="space-y-3.5">
              {/* From & To Outlets */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">From Outlet</label>
                  <select
                    value={transferForm.fromOutlet}
                    onChange={(e) => setTransferForm({ ...transferForm, fromOutlet: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  >
                    <option value="Central Kitchen / Main Store">Central Kitchen / Main Store</option>
                    <option value="Banquet Hall Pantry">Banquet Hall Pantry</option>
                    <option value="Line Kitchen">Line Kitchen</option>
                    <option value="Mocktail Bar">Mocktail Bar</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">To Destination Outlet</label>
                  <select
                    value={transferForm.toOutlet}
                    onChange={(e) => setTransferForm({ ...transferForm, toOutlet: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  >
                    <option value="Banquet Hall Pantry">Banquet Hall Pantry</option>
                    <option value="Line Kitchen">Line Kitchen</option>
                    <option value="Mocktail Bar">Mocktail Bar</option>
                    <option value="Poolside Lawn Kitchen">Poolside Lawn Kitchen</option>
                  </select>
                </div>
              </div>

              {/* Item to Transfer */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Select Material or Prepped Sub-Recipe</label>
                <select
                  value={transferForm.item}
                  onChange={(e) => {
                    const itemName = e.target.value;
                    const matchedItem = items.find(i => i.name === itemName);
                    setTransferForm({
                      ...transferForm,
                      item: itemName,
                      unit: matchedItem ? matchedItem.unit : transferForm.unit
                    });
                  }}
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                >
                  <optgroup label="Raw Materials">
                    {items.map(i => (
                      <option key={i.id} value={i.name}>
                        {i.name} (Available: {i.currentStock} {i.unit})
                      </option>
                    ))}
                  </optgroup>
                  <optgroup label="Prepped Sub-Recipes (Central Kitchen)">
                    {subRecipes.map(s => (
                      <option key={s.id} value={s.name}>
                        {s.name} (Ready: {s.currentStock} {s.yieldUnit})
                      </option>
                    ))}
                  </optgroup>
                </select>
              </div>

              {/* Transfer Qty and Unit */}
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Quantity</label>
                  <input
                    type="number"
                    step="0.5"
                    min="0.5"
                    value={transferForm.qty}
                    onChange={(e) => setTransferForm({ ...transferForm, qty: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                    placeholder="10"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Unit</label>
                  <select
                    value={transferForm.unit}
                    onChange={(e) => setTransferForm({ ...transferForm, unit: e.target.value })}
                    className="w-full border border-slate-300 rounded-lg p-2.5 text-xs font-semibold text-slate-900 focus:ring-2 focus:ring-slate-900 outline-none"
                  >
                    <option value="Kg">Kg</option>
                    <option value="L">L</option>
                    <option value="Pcs">Pcs</option>
                    <option value="Packets">Packets</option>
                    <option value="Grams">Grams</option>
                    <option value="ml">ml</option>
                  </select>
                </div>
              </div>

              {/* Notes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Transfer Purpose / Event Note</label>
                <input
                  type="text"
                  value={transferForm.notes}
                  onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                  placeholder="e.g. Banquet dinner buffet preparation"
                  className="w-full border border-slate-300 rounded-lg p-2.5 text-xs text-slate-800 focus:ring-2 focus:ring-slate-900 outline-none"
                />
              </div>
            </div>

            {/* Actions */}
            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-200">
              <button
                type="button"
                onClick={() => setIsTransferModalOpen(false)}
                className="px-4 py-2.5 bg-slate-100 hover:bg-slate-200 text-slate-700 font-semibold rounded-lg text-xs transition"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleTransferSubmit}
                className="flex items-center gap-1.5 px-4 py-2.5 bg-slate-900 hover:bg-black text-white font-semibold rounded-lg text-xs shadow-xs transition active:scale-95"
              >
                <Truck size={14} /> Dispatch & Save Transfer Slip
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
