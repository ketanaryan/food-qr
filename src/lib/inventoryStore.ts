// Hybrid Persistent Inventory Management Engine (Supabase + Local JSON Fallback)
import fs from 'fs';
import path from 'path';

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
  type: "INWARD" | "WASTAGE" | "CONSUMPTION" | "ADJUSTMENT" | "TRANSFER" | "CONVERSION";
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

export interface PurchaseOrder {
  id: string;
  poNumber: string; // e.g. "PO324G", "PO456K"
  vendorName: string;
  vendorPhone: string;
  itemName: string;
  qty: number;
  unit: string;
  currentStockAtOrder?: number;
  estimatedPrice: number;
  totalAmount: number;
  status: "Saved" | "Processed" | "Received" | "Cancelled";
  createdAt: string;
  outlet: string;
  notes?: string;
}

export interface SubRecipePrep {
  id: string;
  name: string; // e.g. "Tomato Sauce / Gravy", "White Cashew Gravy", "Chop Masala"
  outputYield: number;
  yieldUnit: string;
  currentStock: number;
  materials: { materialName: string; qty: number; unit: string }[];
  lastConverted?: string;
}

export interface MultiStageRecipe {
  id: string;
  conversionName: string; // e.g. "Margherita Pizza", "Paneer Butter Masala"
  category: string;
  autoConvert: boolean;
  subRecipes: { subRecipeName: string; qty: number; unit: string }[];
  rawMaterials: { materialName: string; qty: number; unit: string }[];
}

export interface InternalTransfer {
  id: string;
  reqNo: string; // e.g. "P0324G", "P0456K"
  fromOutlet: string;
  toOutlet: string;
  item: string;
  qty: number;
  unit: string;
  status: "Saved" | "Processed" | "Received";
  date: string;
  notes?: string;
}

export interface InventoryStoreData {
  items: InventoryItem[];
  purchases: VendorPurchase[];
  vendors: VendorAccount[];
  reconciliations: DailyReconciliation[];
  logs: StockLog[];
  recipes: RecipeBOM[];
  purchaseOrders: PurchaseOrder[];
  subRecipes: SubRecipePrep[];
  multiStageRecipes: MultiStageRecipe[];
  internalTransfers: InternalTransfer[];
}

const DATA_DIR = path.join(process.cwd(), 'data');
const INVENTORY_FILE = path.join(DATA_DIR, 'inventory-store.json');

// Default initial master data
const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
  {
    id: "inv-1",
    name: "Amul Malai Paneer",
    category: "Dairy",
    currentStock: 12.5,
    unit: "kg",
    minAlertStock: 5.0,
    costPerUnit: 340,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Today, 08:30 AM"
  },
  {
    id: "inv-2",
    name: "Mozzarella Pizza Cheese",
    category: "Dairy",
    currentStock: 4.5,
    unit: "kg",
    minAlertStock: 3.0,
    costPerUnit: 480,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Yesterday, 06:15 PM"
  },
  {
    id: "inv-3",
    name: "Rich Cashew Nut Kernels (Kaju)",
    category: "Grocery",
    currentStock: 15.0,
    unit: "kg",
    minAlertStock: 5.0,
    costPerUnit: 850,
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    lastUpdated: "Today, 07:45 AM"
  },
  {
    id: "inv-capsicum",
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
    currentStock: 50.0,
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
    currentStock: 35.0,
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
    currentStock: 18.0,
    unit: "L",
    minAlertStock: 12.0,
    costPerUnit: 64,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Today, 07:15 AM"
  },
  {
    id: "inv-7",
    name: "Amul Table Butter",
    category: "Dairy",
    currentStock: 8.0,
    unit: "kg",
    minAlertStock: 4.0,
    costPerUnit: 520,
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    lastUpdated: "Today, 08:30 AM"
  },
  {
    id: "inv-8",
    name: "Farm Fresh Tomatoes",
    category: "Vegetables",
    currentStock: 22.0,
    unit: "kg",
    minAlertStock: 8.0,
    costPerUnit: 35,
    vendorName: "Nashik Mandi Direct",
    vendorPhone: "9422778899",
    lastUpdated: "Today, 06:45 AM"
  },
  {
    id: "inv-9",
    name: "Onions & Garlic Pods",
    category: "Vegetables",
    currentStock: 30.0,
    unit: "kg",
    minAlertStock: 10.0,
    costPerUnit: 30,
    vendorName: "Nashik Mandi Direct",
    vendorPhone: "9422778899",
    lastUpdated: "Today, 06:45 AM"
  },
  {
    id: "inv-10",
    name: "Packaged Mineral Water Bottles (1L)",
    category: "Beverages",
    currentStock: 48,
    unit: "Pcs",
    minAlertStock: 24,
    costPerUnit: 14,
    vendorName: "Kinley Beverage Agency",
    vendorPhone: "9821122334",
    lastUpdated: "Yesterday"
  },
  {
    id: "inv-11",
    name: "Earthen Clay Matka Kulfi Pots",
    category: "Beverages",
    currentStock: 36,
    unit: "Pcs",
    minAlertStock: 15,
    costPerUnit: 42,
    vendorName: "Rajasthani Kulfi Works",
    vendorPhone: "9822998877",
    lastUpdated: "2 days ago"
  },
  {
    id: "inv-12",
    name: "All-Purpose Flour (Maida)",
    category: "Grocery",
    currentStock: 40.0,
    unit: "kg",
    minAlertStock: 12.0,
    costPerUnit: 45,
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    lastUpdated: "3 days ago"
  }
];

