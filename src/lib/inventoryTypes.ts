// Pure TypeScript Definitions and Default Master Data for Hotel Marquis Inventory (Client & Server Safe)

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

// Default initial master data
export const DEFAULT_INVENTORY_ITEMS: InventoryItem[] = [
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

export const DEFAULT_PURCHASES: VendorPurchase[] = [
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
    date: "Today, 08:00 AM",
    itemsSummary: "Green Bell Pepper (Capsicum 12kg), Spices (5kg)",
    totalAmount: 5124,
    paymentStatus: "PAID",
    paymentMethod: "BANK_TRANSFER",
    notes: "Weekly farm vegetable delivery"
  },
  {
    id: "pur-3",
    invoiceNo: "INV-MT-55",
    vendorName: "Mahalaxmi Traders",
    vendorPhone: "9823456789",
    date: "Yesterday, 04:30 PM",
    itemsSummary: "Basmati Rice (50kg), Sunflower Oil (30L), Kaju (5kg)",
    totalAmount: 13750,
    paymentStatus: "PAID",
    paymentMethod: "BANK_TRANSFER",
    notes: "Bulk dry grocery refill"
  },
  {
    id: "pur-4",
    invoiceNo: "INV-NM-12",
    vendorName: "Nashik Mandi Direct",
    vendorPhone: "9422778899",
    date: "Yesterday, 07:00 AM",
    itemsSummary: "Farm Fresh Tomatoes (25kg), Onions (30kg)",
    totalAmount: 1775,
    paymentStatus: "PAID",
    paymentMethod: "CASH",
    notes: "Mandi wholesale batch"
  }
];

export const DEFAULT_VENDORS: VendorAccount[] = [
  {
    id: "v-1",
    name: "Kalyan Dairy",
    category: "Fresh Full Cream Milk, Paneer, Butter, Cheese",
    phone: "9822334455",
    totalPurchased: 45200,
    totalPaid: 45200,
    pendingDue: 0,
    lastPaymentDate: "Today"
  },
  {
    id: "v-2",
    name: "Parthiv Agency",
    category: "Fresh Bell Peppers, Gourmet Grocery & Spices",
    phone: "9890123456",
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

export const DEFAULT_RECIPES: RecipeBOM[] = [
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

// Petpooja Module 3: Multi-Stage Recipes (Final Dishes with Auto Convert)
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
    toOutlet: "Line Kitchen",
    item: "Tomato Sauce / Base Gravy",
    qty: 5,
    unit: "Kg",
    status: "Processed",
    date: "Today, 09:45 AM",
    notes: "Rush hour prep"
  },
  {
    id: "tr-3",
    reqNo: "P0789L",
    fromOutlet: "Central Kitchen / Main Store",
    toOutlet: "Mocktail Bar",
    item: "Fresh Alphonso Mango Pulp",
    qty: 4,
    unit: "Kg",
    status: "Received",
    date: "Yesterday, 06:30 PM",
    notes: "Bar inventory top-up"
  }
];

export const DEFAULT_LOGS: StockLog[] = [
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

export const DEFAULT_RECONCILIATION: DailyReconciliation[] = [
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