const DEFAULT_PURCHASES: VendorPurchase[] = [
  {
    id: "pur-1",
    invoiceNo: "INV-KD-104",
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    date: "Today, 08:30 AM",
    itemsSummary: "Full Cream Milk (15L), Paneer (5kg), Butter (3kg)",
    totalAmount: 4220,
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
    itemsSummary: "Basmati Rice (50kg), Sunflower Oil (30L), Maida (40kg)",
    totalAmount: 11350,
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    notes: "Monthly bulk grocery replenishment"
  }
];

const DEFAULT_VENDORS: VendorAccount[] = [
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
    category: "Basmati Rice, Cooking Oil, Atta, Maida, Spices",
    phone: "9823456789",
    totalPurchased: 58000,
    totalPaid: 58000,
    pendingDue: 0,
    lastPaymentDate: "Yesterday"
  },
  {
    id: "v-4",
    name: "Nashik Mandi Direct",
    category: "Daily Farm Fresh Tomatoes, Onions, Coriander",
    phone: "9422778899",
    totalPurchased: 14200,
    totalPaid: 14200,
    pendingDue: 0,
    lastPaymentDate: "Today"
  },
  {
    id: "v-5",
    name: "Kinley Beverage Agency",
    category: "Packaged Mineral Water & Cold Drinks",
    phone: "9821122334",
    totalPurchased: 8500,
    totalPaid: 7500,
    pendingDue: 1000,
    lastPaymentDate: "Yesterday"
  }
];

const DEFAULT_RECIPES: RecipeBOM[] = [
  {
    menuItem: "Paneer Tikka Masala",
    category: "Main Course",
    ingredients: [
      { name: "Amul Malai Paneer", qty: 0.20, unit: "kg" },
      { name: "Fresh Full Cream Milk", qty: 0.05, unit: "L" },
      { name: "Amul Table Butter", qty: 0.02, unit: "kg" },
      { name: "Farm Fresh Tomatoes", qty: 0.15, unit: "kg" },
      { name: "Refined Sunflower Cooking Oil", qty: 0.03, unit: "L" }
    ]
  },
  {
    menuItem: "Paneer Butter Masala",
    category: "Main Course",
    ingredients: [
      { name: "Amul Malai Paneer", qty: 0.20, unit: "kg" },
      { name: "Amul Table Butter", qty: 0.03, unit: "kg" },
      { name: "Fresh Full Cream Milk", qty: 0.05, unit: "L" },
      { name: "Farm Fresh Tomatoes", qty: 0.15, unit: "kg" }
    ]
  },
  {
    menuItem: "Dal Makhani (Slow Cooked)",
    category: "Main Course",
    ingredients: [
      { name: "Amul Table Butter", qty: 0.04, unit: "kg" },
      { name: "Fresh Full Cream Milk", qty: 0.08, unit: "L" },
      { name: "Farm Fresh Tomatoes", qty: 0.10, unit: "kg" }
    ]
  },
  {
    menuItem: "Kaju Masala Curry",
    category: "Main Course",
    ingredients: [
      { name: "Rich Cashew Nut Kernels (Kaju)", qty: 0.12, unit: "kg" },
      { name: "Amul Table Butter", qty: 0.03, unit: "kg" },
      { name: "Fresh Full Cream Milk", qty: 0.05, unit: "L" },
      { name: "Farm Fresh Tomatoes", qty: 0.10, unit: "kg" }
    ]
  },
  {
    menuItem: "Veg Diwani Handi",
    category: "Main Course",
    ingredients: [
      { name: "Green Bell Pepper (Capsicum)", qty: 0.08, unit: "kg" },
      { name: "Farm Fresh Tomatoes", qty: 0.10, unit: "kg" },
      { name: "Amul Malai Paneer", qty: 0.08, unit: "kg" },
      { name: "Amul Table Butter", qty: 0.02, unit: "kg" }
    ]
  },
  {
    menuItem: "Margherita Pizza (Artisanal)",
    category: "Pizzas",
    ingredients: [
      { name: "Artisanal Pizza Base (8-inch)", qty: 1, unit: "Pcs" },
      { name: "Mozzarella Pizza Cheese", qty: 0.15, unit: "kg" },
      { name: "Farm Fresh Tomatoes", qty: 0.08, unit: "kg" }
    ]
  },
  {
    menuItem: "Jeera Rice (Full)",
    category: "Basmati Ki Sajawat",
    ingredients: [
      { name: "India Gate Basmati Rice", qty: 0.18, unit: "kg" },
      { name: "Amul Table Butter", qty: 0.015, unit: "kg" }
    ]
  },
  {
    menuItem: "Garlic Naan (Butter)",
    category: "Roti Ki Khasiat",
    ingredients: [
      { name: "All-Purpose Flour (Maida)", qty: 0.10, unit: "kg" },
      { name: "Amul Table Butter", qty: 0.02, unit: "kg" },
      { name: "Onions & Garlic Pods", qty: 0.02, unit: "kg" }
    ]
  },
  {
    menuItem: "Packaged Mineral Water (1L)",
    category: "Beverages",
    ingredients: [
      { name: "Packaged Mineral Water Bottles (1L)", qty: 1, unit: "Pcs" }
    ]
  },
  {
    menuItem: "Matka Kulfi",
    category: "Ice Cream & Desserts",
    ingredients: [
      { name: "Earthen Clay Matka Kulfi Pots", qty: 1, unit: "Pcs" }
    ]
  }
];

// Petpooja Module 1: Purchase Orders (PO Tickets)
export const DEFAULT_PURCHASE_ORDERS: PurchaseOrder[] = [
  {
    id: "po-1",
    poNumber: "PO324G",
    vendorName: "Parthiv Agency",
    vendorPhone: "9890123456",
    itemName: "Green Bell Pepper (Capsicum)",
    qty: 12,
    unit: "Kg",
    currentStockAtOrder: 5.0,
    estimatedPrice: 65,
    totalAmount: 5124,
    status: "Saved",
    createdAt: "Today, 09:30 AM",
    outlet: "Central Kitchen / Main Store",
    notes: "Restock for weekend banquets rush"
  },
  {
    id: "po-2",
    poNumber: "PO456K",
    vendorName: "Radhe Dairy",
    vendorPhone: "9822114477",
    itemName: "Cottage Cheese (Amul Malai Paneer)",
    qty: 12,
    unit: "Kg",
    currentStockAtOrder: 1.4,
    estimatedPrice: 280,
    totalAmount: 2673,
    status: "Processed",
    createdAt: "Today, 08:15 AM",
    outlet: "Central Kitchen / Main Store",
    notes: "Urgent morning delivery"
  },
  {
    id: "po-3",
    poNumber: "PO108M",
    vendorName: "Kalyan Dairy",
    vendorPhone: "9822334455",
    itemName: "Fresh Full Cream Milk",
    qty: 30,
    unit: "L",
    currentStockAtOrder: 8.0,
    estimatedPrice: 64,
    totalAmount: 1920,
    status: "Saved",
    createdAt: "Yesterday, 06:00 PM",
    outlet: "Banquet Hall Pantry",
    notes: "Evening dairy replenishment"
  }
];

// Petpooja Module 2: Sub-Recipes (Semi-Finished Pre-Preps)
export const DEFAULT_SUB_RECIPES: SubRecipePrep[] = [
  {
    id: "sub-1",
    name: "Tomato Sauce / Base Gravy",
    outputYield: 500,
    yieldUnit: "gms",
    currentStock: 4500,
    materials: [
      { materialName: "Farm Fresh Tomatoes", qty: 475, unit: "gms" },
      { materialName: "Onions & Garlic Pods", qty: 25, unit: "gms" },
      { materialName: "Refined Sunflower Cooking Oil", qty: 14, unit: "gms" }
    ],
    lastConverted: "Today, 07:30 AM"
  },
  {
    id: "sub-2",
    name: "White Cashew Gravy (Shahi Base)",
    outputYield: 600,
    yieldUnit: "gms",
    currentStock: 2800,
    materials: [
      { materialName: "Rich Cashew Nut Kernels (Kaju)", qty: 250, unit: "gms" },
      { materialName: "Fresh Full Cream Milk", qty: 350, unit: "gms" },
      { materialName: "Amul Table Butter", qty: 50, unit: "gms" }
    ],
    lastConverted: "Yesterday, 05:00 PM"
  },
  {
    id: "sub-3",
    name: "Chop Masala Base (Bhuna Onions)",
    outputYield: 750,
    yieldUnit: "gms",
    currentStock: 3200,
    materials: [
      { materialName: "Onions & Garlic Pods", qty: 550, unit: "gms" },
      { materialName: "Farm Fresh Tomatoes", qty: 200, unit: "gms" },
      { materialName: "Refined Sunflower Cooking Oil", qty: 60, unit: "gms" }
    ],
    lastConverted: "Yesterday, 04:30 PM"
  }
];

// Petpooja Module 3: Multi-Stage Recipes (Final Dishesh with Auto Convert)
export const DEFAULT_MULTI_STAGE_RECIPES: MultiStageRecipe[] = [
  {
    id: "msr-1",
    conversionName: "Margherita Pizza",
    category: "Pizzas",
    autoConvert: true,
    subRecipes: [
      { subRecipeName: "Tomato Sauce / Base Gravy", qty: 525, unit: "gms" }
    ],
    rawMaterials: [
      { materialName: "Artisanal Pizza Base (8-inch)", qty: 255, unit: "gms" },
      { materialName: "Mozzarella Pizza Cheese", qty: 350, unit: "gms" }
    ]
  },
  {
    id: "msr-2",
    conversionName: "Paneer Butter Masala",
    category: "Main Course",
    autoConvert: true,
    subRecipes: [
      { subRecipeName: "Tomato Sauce / Base Gravy", qty: 350, unit: "gms" },
      { subRecipeName: "White Cashew Gravy (Shahi Base)", qty: 100, unit: "gms" }
    ],
    rawMaterials: [
      { materialName: "Amul Malai Paneer", qty: 200, unit: "gms" },
      { materialName: "Amul Table Butter", qty: 40, unit: "gms" }
    ]
  },
  {
    id: "msr-3",
    conversionName: "Shahi Veg Dum Biryani",
    category: "Biryani & Rice",
    autoConvert: true,
    subRecipes: [
      { subRecipeName: "White Cashew Gravy (Shahi Base)", qty: 150, unit: "gms" }
    ],
    rawMaterials: [
      { materialName: "India Gate Basmati Rice", qty: 250, unit: "gms" },
      { materialName: "Green Bell Pepper (Capsicum)", qty: 80, unit: "gms" },
      { materialName: "Amul Malai Paneer", qty: 80, unit: "gms" }
    ]
  }
];

// Petpooja Module 4: Central Kitchen & Internal Transfers
export const DEFAULT_INTERNAL_TRANSFERS: InternalTransfer[] = [
  {
    id: "tr-1",
    reqNo: "P0324G",
    fromOutlet: "Central Kitchen / Main Store",
    toOutlet: "Banquet Hall Pantry",
    item: "Amul Malai Paneer",
    qty: 10,
    unit: "Kg",
    status: "Saved",
    date: "Today, 10:15 AM",
    notes: "Banquet dinner buffet preparation"
  },
  {
    id: "tr-2",
    reqNo: "P0456K",
    fromOutlet: "Central Kitchen / Main Store",
    toOutlet: "Restaurant Line Kitchen",
    item: "Farm Fresh Tomatoes",
    qty: 6,
    unit: "Kg",
    status: "Processed",
    date: "Today, 08:30 AM",
    notes: "Daily lunchtime fresh produce transfer"
  },
  {
    id: "tr-3",
    reqNo: "P0512B",
    fromOutlet: "Central Kitchen / Main Store",
    toOutlet: "Mocktail & Beverage Bar",
    item: "Fresh Full Cream Milk",
    qty: 8,
    unit: "L",
    status: "Processed",
    date: "Today, 09:00 AM",
    notes: "Cold coffee and shakes bar station"
  }
];

const DEFAULT_LOGS: StockLog[] = [
  {
    id: "log-1",
    itemName: "Green Bell Pepper (Capsicum)",
    type: "INWARD",
    quantity: 15,
    unit: "kg",
    notes: "Morning delivery from Parthiv Agency",
    cost: 975,
    timestamp: "Today, 07:45 AM"
  },
  {
    id: "log-2",
    itemName: "Amul Malai Paneer",
    type: "WASTAGE",
    quantity: 0.5,
    unit: "kg",
    notes: "Tandoor prep excess trim spoilage",
    cost: 170,
    timestamp: "Yesterday, 11:30 PM"
  }
];

const DEFAULT_RECONCILIATION: DailyReconciliation[] = [
  {
    id: "rec-1",
    itemName: "Amul Malai Paneer",
    unit: "kg",
    openingStock: 15.0,
    inwardToday: 5.0,
    consumedSales: 7.0,
    wastage: 0.5,
    expectedClosing: 12.5,
    physicalClosing: 12.5,
    variance: 0.0,
    status: "MATCHED"
  },
  {
    id: "rec-2",
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
  }
];

function ensureDataDirectory() {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }
}

export function getInventoryStore(): InventoryStoreData {
  ensureDataDirectory();
  if (!fs.existsSync(INVENTORY_FILE)) {
    const initialData: InventoryStoreData = {
      items: DEFAULT_INVENTORY_ITEMS,
      purchases: DEFAULT_PURCHASES,
      vendors: DEFAULT_VENDORS,
      reconciliations: DEFAULT_RECONCILIATION,
      logs: DEFAULT_LOGS,
      recipes: DEFAULT_RECIPES,
      purchaseOrders: DEFAULT_PURCHASE_ORDERS,
      subRecipes: DEFAULT_SUB_RECIPES,
      multiStageRecipes: DEFAULT_MULTI_STAGE_RECIPES,
      internalTransfers: DEFAULT_INTERNAL_TRANSFERS
    };
    fs.writeFileSync(INVENTORY_FILE, JSON.stringify(initialData, null, 2), 'utf-8');
    return initialData;
  }

  try {
    const raw = fs.readFileSync(INVENTORY_FILE, 'utf-8');
    const parsed = JSON.parse(raw);

    // Filter out old non-veg items if present from legacy runs
    let rawItems: InventoryItem[] = Array.isArray(parsed.items) ? parsed.items : DEFAULT_INVENTORY_ITEMS;
    rawItems = rawItems.filter(i => !(i.name || '').toLowerCase().includes('chicken') && i.category !== ('Poultry & Meat' as any));
    if (!rawItems.some(i => i.name.toLowerCase().includes('capsicum'))) {
      rawItems.push(DEFAULT_INVENTORY_ITEMS.find(i => i.id === 'inv-capsicum')!);
    }
    if (!rawItems.some(i => i.name.toLowerCase().includes('cashew') || i.name.toLowerCase().includes('kaju'))) {
      rawItems.push(DEFAULT_INVENTORY_ITEMS.find(i => i.id === 'inv-3')!);
    }
    if (!rawItems.some(i => i.name.toLowerCase().includes('mango'))) {
      rawItems.push(DEFAULT_INVENTORY_ITEMS.find(i => i.id === 'inv-mango')!);
    }
    if (!rawItems.some(i => i.name.toLowerCase().includes('wheat'))) {
      rawItems.push(DEFAULT_INVENTORY_ITEMS.find(i => i.id === 'inv-wheat')!);
    }
    if (!rawItems.some(i => i.name.toLowerCase().includes('pizza base'))) {
      rawItems.push(DEFAULT_INVENTORY_ITEMS.find(i => i.id === 'inv-pizza-base')!);
    }

    const recipes = Array.isArray(parsed.recipes) && parsed.recipes.length > 0 ? parsed.recipes : DEFAULT_RECIPES;
    const purchaseOrders = Array.isArray(parsed.purchaseOrders) && parsed.purchaseOrders.length > 0 ? parsed.purchaseOrders : DEFAULT_PURCHASE_ORDERS;
    const subRecipes = Array.isArray(parsed.subRecipes) && parsed.subRecipes.length > 0 ? parsed.subRecipes : DEFAULT_SUB_RECIPES;
    const multiStageRecipes = Array.isArray(parsed.multiStageRecipes) && parsed.multiStageRecipes.length > 0 ? parsed.multiStageRecipes : DEFAULT_MULTI_STAGE_RECIPES;
    const internalTransfers = Array.isArray(parsed.internalTransfers) && parsed.internalTransfers.length > 0 ? parsed.internalTransfers : DEFAULT_INTERNAL_TRANSFERS;

    return {
      items: rawItems,
      purchases: Array.isArray(parsed.purchases) ? parsed.purchases : DEFAULT_PURCHASES,
      vendors: Array.isArray(parsed.vendors) ? parsed.vendors : DEFAULT_VENDORS,
      reconciliations: Array.isArray(parsed.reconciliations) ? parsed.reconciliations : DEFAULT_RECONCILIATION,
      logs: Array.isArray(parsed.logs) ? parsed.logs : DEFAULT_LOGS,
      recipes,
      purchaseOrders,
      subRecipes,
      multiStageRecipes,
      internalTransfers
    };
  } catch (e) {
    console.error('Error reading inventory store file, restoring defaults:', e);
    return {
      items: DEFAULT_INVENTORY_ITEMS,
      purchases: DEFAULT_PURCHASES,
      vendors: DEFAULT_VENDORS,
      reconciliations: DEFAULT_RECONCILIATION,
      logs: DEFAULT_LOGS,
      recipes: DEFAULT_RECIPES,
      purchaseOrders: DEFAULT_PURCHASE_ORDERS,
      subRecipes: DEFAULT_SUB_RECIPES,
      multiStageRecipes: DEFAULT_MULTI_STAGE_RECIPES,
      internalTransfers: DEFAULT_INTERNAL_TRANSFERS
    };
  }
}

export function saveInventoryStore(store: InventoryStoreData): void {
  ensureDataDirectory();
  fs.writeFileSync(INVENTORY_FILE, JSON.stringify(store, null, 2), 'utf-8');
}

// -------------------------------------------------------------
// CORE BUSINESS LOGIC ENGINES
// -------------------------------------------------------------

// 1. Stock Inward (Refill / Delivery Purchase)
export function recordStockInward(payload: {
  itemId?: string;
  itemName?: string;
  qty: number;
  costPerUnit?: number;
  vendorName?: string;
  vendorPhone?: string;
  invoiceNo?: string;
  paymentStatus?: "PAID" | "PENDING_CREDIT";
  paymentMethod?: "CASH" | "UPI" | "BANK_TRANSFER";
  notes?: string;
  category?: "Dairy" | "Grocery" | "Vegetables" | "Fruits" | "Beverages" | "Packaging" | "Spices" | "Bakery";
  unit?: "kg" | "L" | "Pcs" | "Packets" | "Grams";
}) {
  const store = getInventoryStore();
  const { qty } = payload;
  if (!qty || qty <= 0) throw new Error("Invalid quantity for stock inward");

  let target = store.items.find(i => 
    (payload.itemId && i.id === payload.itemId) || 
    (payload.itemName && i.name.toLowerCase() === payload.itemName.toLowerCase())
  );

  const costUnit = payload.costPerUnit || (target ? target.costPerUnit : 100);
  const totalCost = Number((qty * costUnit).toFixed(2));
  const vName = payload.vendorName || (target ? target.vendorName : "Direct Market");
  const vPhone = payload.vendorPhone || (target ? target.vendorPhone : "9822334455");

  let targetItem: InventoryItem;
  if (target) {
    target.currentStock = Number((target.currentStock + qty).toFixed(2));
    target.costPerUnit = costUnit;
    if (payload.unit) target.unit = payload.unit;
    if (payload.category) target.category = payload.category;
    target.lastUpdated = "Just now";
    targetItem = target;
  } else {
    const isMilk = (payload.itemName || "").toLowerCase().includes("milk");
    const isPaneer = (payload.itemName || "").toLowerCase().includes("paneer");
    const defaultCat = isMilk || isPaneer ? "Dairy" : "Grocery";
    const defaultUnit = isMilk ? "L" : "kg";

    targetItem = {
      id: "inv-" + Date.now(),
      name: payload.itemName || "Raw Ingredient",
      category: payload.category || defaultCat,
      currentStock: qty,
      unit: payload.unit || defaultUnit,
      minAlertStock: 5.0,
      costPerUnit: costUnit,
      vendorName: vName,
      vendorPhone: vPhone,
      lastUpdated: "Just now"
    };
    store.items.unshift(targetItem);
  }

  // Create Stock Log
  const newLog: StockLog = {
    id: "log-" + Date.now(),
    itemName: targetItem.name,
    type: "INWARD",
    quantity: qty,
    unit: targetItem.unit,
    notes: payload.notes || `Stock inward from ${vName}`,
    cost: totalCost,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today"
  };
  store.logs.unshift(newLog);

  // Record Vendor Purchase Invoice if invoice details provided
  const invoiceNo = payload.invoiceNo || `INV-${Math.floor(1000 + Math.random() * 9000)}`;
  const pStatus = payload.paymentStatus || "PAID";
  const newPurchase: VendorPurchase = {
    id: "pur-" + Date.now(),
    invoiceNo,
    vendorName: vName,
    vendorPhone: vPhone,
    date: new Date().toLocaleDateString('en-IN') + ", " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    itemsSummary: `${targetItem.name} (${qty} ${targetItem.unit})`,
    totalAmount: totalCost,
    paymentStatus: pStatus,
    paymentMethod: payload.paymentMethod || "UPI",
    notes: payload.notes
  };
  store.purchases.unshift(newPurchase);

  // Update Vendor Ledger Account
  let vendor = store.vendors.find(v => v.name.toLowerCase() === vName.toLowerCase());
  if (vendor) {
    vendor.totalPurchased += totalCost;
    if (pStatus === "PENDING_CREDIT") {
      vendor.pendingDue += totalCost;
    } else {
      vendor.totalPaid += totalCost;
      vendor.lastPaymentDate = "Today";
    }
  } else {
    store.vendors.push({
      id: "v-" + Date.now(),
      name: vName,
      category: targetItem.category,
      phone: vPhone,
      totalPurchased: totalCost,
      totalPaid: pStatus === "PAID" ? totalCost : 0,
      pendingDue: pStatus === "PENDING_CREDIT" ? totalCost : 0,
      lastPaymentDate: pStatus === "PAID" ? "Today" : "Never"
    });
  }

  saveInventoryStore(store);
  return { updatedItem: targetItem, purchase: newPurchase, log: newLog };
}

// 2. Log Kitchen Wastage / Damage
export function recordStockWastage(payload: {
  itemId?: string;
  itemName?: string;
  qty: number;
  reason?: string;
  notes?: string;
}) {
  const store = getInventoryStore();
  const { qty } = payload;
  if (!qty || qty <= 0) throw new Error("Invalid quantity for wastage");

  const target = store.items.find(i => 
    (payload.itemId && i.id === payload.itemId) || 
    (payload.itemName && i.name.toLowerCase() === payload.itemName.toLowerCase())
  );
  if (!target) throw new Error("Item not found in inventory");

  const actualDeduction = Math.min(target.currentStock, qty);
  target.currentStock = Math.max(0, Number((target.currentStock - actualDeduction).toFixed(2)));
  target.lastUpdated = "Just now";

  const costLoss = Number((actualDeduction * target.costPerUnit).toFixed(2));
  const newLog: StockLog = {
    id: "log-" + Date.now(),
    itemName: target.name,
    type: "WASTAGE",
    quantity: actualDeduction,
    unit: target.unit,
    notes: `${payload.reason || "Kitchen Spoilage"} - ${payload.notes || "Recorded via audit"}`,
    cost: costLoss,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today"
  };
  store.logs.unshift(newLog);

  saveInventoryStore(store);
  return { updatedItem: target, costLoss, log: newLog };
}

// 3. Settle Vendor Payment (Accounts Payable Settlement)
export function recordVendorPayment(vendorId: string, amount: number, paymentMethod: "CASH" | "UPI" | "BANK_TRANSFER" = "UPI") {
  const store = getInventoryStore();
  const vendor = store.vendors.find(v => v.id === vendorId);
  if (!vendor) throw new Error("Vendor account not found");
  if (amount <= 0) throw new Error("Invalid payment amount");

  const payAmt = Math.min(amount, vendor.pendingDue);
  vendor.totalPaid += payAmt;
  vendor.pendingDue = Math.max(0, Number((vendor.pendingDue - payAmt).toFixed(2)));
  vendor.lastPaymentDate = "Today (" + paymentMethod + ")";

  saveInventoryStore(store);
  return { vendor, paidAmount: payAmt };
}

// 4. Save Daily Physical Reconciliation Audit
export function recordDailyReconciliation(reconciliations: DailyReconciliation[]) {
  const store = getInventoryStore();

  const processed = reconciliations.map(r => {
    const item = store.items.find(i => i.name.toLowerCase() === r.itemName.toLowerCase());
    const costPerUnit = item ? item.costPerUnit : 100;
    const expected = Number((r.openingStock + r.inwardToday - r.consumedSales - r.wastage).toFixed(2));
    const physical = Number(r.physicalClosing !== undefined && !isNaN(r.physicalClosing) ? r.physicalClosing : expected);
    const variance = Number((physical - expected).toFixed(2));

    let status: "MATCHED" | "LEAKAGE_THEFT" | "SURPLUS" | "HIGH_VARIANCE_THEFT_ALERT" = "MATCHED";
    let costLoss = 0;

    if (variance <= -0.5) {
      status = "HIGH_VARIANCE_THEFT_ALERT";
      costLoss = Number((Math.abs(variance) * costPerUnit).toFixed(2));
    } else if (variance < 0) {
      status = "LEAKAGE_THEFT";
      costLoss = Number((Math.abs(variance) * costPerUnit).toFixed(2));
    } else if (variance > 0) {
      status = "SURPLUS";
    }

    return {
      ...r,
      expectedClosing: expected,
      physicalClosing: physical,
      variance,
      status,
      costLoss
    };
  });

  store.reconciliations = processed;
  
  // Update current stock to match physical counts for audited items
  for (const r of processed) {
    const item = store.items.find(i => i.name.toLowerCase() === r.itemName.toLowerCase());
    if (item && r.physicalClosing !== undefined && !isNaN(r.physicalClosing)) {
      item.currentStock = r.physicalClosing;
      item.lastUpdated = "Audited Today";
    }
  }

  saveInventoryStore(store);
  return store.reconciliations;
}

// 5. Automatic Recipe-Based Stock Depletion for Live Orders
export function depleteStockForOrderItems(orderNumber: string, items: Array<{ name: string; qty: number }>) {
  const store = getInventoryStore();
  const depletedSummary: Array<{ ingredient: string; qty: number; unit: string }> = [];
  const lowStockWarnings: string[] = [];

  for (const orderItem of items) {
    if (!orderItem.name || orderItem.name.startsWith("📝 Note:") || orderItem.name.startsWith("Cooking Note")) {
      continue;
    }
    const orderQty = orderItem.qty || 1;
    const cleanItemName = orderItem.name.toLowerCase().trim();

    // Find best matching recipe BOM
    const recipe = store.recipes.find(r => {
      const rName = r.menuItem.toLowerCase().trim();
      return cleanItemName.includes(rName) || rName.includes(cleanItemName);
    });

    if (recipe && recipe.ingredients && recipe.ingredients.length > 0) {
      for (const ing of recipe.ingredients) {
        const totalIngNeeded = Number((ing.qty * orderQty).toFixed(3));
        const ingNameLower = ing.name.toLowerCase();
        
        // Exact match first, then ingredient type match
        let invItem = store.items.find(i => i.name.toLowerCase() === ingNameLower);
        if (!invItem) {
          invItem = store.items.find(i => {
            const iNameLower = i.name.toLowerCase();
            return (
              (ingNameLower.includes("paneer") && iNameLower.includes("paneer")) ||
              (ingNameLower.includes("milk") && iNameLower.includes("milk")) ||
              (ingNameLower.includes("butter") && iNameLower.includes("butter")) ||
              (ingNameLower.includes("tomatoes") && iNameLower.includes("tomatoes")) ||
              (ingNameLower.includes("rice") && iNameLower.includes("rice")) ||
              ((ingNameLower.includes("kulfi") || ingNameLower.includes("ice cream")) &&
               (iNameLower.includes("kulfi") || iNameLower.includes("ice cream")))
            );
          });
        }
        
        if (invItem) {
          invItem.currentStock = Math.max(0, Number((invItem.currentStock - totalIngNeeded).toFixed(2)));
          invItem.lastUpdated = "Order #" + orderNumber;

          depletedSummary.push({
            ingredient: invItem.name,
            qty: totalIngNeeded,
            unit: invItem.unit
          });

          // Check if stock crossed low stock threshold
          if (invItem.currentStock <= invItem.minAlertStock) {
            lowStockWarnings.push(`${invItem.name}: Only ${invItem.currentStock} ${invItem.unit} remaining!`);
          }
        }
      }
    }
  }

  if (depletedSummary.length > 0) {
    // Log consumption
    const summaryText = depletedSummary
      .map(d => `${d.ingredient} (${d.qty} ${d.unit})`)
      .join(', ');

    const newLog: StockLog = {
      id: "log-" + Date.now(),
      itemName: `KOT Order #${orderNumber}`,
      type: "CONSUMPTION",
      quantity: depletedSummary.reduce((acc, d) => acc + d.qty, 0),
      unit: "Units",
      notes: `Auto-depleted by Order #${orderNumber}: ${summaryText}`,
      cost: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today"
    };
    store.logs.unshift(newLog);

    saveInventoryStore(store);
  }

  return { depletedSummary, lowStockWarnings };
}

// 6. WhatsApp Low-Stock Purchase Order generator URL
export function generateWhatsAppPurchaseOrder(vendorPhone: string, vendorName: string, itemsList: Array<{ name: string; neededQty: number; unit: string }>) {
  const cleanPhone = vendorPhone.replace(/\D/g, "");
  const targetPhone = cleanPhone.length === 10 ? `91${cleanPhone}` : cleanPhone;
  const itemsText = itemsList.map((i, idx) => `${idx + 1}. ${i.name} - ${i.neededQty} ${i.unit}`).join('%0A');
  
  const text = `*HOTEL WHITE BLISS - URGENT PURCHASE ORDER*%0A%0A` +
    `Namaste ${encodeURIComponent(vendorName)},%0A` +
    `Please supply the following ingredients urgently to Hotel White Bliss, Nashik:%0A%0A` +
    `${itemsText}%0A%0A` +
    `_Sent via Hotel White Bliss Inventory Management Desk_`;

  return `https://wa.me/${targetPhone}?text=${text}`;
}

// 7. Petpooja Module: Raise Purchase Order (PO Ticket)
export function recordPurchaseOrder(payload: {
  vendorName: string;
  vendorPhone?: string;
  itemName: string;
  qty: number;
  unit?: string;
  estimatedPrice?: number;
  outlet?: string;
  notes?: string;
  autoSend?: boolean;
}) {
  const store = getInventoryStore();
  const poNum = `PO${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  // Check if item exists in raw inventory
  const invItem = store.items.find(i => i.name.toLowerCase().includes(payload.itemName.toLowerCase()));
  const currentStock = invItem ? invItem.currentStock : 0;
  const unitRate = payload.estimatedPrice || (invItem ? invItem.costPerUnit : 100);
  const totalAmount = Number((payload.qty * unitRate).toFixed(2));

  const po: PurchaseOrder = {
    id: "po-" + Date.now(),
    poNumber: poNum,
    vendorName: payload.vendorName || "Parthiv Agency",
    vendorPhone: payload.vendorPhone || (invItem ? invItem.vendorPhone : "9890123456"),
    itemName: payload.itemName,
    qty: payload.qty,
    unit: payload.unit || (invItem ? invItem.unit : "Kg"),
    currentStockAtOrder: currentStock,
    estimatedPrice: unitRate,
    totalAmount,
    status: payload.autoSend ? "Processed" : "Saved",
    createdAt: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    outlet: payload.outlet || "Central Kitchen / Main Store",
    notes: payload.notes
  };

  store.purchaseOrders.unshift(po);
  saveInventoryStore(store);
  return po;
}

// 8. Petpooja Module: Update PO Status & Auto Inward if Received
export function updatePurchaseOrderStatus(poId: string, status: "Saved" | "Processed" | "Received" | "Cancelled") {
  const store = getInventoryStore();
  const target = store.purchaseOrders.find(p => p.id === poId);
  if (!target) throw new Error("Purchase order not found");

  target.status = status;

  if (status === "Received") {
    recordStockInward({
      itemName: target.itemName,
      qty: target.qty,
      costPerUnit: target.estimatedPrice,
      vendorName: target.vendorName,
      vendorPhone: target.vendorPhone,
      invoiceNo: `INV-${target.poNumber}`,
      notes: `Received from PO #${target.poNumber}`
    });
  }

  saveInventoryStore(store);
  return target;
}

// 9. Petpooja Module: Internal Transfer between Outlets / Sections
export function recordInternalTransfer(payload: {
  toOutlet: string;
  fromOutlet?: string;
  item: string;
  qty: number;
  unit: string;
  notes?: string;
}) {
  const store = getInventoryStore();
  const reqNo = `P0${Math.floor(100 + Math.random() * 900)}${String.fromCharCode(65 + Math.floor(Math.random() * 26))}`;

  const transfer: InternalTransfer = {
    id: "tr-" + Date.now(),
    reqNo,
    fromOutlet: payload.fromOutlet || "Central Kitchen / Main Store",
    toOutlet: payload.toOutlet,
    item: payload.item,
    qty: payload.qty,
    unit: payload.unit,
    status: "Saved",
    date: "Today, " + new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    notes: payload.notes
  };

  store.internalTransfers.unshift(transfer);
  saveInventoryStore(store);
  return transfer;
}

export function updateInternalTransferStatus(transferId: string, status: "Saved" | "Processed" | "Received") {
  const store = getInventoryStore();
  const target = store.internalTransfers.find(t => t.id === transferId);
  if (!target) throw new Error("Internal transfer not found");

  target.status = status;

  if (status === "Processed" || status === "Received") {
    const newLog: StockLog = {
      id: "log-" + Date.now(),
      itemName: target.item,
      type: "TRANSFER",
      quantity: target.qty,
      unit: target.unit,
      notes: `Internal Transfer ${target.reqNo}: ${target.fromOutlet} ➔ ${target.toOutlet}`,
      cost: 0,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today"
    };
    store.logs.unshift(newLog);
  }

  saveInventoryStore(store);
  return target;
}

// 10. Petpooja Module: Sub-Recipe Batch Conversion (Pre-prep Kitchen Cooking)
export function convertSubRecipeBatch(subRecipeId: string, batchMultiplier: number = 1) {
  const store = getInventoryStore();
  const subRecipe = store.subRecipes.find(s => s.id === subRecipeId);
  if (!subRecipe) throw new Error("Sub-recipe prep not found");

  const deducted: Array<{ material: string; qty: number; unit: string }> = [];

  for (const mat of subRecipe.materials) {
    const needed = mat.qty * batchMultiplier;
    const invItem = store.items.find(i => i.name.toLowerCase().includes(mat.materialName.toLowerCase()));
    if (invItem) {
      // Inward deduction: convert grams/ml to kg/L if needed
      const deductionAmount = mat.unit.toLowerCase() === "gms" || mat.unit.toLowerCase() === "ml" 
        ? needed / 1000 
        : needed;
      invItem.currentStock = Math.max(0, Number((invItem.currentStock - deductionAmount).toFixed(2)));
      invItem.lastUpdated = "Batch Converted";
      deducted.push({ material: invItem.name, qty: needed, unit: mat.unit });
    }
  }

  const batchYield = (subRecipe.outputYield || 500) * batchMultiplier;
  subRecipe.currentStock = Number(((subRecipe.currentStock || 0) + batchYield).toFixed(1));
  subRecipe.lastConverted = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today";

  const summary = deducted.map(d => `${d.material} (${d.qty} ${d.unit})`).join(', ');
  const newLog: StockLog = {
    id: "log-" + Date.now(),
    itemName: `${subRecipe.name} (Prep Batch)`,
    type: "CONVERSION",
    quantity: batchYield,
    unit: subRecipe.yieldUnit || "gms",
    notes: `Prepped ${batchYield} ${subRecipe.yieldUnit} of ${subRecipe.name}. Deducted: ${summary}`,
    cost: 0,
    timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) + " Today"
  };
  store.logs.unshift(newLog);

  saveInventoryStore(store);
  return { subRecipe, batchYield, deducted };
}

// 11. Petpooja Module: Save or Update Multi-Stage Recipe
export function saveMultiStageRecipe(recipe: MultiStageRecipe) {
  const store = getInventoryStore();
  const index = store.multiStageRecipes.findIndex(m => m.id === recipe.id || m.conversionName.toLowerCase() === recipe.conversionName.toLowerCase());

  if (index !== -1) {
    store.multiStageRecipes[index] = { ...store.multiStageRecipes[index], ...recipe };
  } else {
    store.multiStageRecipes.push({
      ...recipe,
      id: recipe.id || "msr-" + Date.now()
    });
  }

  saveInventoryStore(store);
  return store.multiStageRecipes;
}

