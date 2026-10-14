"use client";

import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Users, Search, Plus, Minus, ArrowLeft, Send, Receipt, 
  RotateCcw, Sparkles, AlertCircle, CheckCircle2, Clock, 
  ChevronRight, Utensils, Coffee, Pizza, Flame, ChefHat, RefreshCw, Printer,
  Bell, DollarSign, Smartphone, QrCode, X
} from "lucide-react";
import toast from "react-hot-toast";
import NavBar from "@/components/common/NavBar";

// Captains List
const DEFAULT_CAPTAINS = [
  "Rahul (Lead Captain)",
  "Manoj (Captain)",
  "Vikram (Captain)",
  "Suresh (Captain)"
];

// Fallback Default Menu items if Supabase menu is loading
const DEFAULT_MENU_ITEMS = [
  // --- Starters ---
  { id: "m-1", name: "Classic Paneer Tikka (6 Pcs)", category: "Starters", price: 260, isVeg: true },
  { id: "m-2", name: "Crispy Corn Pepper Salt", category: "Starters", price: 190, isVeg: true },
  { id: "m-3", name: "Hara Bhara Kabab (6 Pcs)", category: "Starters", price: 220, isVeg: true },
  { id: "m-4", name: "Dahi Ke Kebab (6 Pcs)", category: "Starters", price: 240, isVeg: true },
  { id: "m-5", name: "Crispy Veg Spring Rolls (8 Pcs)", category: "Starters", price: 190, isVeg: true },
  { id: "m-6", name: "Tandoori Mushroom Tikka", category: "Starters", price: 240, isVeg: true },
  { id: "m-7", name: "Tandoori Chicken (Half / 4 Pcs)", category: "Starters", price: 320, isVeg: false },
  { id: "m-8", name: "Chicken Tikka (6 Pcs)", category: "Starters", price: 310, isVeg: false },
  { id: "m-9", name: "Chicken Malai Tikka (6 Pcs)", category: "Starters", price: 340, isVeg: false },
  { id: "m-10", name: "Chicken Lollipop (6 Pcs)", category: "Starters", price: 280, isVeg: false },
  { id: "m-11", name: "Chicken Seekh Kebab", category: "Starters", price: 330, isVeg: false },
  { id: "m-12", name: "Amritsari Fish Tikka (5 Pcs)", category: "Starters", price: 380, isVeg: false },

  // --- Main Course ---
  { id: "m-13", name: "Butter Chicken (Murgh Makhani)", category: "Main Course", price: 350, isVeg: false },
  { id: "m-14", name: "Chicken Tikka Masala", category: "Main Course", price: 360, isVeg: false },
  { id: "m-15", name: "Kadhai Chicken", category: "Main Course", price: 340, isVeg: false },
  { id: "m-16", name: "Kashmiri Mutton Rogan Josh", category: "Main Course", price: 460, isVeg: false },
  { id: "m-17", name: "Dal Makhani (Grandma's Style)", category: "Main Course", price: 230, isVeg: true },
  { id: "m-18", name: "Yellow Dal Double Tadka", category: "Main Course", price: 180, isVeg: true },
  { id: "m-19", name: "Paneer Butter Masala", category: "Main Course", price: 280, isVeg: true },
  { id: "m-20", name: "Kadhai Paneer Special", category: "Main Course", price: 290, isVeg: true },
  { id: "m-21", name: "Lahori Palak Paneer", category: "Main Course", price: 270, isVeg: true },
  { id: "m-22", name: "Shahi Malai Kofta", category: "Main Course", price: 290, isVeg: true },
  { id: "m-23", name: "Subz Mix Veg Handi", category: "Main Course", price: 240, isVeg: true },
  { id: "m-24", name: "Dum Aloo Kashmiri", category: "Main Course", price: 220, isVeg: true },

  // --- Breads ---
  { id: "m-25", name: "Garlic Butter Naan", category: "Breads", price: 60, isVeg: true },
  { id: "m-26", name: "Butter Naan", category: "Breads", price: 50, isVeg: true },
  { id: "m-27", name: "Cheese Garlic Naan", category: "Breads", price: 90, isVeg: true },
  { id: "m-28", name: "Tandoori Roti (Plain)", category: "Breads", price: 25, isVeg: true },
  { id: "m-29", name: "Butter Tandoori Roti", category: "Breads", price: 30, isVeg: true },
  { id: "m-30", name: "Laccha Paratha", category: "Breads", price: 55, isVeg: true },

  // --- Rice & Biryani ---
  { id: "m-31", name: "Hyderabadi Chicken Dum Biryani", category: "Rice & Biryani", price: 340, isVeg: false },
  { id: "m-32", name: "Royal Mutton Dum Biryani", category: "Rice & Biryani", price: 450, isVeg: false },
  { id: "m-33", name: "Nawabi Veg Dum Biryani", category: "Rice & Biryani", price: 240, isVeg: true },
  { id: "m-34", name: "Jeera Rice", category: "Rice & Biryani", price: 160, isVeg: true },
  { id: "m-35", name: "Steamed Basmati Rice", category: "Rice & Biryani", price: 130, isVeg: true },

  // --- Chinese ---
  { id: "m-36", name: "Chilli Paneer (Dry / Gravy)", category: "Chinese", price: 240, isVeg: true },
  { id: "m-37", name: "Veg Manchurian (Dry / Gravy)", category: "Chinese", price: 210, isVeg: true },
  { id: "m-38", name: "Veg Hakka Noodles", category: "Chinese", price: 180, isVeg: true },
  { id: "m-39", name: "Chicken Schezwan Fried Rice", category: "Chinese", price: 230, isVeg: false },

  // --- Desserts ---
  { id: "m-40", name: "Gulab Jamun (2 Pcs with Rabri)", category: "Desserts", price: 90, isVeg: true },
  { id: "m-41", name: "Kesar Pista Rasmalai (2 Pcs)", category: "Desserts", price: 120, isVeg: true },
  { id: "m-42", name: "Gajar Ka Halwa (Desi Ghee)", category: "Desserts", price: 130, isVeg: true },
  { id: "m-43", name: "Shahi Matka Kulfi", category: "Desserts", price: 90, isVeg: true },

  // --- Beverages ---
  { id: "m-44", name: "Masala Chaas (Spiced Buttermilk)", category: "Beverages", price: 50, isVeg: true },
  { id: "m-45", name: "Oreo Mudslide Thick Shake", category: "Beverages", price: 150, isVeg: true },
  { id: "m-46", name: "Sweet Amritsari Punjabi Lassi", category: "Beverages", price: 80, isVeg: true },
  { id: "m-47", name: "Alphonso Mango Lassi", category: "Beverages", price: 100, isVeg: true },
  { id: "m-48", name: "Fresh Lime Soda (Sweet & Salt)", category: "Beverages", price: 70, isVeg: true },
  { id: "m-49", name: "Cold Coffee with Vanilla Ice Cream", category: "Beverages", price: 120, isVeg: true },
  { id: "m-50", name: "Packaged Mineral Water (1L)", category: "Beverages", price: 30, isVeg: true },

  // --- Chinese Starter Non Veg ---
  { id: "m-51", name: "Chicken Paper", category: "Chinese Starter Non Veg", price: 240, isVeg: false },
  { id: "m-52", name: "Chicken Tukada", category: "Chinese Starter Non Veg", price: 250, isVeg: false },
  { id: "m-53", name: "Chicken Spring Roll", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-54", name: "Chicken Manchurian (Dry)", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-55", name: "Chicken 65", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-56", name: "Chicken Crispy", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-57", name: "Chicken Satay", category: "Chinese Starter Non Veg", price: 250, isVeg: false },
  { id: "m-58", name: "Chicken Kantki", category: "Chinese Starter Non Veg", price: 230, isVeg: false },
  { id: "m-59", name: "Chicken Dry Mint", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-60", name: "Chicken Hot Garlic", category: "Chinese Starter Non Veg", price: 260, isVeg: false },
  { id: "m-61", name: "Chicken Chilly (Dry)", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-62", name: "Chicken Chilly (With Bone)", category: "Chinese Starter Non Veg", price: 270, isVeg: false },
  { id: "m-63", name: "Chicken Garlic", category: "Chinese Starter Non Veg", price: 220, isVeg: false },
  { id: "m-64", name: "Chicken Sizzler", category: "Chinese Starter Non Veg", price: 480, isVeg: false },
  { id: "m-65", name: "Chicken Bhuna", category: "Chinese Starter Non Veg", price: 250, isVeg: false },
  { id: "m-66", name: "Chicken Koliwada", category: "Chinese Starter Non Veg", price: 300, isVeg: false },

  // --- Non Veg Snacks Counter ---
  { id: "m-67", name: "Egg Boiled (2 Pcs)", category: "Non Veg Snacks Counter", price: 40, isVeg: false },
  { id: "m-68", name: "Egg Bhurji (2 Eggs)", category: "Non Veg Snacks Counter", price: 70, isVeg: false },
  { id: "m-69", name: "Egg Sandwich", category: "Non Veg Snacks Counter", price: 40, isVeg: false },
  { id: "m-70", name: "Egg Pakoda", category: "Non Veg Snacks Counter", price: 50, isVeg: false },
  { id: "m-71", name: "Egg Omlet (Double Egg)", category: "Non Veg Snacks Counter", price: 60, isVeg: false },
  { id: "m-72", name: "Egg Boiled Fry", category: "Non Veg Snacks Counter", price: 50, isVeg: false },
  { id: "m-73", name: "Egg Boiled Fry Bhurji", category: "Non Veg Snacks Counter", price: 80, isVeg: false },
  { id: "m-74", name: "Egg Curry (2 Eggs)", category: "Non Veg Snacks Counter", price: 110, isVeg: false },
  { id: "m-75", name: "Egg Masala", category: "Non Veg Snacks Counter", price: 120, isVeg: false },
  { id: "m-76", name: "Egg Chilly", category: "Non Veg Snacks Counter", price: 150, isVeg: false },
  { id: "m-77", name: "Mutton Khima-Pav", category: "Non Veg Snacks Counter", price: 120, isVeg: false },
  { id: "m-78", name: "Chicken Sandwich", category: "Non Veg Snacks Counter", price: 100, isVeg: false },
  { id: "m-79", name: "Mutton Sandwich", category: "Non Veg Snacks Counter", price: 90, isVeg: false },

  // --- Vegetarian Guests ---
  { id: "m-80", name: "Palak Mutter", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-81", name: "Gobi Mutter", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-82", name: "Bhendi Masala", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-83", name: "Bhendi Fry", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-84", name: "Bhendi Tawa", category: "Vegetarian Guests", price: 200, isVeg: true },
  { id: "m-85", name: "Alu Mutter", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-86", name: "Chana Masala", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-87", name: "Alu Palak", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-88", name: "Pitla", category: "Vegetarian Guests", price: 120, isVeg: true },
  { id: "m-89", name: "Thecha", category: "Vegetarian Guests", price: 70, isVeg: true },
  { id: "m-90", name: "Baigan Masala", category: "Vegetarian Guests", price: 130, isVeg: true },
  { id: "m-91", name: "Dal Fry", category: "Vegetarian Guests", price: 90, isVeg: true },

  // --- Paneer Ki Pasand ---
  { id: "m-92", name: "Paneer Tikka Masala", category: "Paneer Ki Pasand", price: 220, isVeg: true },
  { id: "m-93", name: "Paneer Butter Masala (Special)", category: "Paneer Ki Pasand", price: 190, isVeg: true },
  { id: "m-94", name: "Paneer Bhurji", category: "Paneer Ki Pasand", price: 200, isVeg: true },
  { id: "m-95", name: "Paneer Kofta", category: "Paneer Ki Pasand", price: 190, isVeg: true },
  { id: "m-96", name: "Paneer Palak", category: "Paneer Ki Pasand", price: 170, isVeg: true },
  { id: "m-97", name: "Paneer Pasanda", category: "Paneer Ki Pasand", price: 210, isVeg: true },
  { id: "m-98", name: "Paneer Handi", category: "Paneer Ki Pasand", price: 220, isVeg: true },
  { id: "m-99", name: "Paneer Kadai", category: "Paneer Ki Pasand", price: 220, isVeg: true },
  { id: "m-100", name: "Paneer Rajwadi", category: "Paneer Ki Pasand", price: 240, isVeg: true },
  { id: "m-101", name: "Paneer Patiyala", category: "Paneer Ki Pasand", price: 280, isVeg: true },
  { id: "m-102", name: "Paneer Chilly Milly", category: "Paneer Ki Pasand", price: 210, isVeg: true },
  { id: "m-103", name: "Paneer Maharaja", category: "Paneer Ki Pasand", price: 270, isVeg: true },
  { id: "m-104", name: "Paneer Rara", category: "Paneer Ki Pasand", price: 250, isVeg: true },
  { id: "m-105", name: "Paneer Tawa", category: "Paneer Ki Pasand", price: 240, isVeg: true },
  { id: "m-106", name: "Paneer Masala", category: "Paneer Ki Pasand", price: 180, isVeg: true },
  { id: "m-107", name: "Paneer Toofani", category: "Paneer Ki Pasand", price: 240, isVeg: true },
  { id: "m-108", name: "Paneer Angara", category: "Paneer Ki Pasand", price: 260, isVeg: true },
  { id: "m-109", name: "Paneer Mutter", category: "Paneer Ki Pasand", price: 170, isVeg: true },
  { id: "m-110", name: "Paneer Makhanwala", category: "Paneer Ki Pasand", price: 190, isVeg: true },
  { id: "m-111", name: "Paneer Lajawab", category: "Paneer Ki Pasand", price: 280, isVeg: true },
  { id: "m-112", name: "Paneer Lachhadar", category: "Paneer Ki Pasand", price: 260, isVeg: true },

  // --- Amrut Garden Veg Special ---
  { id: "m-113", name: "Veg Sultana", category: "Amrut Garden Veg Special", price: 220, isVeg: true },
  { id: "m-114", name: "Veg Tiranga", category: "Amrut Garden Veg Special", price: 260, isVeg: true },

  // --- Chinese Rice ---
  { id: "m-115", name: "American Chopcuey Non Veg", category: "Chinese Rice", price: 250, isVeg: false },
  { id: "m-116", name: "Chicken Hakka Noodles", category: "Chinese Rice", price: 200, isVeg: false },
  { id: "m-117", name: "Chicken Sezwan Fried Rice", category: "Chinese Rice", price: 210, isVeg: false },
  { id: "m-118", name: "Chicken Triple Sezwan Rice", category: "Chinese Rice", price: 310, isVeg: false },
  { id: "m-119", name: "Prawns Fried Rice", category: "Chinese Rice", price: 310, isVeg: false },
  { id: "m-120", name: "Chicken Chowmein", category: "Chinese Rice", price: 200, isVeg: false },
  { id: "m-121", name: "Chicken Fried Rice", category: "Chinese Rice", price: 200, isVeg: false },
  { id: "m-122", name: "Egg Fried Rice", category: "Chinese Rice", price: 160, isVeg: false },
  { id: "m-123", name: "Non Veg Mix Fried Rice", category: "Chinese Rice", price: 310, isVeg: false },
  { id: "m-124", name: "Chicken Tikka Biryani", category: "Chinese Rice", price: 280, isVeg: false },

  // --- Roti Ki Khasiat ---
  { id: "m-125", name: "Roti", category: "Roti Ki Khasiat", price: 20, isVeg: true },
  { id: "m-126", name: "Butter Roti", category: "Roti Ki Khasiat", price: 25, isVeg: true },
  { id: "m-127", name: "Naan / Paratha / Kulcha", category: "Roti Ki Khasiat", price: 40, isVeg: true },
  { id: "m-128", name: "Butter Naan / Paratha / Kulcha", category: "Roti Ki Khasiat", price: 50, isVeg: true },
  { id: "m-129", name: "Chapati", category: "Roti Ki Khasiat", price: 15, isVeg: true },
  { id: "m-130", name: "Roti Ki Basket", category: "Roti Ki Khasiat", price: 300, isVeg: true },
  { id: "m-131", name: "Bhakri", category: "Roti Ki Khasiat", price: 20, isVeg: true },
  { id: "m-132", name: "Masala Kulcha", category: "Roti Ki Khasiat", price: 60, isVeg: true },
  { id: "m-133", name: "Stuff Paratha", category: "Roti Ki Khasiat", price: 100, isVeg: true },
  { id: "m-134", name: "Kashmiri Naan", category: "Roti Ki Khasiat", price: 80, isVeg: true }
];

export default function CaptainPortal() {
  const [orders, setOrders] = useState<any[]>([]);
  const [captainsList, setCaptainsList] = useState<string[]>(DEFAULT_CAPTAINS);
  const [selectedCaptain, setSelectedCaptain] = useState<string>(DEFAULT_CAPTAINS[0]);
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [menuItems, setMenuItems] = useState<any[]>(DEFAULT_MENU_ITEMS);
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FREE" | "OCCUPIED" | "BILLING">("ALL");
  const [loading, setLoading] = useState(true);

  // Punching Cart state: { [itemId]: { item, qty } }
  const [cart, setCart] = useState<{ [id: string]: { item: any; qty: number } }>({});
  const [cookingNotes, setCookingNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [guestCount, setGuestCount] = useState<number>(2);
  const [isPunching, setIsPunching] = useState(false);

  // Table Shift / Transfer Modal state
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [targetShiftTable, setTargetShiftTable] = useState("");

  // Bill & Settlement Modal state (Cashier Alert vs Direct Settle)
  const [isBillModalOpen, setIsBillModalOpen] = useState(false);
  const [billSettlementTab, setBillSettlementTab] = useState<'options' | 'upi_qr'>('options');
  const [isSettling, setIsSettling] = useState(false);
  const [customerPhone, setCustomerPhone] = useState("");

  // Load orders, menu, and dynamic captains list
  useEffect(() => {
    // 1. Fetch dynamic captains from server
    fetch("/api/admin/captains")
      .then(res => res.json())
      .then(data => {
        if (data.success && Array.isArray(data.captains) && data.captains.length > 0) {
          setCaptainsList(data.captains);
          const savedCaptain = typeof window !== 'undefined' ? localStorage.getItem('wb_selected_captain') : null;
          if (savedCaptain && data.captains.includes(savedCaptain)) {
            setSelectedCaptain(savedCaptain);
          } else {
            setSelectedCaptain(data.captains[0]);
          }
        }
      })
      .catch(() => {});

    if (typeof window !== 'undefined') {
      const savedCaptain = localStorage.getItem('wb_selected_captain');
      if (savedCaptain) {
        setSelectedCaptain(savedCaptain);
      }
    }
    fetchOrders();
    fetchMenu();

    const channel = supabase
      .channel("captain-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, () => {
        fetchOrders();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  const fetchOrders = async () => {
    const { data } = await supabase
      .from("orders")
      .select("*")
      .neq("status", "archived")
      .neq("status", "completed")
      .neq("status", "rejected")
      .order("created_at", { ascending: false });

    if (data) setOrders(data);
    setLoading(false);
  };

  const fetchMenu = async () => {
    const { data } = await supabase.from("menu").select("*");
    if (data && data.length > 0) {
      const formatted = data.map(d => ({
        id: d.id,
        name: d.name,
        category: d.section || "Main Course",
        price: d.price,
        isVeg: !d.name.toLowerCase().includes("chicken") && 
               !d.name.toLowerCase().includes("mutton") && 
               !d.name.toLowerCase().includes("egg") && 
               !d.name.toLowerCase().includes("fish") &&
               !d.name.toLowerCase().includes("prawn") &&
               !d.name.toLowerCase().includes("non veg")
      }));
      setMenuItems(formatted);
    }
  };

  // Group active orders by table
  const tableGroups: { [table: string]: any } = {};
  orders.forEach(order => {
    const t = String(order.table_number);
    if (!tableGroups[t]) {
      tableGroups[t] = {
        table: t,
        orders: [],
        total: 0,
        requestedBill: false,
        startTime: order.created_at
      };
    }
    tableGroups[t].orders.push(order);
    tableGroups[t].total += Number(order.total_amount || 0);
    if (order.status === "billing") {
      tableGroups[t].requestedBill = true;
    }
  });

  // 15 Standard Dine-in Tables
  const tablesList = Array.from({ length: 15 }, (_, i) => String(i + 1)).map(tNum => {
    const group = tableGroups[tNum];
    let status: "FREE" | "OCCUPIED" | "BILLING" = "FREE";
    if (group) {
      status = group.requestedBill ? "BILLING" : "OCCUPIED";
    }
    return {
      tableNumber: tNum,
      status,
      group,
      total: group ? group.total : 0,
      itemCount: group ? group.orders.reduce((acc: number, o: any) => {
        try {
          const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
          return acc + (Array.isArray(parsed) ? parsed.filter(i => i.id !== "NOTE").length : 0);
        } catch (e) {
          return acc;
        }
      }, 0) : 0,
      startTime: group?.startTime
    };
  });

  // Filtered tables
  const filteredTables = tablesList.filter(t => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  // Categories
  const categories = ["ALL", ...Array.from(new Set(menuItems.map(m => m.category)))];

  // Cart Helpers
  const addToCart = (item: any) => {
    setCart(prev => ({
      ...prev,
      [item.id]: {
        item,
        qty: (prev[item.id]?.qty || 0) + 1
      }
    }));
  };

  const removeFromCart = (itemId: string) => {
    setCart(prev => {
      const existing = prev[itemId];
      if (!existing) return prev;
      if (existing.qty <= 1) {
        const copy = { ...prev };
        delete copy[itemId];
        return copy;
      }
      return {
        ...prev,
        [itemId]: {
          ...existing,
          qty: existing.qty - 1
        }
      };
    });
  };

  const cartItems = Object.values(cart);
  const cartItemCount = cartItems.reduce((acc, c) => acc + c.qty, 0);
  const cartSubtotal = cartItems.reduce((acc, c) => acc + (c.item.price * c.qty), 0);

  // Send / Punch KOT to Kitchen via backend API
  const handlePunchKOT = async () => {
    if (!selectedTable) return;
    if (cartItems.length === 0) return toast.error("Please add items to punch KOT");
    if (isPunching) return;

    setIsPunching(true);

    const formattedItems = cartItems.map(c => ({
      id: c.item.id,
      name: c.item.name,
      price: c.item.price,
      qty: c.qty,
      image: null
    }));

    if (cookingNotes.trim()) {
      formattedItems.push({
        id: "NOTE",
        name: `Captain Note (${selectedCaptain}): ${cookingNotes.trim()}`,
        price: 0,
        qty: 1,
        image: null
      });
    }

    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-staff-access": "pos_secure_override"
        },
        body: JSON.stringify({
          table_number: selectedTable,
          items: formattedItems
        })
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.message || "Failed to punch KOT");
      }

      const orderNumber = data.orderNumber || Math.floor(1000 + Math.random() * 9000);

      toast.success(`KOT #${orderNumber} Punched for Table ${selectedTable}!`, {
        icon: "🚀",
        duration: 4000
      });

      // Clear cart
      setCart({});
      setCookingNotes("");
      fetchOrders();
    } catch (err: any) {
      toast.error(err.message || "Failed to punch KOT");
    } finally {
      setIsPunching(false);
    }
  };

  // Option 1: Alert Cashier Counter (Standard Fine-Dine)
  const handleAlertCashier = async (tableNum: string) => {
    const group = tableGroups[tableNum];
    if (!group || group.orders.length === 0) return;

    try {
      const orderIds = group.orders.map((o: any) => o.id);
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-access': 'pos_secure_override'
        },
        body: JSON.stringify({
          orderIds,
          status: 'billing'
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to alert cashier');

      toast.success(`Bill Requested for Table ${tableNum}! Cashier alerted to print slip.`, {
        icon: "🔔",
        duration: 4000
      });
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || "Failed to request bill");
    }
  };

  // Option 2: Direct Settle at Table (Cash / UPI)
  const handleDirectSettle = async (tableNum: string, paymentMethod: 'CASH' | 'UPI') => {
    const group = tableGroups[tableNum];
    if (!group || group.orders.length === 0) return;

    setIsSettling(true);
    try {
      const orderIds = group.orders.map((o: any) => o.id);
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'x-staff-access': 'pos_secure_override'
        },
        body: JSON.stringify({
          orderIds,
          status: 'completed',
          paymentMethod,
          customerPhone: customerPhone.trim() || undefined
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to settle table');

      toast.success(`Table ${tableNum} Settled via ${paymentMethod} (₹${group.total})! Table is now Available.`, {
        icon: "✅",
        duration: 4500
      });

      setIsBillModalOpen(false);
      setBillSettlementTab('options');
      setCustomerPhone("");
      setSelectedTable(null);
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || "Failed to settle table");
    } finally {
      setIsSettling(false);
    }
  };

  // Transfer / Shift Table
  const handleShiftTable = async () => {
    if (!selectedTable || !targetShiftTable) return;
    if (selectedTable === targetShiftTable) return toast.error("Choose a different table");
    const group = tableGroups[selectedTable];
    if (!group || group.orders.length === 0) return;

    try {
      const orderIds = group.orders.map((o: any) => o.id);
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ orderIds, newTableNumber: targetShiftTable })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to shift table');

      toast.success(`Table ${selectedTable} successfully shifted to Table ${targetShiftTable}!`, {
        icon: "🔄"
      });

      setIsShiftModalOpen(false);
      setSelectedTable(targetShiftTable);
      setTargetShiftTable("");
      fetchOrders();
    } catch (e: any) {
      toast.error("Failed to shift table");
    }
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesCategory && matchesSearch;
  });

  const selectedGroup = selectedTable ? tableGroups[selectedTable] : null;

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      {/* Top Header Bar */}
      <div className="bg-[#1E1B16] text-white sticky top-0 z-40 px-4 py-3 shadow-md flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-zinc-800 text-white flex items-center justify-center font-bold text-lg shadow-xs border border-zinc-700">
            <ChefHat size={20} strokeWidth={1.75} />
          </div>
          <div>
            <h1 className="font-playfair font-bold text-base tracking-wide flex items-center gap-2">
              Captain Portal
              <span className="text-[10px] bg-green-500/20 text-green-400 border border-green-500/30 px-2 py-0.5 rounded-full font-sans font-bold">
                LIVE
              </span>
            </h1>
            <p className="text-[11px] text-gray-400">Hotel White Bliss • Waiter POS</p>
          </div>
        </div>

        {/* Captain Selector */}
        <div className="flex items-center gap-2">
          <select
            value={selectedCaptain}
            onChange={e => {
              const val = e.target.value;
              setSelectedCaptain(val);
              if (typeof window !== 'undefined') {
                localStorage.setItem('wb_selected_captain', val);
              }
              toast.success(`Active Captain: ${val}`, { icon: "👤" });
            }}
            className="bg-white/10 text-white text-xs font-bold py-1.5 px-3 rounded-xl border border-white/20 focus:outline-none focus:ring-1 focus:ring-[#A18D6D] cursor-pointer"
          >
            {captainsList.map(c => (
              <option key={c} value={c} className="bg-gray-900 text-white">
                {c}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* VIEW 1: TABLE FLOOR OVERVIEW (When no table selected) */}
      {!selectedTable && (
        <div className="flex-1 p-3 sm:p-4 max-w-5xl mx-auto w-full space-y-4 pb-28 sm:pb-12">
          {/* Status Filter Bar (Responsive 4-col Grid + Refresh) */}
          <div className="flex items-center gap-1.5">
            <div className="grid grid-cols-4 gap-1 flex-1 text-[11px] sm:text-xs font-bold">
              <button
                onClick={() => setStatusFilter("ALL")}
                className={`py-1.5 px-0.5 sm:px-3 rounded-xl transition text-center truncate ${
                  statusFilter === "ALL" ? "bg-gray-900 text-white shadow font-extrabold" : "bg-white text-gray-700 border"
                }`}
              >
                All (15)
              </button>
              <button
                onClick={() => setStatusFilter("FREE")}
                className={`py-1.5 px-0.5 sm:px-3 rounded-xl transition text-center truncate flex items-center justify-center gap-1 ${
                  statusFilter === "FREE" ? "bg-green-600 text-white shadow font-extrabold" : "bg-white text-green-700 border border-green-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"></span>
                <span className="truncate">Free ({tablesList.filter(t => t.status === "FREE").length})</span>
              </button>
              <button
                onClick={() => setStatusFilter("OCCUPIED")}
                className={`py-1.5 px-0.5 sm:px-3 rounded-xl transition text-center truncate flex items-center justify-center gap-1 ${
                  statusFilter === "OCCUPIED" ? "bg-blue-600 text-white shadow font-extrabold" : "bg-white text-blue-700 border border-blue-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                <span className="truncate">Dining ({tablesList.filter(t => t.status === "OCCUPIED").length})</span>
              </button>
              <button
                onClick={() => setStatusFilter("BILLING")}
                className={`py-1.5 px-0.5 sm:px-3 rounded-xl transition text-center truncate flex items-center justify-center gap-1 ${
                  statusFilter === "BILLING" ? "bg-amber-600 text-white shadow font-extrabold" : "bg-white text-amber-700 border border-amber-200"
                }`}
              >
                <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                <span className="truncate">Bill ({tablesList.filter(t => t.status === "BILLING").length})</span>
              </button>
            </div>

            <button
              onClick={fetchOrders}
              className="p-2 bg-white border border-gray-200 rounded-xl text-gray-600 hover:text-gray-900 shadow-sm shrink-0"
              title="Refresh"
            >
              <RefreshCw size={14} />
            </button>
          </div>

          {/* 15 Tables Floor Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-3">
            {filteredTables.map(t => {
              const isFree = t.status === "FREE";
              const isOccupied = t.status === "OCCUPIED";
              const isBilling = t.status === "BILLING";

              return (
                <button
                  key={t.tableNumber}
                  onClick={() => {
                    setSelectedTable(t.tableNumber);
                    setCart({});
                    setCookingNotes("");
                  }}
                  className={`p-4 rounded-2xl border text-left flex flex-col justify-between transition-all active:scale-95 shadow-sm min-h-[110px] ${
                    isBilling
                      ? "bg-amber-50 border-amber-300 ring-2 ring-amber-400 animate-pulse"
                      : isOccupied
                      ? "bg-blue-50 border-blue-200 hover:border-blue-400"
                      : "bg-white border-gray-200 hover:border-green-400"
                  }`}
                >
                  <div className="flex items-start justify-between w-full">
                    <div>
                      <span className="text-lg font-black text-gray-900">
                        Table {t.tableNumber}
                      </span>
                      {isFree && (
                        <p className="text-[11px] font-medium text-emerald-700 mt-0.5 flex items-center gap-1">
                          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span> Available
                        </p>
                      )}
                    </div>
                    {isBilling && (
                      <span className="text-[10px] font-semibold bg-amber-100 text-amber-900 border border-amber-300 px-2 py-0.5 rounded">
                        BILL
                      </span>
                    )}
                  </div>

                  {isOccupied && (
                    <div className="mt-2 pt-2 border-t border-blue-100 flex items-center justify-between text-xs">
                      <div>
                        <span className="font-semibold font-mono text-blue-900 text-sm">₹{t.total}</span>
                        <span className="text-[10px] text-blue-600 block">{t.itemCount} Items</span>
                      </div>
                      <span className="text-[10px] font-semibold text-blue-700 bg-blue-100/70 px-2 py-0.5 rounded">
                        Dining
                      </span>
                    </div>
                  )}

                  {isBilling && (
                    <div className="mt-2 pt-2 border-t border-amber-200 flex items-center justify-between text-xs">
                      <span className="font-semibold font-mono text-amber-900 text-sm">₹{t.total}</span>
                      <span className="text-[10px] font-semibold text-amber-900 bg-amber-100 px-2 py-0.5 rounded">
                        Bill Requested
                      </span>
                    </div>
                  )}

                  {isFree && (
                    <div className="mt-2 pt-2 border-t border-gray-100 text-right">
                      <span className="text-[11px] font-medium text-emerald-700 flex items-center justify-end gap-1">
                        Take Order <ChevronRight size={13} />
                      </span>
                    </div>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* VIEW 2: SELECTED TABLE ORDERING & RUNNING KOT PUNCH */}
      {selectedTable && (
        <div className="flex-1 flex flex-col bg-gray-50 max-w-4xl mx-auto w-full pb-28">
          {/* Table Header Bar */}
          <div className="bg-white border-b border-gray-200 p-3.5 px-4 sticky top-14 z-30 flex items-center justify-between shadow-xs">
            <div className="flex items-center gap-3">
              <button
                onClick={() => setSelectedTable(null)}
                className="p-2 hover:bg-gray-100 rounded-xl text-gray-700"
              >
                <ArrowLeft size={20} />
              </button>
              <div>
                <h2 className="text-xl font-black text-gray-900 flex items-center gap-2">
                  Table {selectedTable}
                  {selectedGroup ? (
                    <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2 py-0.5 rounded-full">
                      ₹{selectedGroup.total} Running
                    </span>
                  ) : (
                    <span className="text-xs bg-green-100 text-green-800 font-bold px-2 py-0.5 rounded-full">
                      New Seating
                    </span>
                  )}
                </h2>
                <p className="text-[11px] text-gray-500">Captain: {selectedCaptain}</p>
              </div>
            </div>

            {/* Table Actions Menu */}
            <div className="flex items-center gap-2">
              {selectedGroup && (
                <>
                  <button
                    onClick={() => setIsShiftModalOpen(true)}
                    className="p-2 text-xs font-bold text-gray-700 bg-gray-100 hover:bg-gray-200 rounded-xl flex items-center gap-1"
                    title="Shift to Another Table"
                  >
                    <RotateCcw size={14} /> Shift
                  </button>
                  <button
                    onClick={() => {
                      setIsBillModalOpen(true);
                    }}
                    className={`px-3 py-1.5 text-xs font-bold rounded-xl flex items-center gap-1.5 border transition ${
                      selectedGroup.requestedBill
                        ? "text-amber-900 bg-amber-200 hover:bg-amber-300 border-amber-400 ring-2 ring-amber-300 animate-pulse"
                        : "text-amber-800 bg-amber-100 hover:bg-amber-200 border-amber-300 shadow-xs"
                    }`}
                  >
                    <Receipt size={14} />
                    <span>{selectedGroup.requestedBill ? "⏳ Bill Requested" : "🧾 Request Bill"}</span>
                  </button>
                </>
              )}
            </div>
          </div>

          <div className="p-4 space-y-5">
            {/* 1. RUNNING KOTs (If Table is already occupied) */}
            {selectedGroup && selectedGroup.orders.length > 0 && (
              <div className="bg-white p-4 rounded-2xl border border-blue-200 shadow-sm space-y-3">
                <div className="flex items-center justify-between border-b border-gray-100 pb-2">
                  <h3 className="text-sm font-bold text-gray-900 flex items-center gap-2">
                    <Utensils size={16} className="text-blue-600" />
                    Running Orders in Kitchen ({selectedGroup.orders.length} KOTs)
                  </h3>
                  <span className="text-xs font-extrabold text-blue-700">
                    Total: ₹{selectedGroup.total}
                  </span>
                </div>

                <div className="space-y-2 max-h-48 overflow-y-auto">
                  {selectedGroup.orders.map((ord: any) => {
                    let items: any[] = [];
                    try {
                      items = typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items;
                    } catch (e) {}

                    return (
                      <div key={ord.id} className="bg-gray-50 p-2.5 rounded-xl text-xs space-y-1">
                        <div className="flex justify-between font-bold text-gray-500 text-[11px]">
                          <span>KOT #{ord.order_number || ord.id.slice(0, 4)}</span>
                          <span className="uppercase text-blue-600 font-extrabold">{ord.status}</span>
                        </div>
                        {Array.isArray(items) && items.filter(i => i.id !== "NOTE").map((it, idx) => (
                          <div key={idx} className="flex justify-between text-gray-800">
                            <span>{it.qty}x {it.name}</span>
                            <span className="font-semibold">₹{it.price * it.qty}</span>
                          </div>
                        ))}
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* 2. FAST ITEM SEARCH & CATEGORIES */}
            <div className="space-y-3">
              <div className="relative">
                <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
                <input
                  type="text"
                  placeholder="Quick search dishes (e.g. naan, butter chicken)..."
                  value={searchQuery}
                  onChange={e => setSearchQuery(e.target.value)}
                  className="w-full pl-10 pr-4 py-2.5 text-sm bg-white border border-gray-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-gray-900/10 shadow-xs"
                />
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-2 overflow-x-auto pb-1">
                {categories.map(cat => (
                  <button
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition ${
                      activeCategory === cat
                        ? "bg-gray-900 text-white shadow-sm"
                        : "bg-white text-gray-700 border border-gray-200 hover:bg-gray-50"
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* 3. MENU ITEMS FAST PUNCH LIST */}
            <div className="space-y-2">
              <h4 className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                Select Items to Add
              </h4>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {filteredMenuItems.map(item => {
                  const qtyInCart = cart[item.id]?.qty || 0;

                  return (
                    <div
                      key={item.id}
                      className={`p-3 rounded-xl border flex items-center justify-between transition-all ${
                        qtyInCart > 0
                          ? "bg-amber-50/60 border-[#A18D6D] ring-1 ring-[#A18D6D]"
                          : "bg-white border-gray-200"
                      }`}
                    >
                      <div className="flex items-center gap-2.5 flex-1 pr-2">
                        <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 ${
                          item.isVeg ? "border-green-600" : "border-red-600"
                        }`}>
                          <span className={`w-1.5 h-1.5 rounded-full ${
                            item.isVeg ? "bg-green-600" : "bg-red-600"
                          }`}></span>
                        </span>
                        <div>
                          <div className="font-bold text-gray-900 text-xs sm:text-sm leading-tight">
                            {item.name}
                          </div>
                          <div className="font-extrabold text-xs text-[#A18D6D] mt-0.5">
                            ₹{item.price}
                          </div>
                        </div>
                      </div>

                      {/* Quantity Controls */}
                      <div className="flex items-center gap-2 shrink-0">
                        {qtyInCart > 0 ? (
                          <div className="flex items-center gap-2 bg-gray-900 text-white rounded-xl p-1 shadow-xs">
                            <button
                              onClick={() => removeFromCart(item.id)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg active:scale-90"
                            >
                              <Minus size={14} />
                            </button>
                            <span className="font-extrabold text-sm w-4 text-center">
                              {qtyInCart}
                            </span>
                            <button
                              onClick={() => addToCart(item)}
                              className="w-7 h-7 flex items-center justify-center hover:bg-white/20 rounded-lg active:scale-90"
                            >
                              <Plus size={14} />
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => addToCart(item)}
                            className="px-3 py-1.5 bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold text-xs rounded-xl transition active:scale-95 border border-gray-200"
                          >
                            + ADD
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* 4. COOKING INSTRUCTION NOTE */}
            {cartItemCount > 0 && (
              <div className="bg-white p-3 rounded-2xl border border-gray-200 space-y-2">
                <label className="block text-xs font-bold text-gray-700">
                  Kitchen Instructions (Optional):
                </label>
                <div className="flex flex-wrap gap-1.5 mb-2">
                  {["Extra Spicy", "Jain / No Onion", "Extra Butter", "Crispy Well-Done", "Less Oil"].map(tag => (
                    <button
                      key={tag}
                      type="button"
                      onClick={() => setCookingNotes(prev => prev ? `${prev}, ${tag}` : tag)}
                      className="text-[11px] font-medium bg-zinc-100 hover:bg-zinc-200 text-zinc-700 px-2.5 py-1 rounded-md transition"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
                <input
                  type="text"
                  placeholder="e.g. Serve starters first, less salt..."
                  value={cookingNotes}
                  onChange={e => setCookingNotes(e.target.value)}
                  className="w-full text-xs p-2.5 bg-zinc-50 border border-zinc-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-zinc-900"
                />
              </div>
            )}
          </div>

          {/* FIXED BOTTOM ACTION BAR (When items in cart) */}
          {cartItemCount > 0 && (
            <div className="fixed bottom-0 left-0 w-full bg-white border-t border-zinc-200 p-3 px-4 shadow-xl z-50">
              <div className="max-w-4xl mx-auto flex items-center justify-between gap-4">
                <div>
                  <span className="text-xs text-zinc-500 font-medium block">
                    {cartItemCount} Items Selected
                  </span>
                  <span className="text-xl font-bold font-mono text-zinc-900">
                    ₹{cartSubtotal}
                  </span>
                </div>

                <button
                  onClick={handlePunchKOT}
                  className="flex-1 max-w-sm py-3 bg-zinc-900 hover:bg-black active:scale-[0.99] text-white font-semibold text-xs tracking-wide uppercase rounded-xl transition shadow-md flex items-center justify-center gap-2"
                >
                  <Send size={15} />
                  <span>Dispatch KOT to Kitchen</span>
                  <ChevronRight size={15} />
                </button>
              </div>
            </div>
          )}
        </div>
      )}

      {/* MODAL: SHIFT / TRANSFER TABLE */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-sm p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <RotateCcw className="text-blue-600" /> Shift Table {selectedTable}
            </h3>
            <p className="text-xs text-gray-500">
              All active orders from Table {selectedTable} will be moved to the new table.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Select Target Free Table:</label>
              <select
                value={targetShiftTable}
                onChange={e => setTargetShiftTable(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose Free Table --</option>
                {tablesList.filter(t => t.status === "FREE").map(t => (
                  <option key={t.tableNumber} value={t.tableNumber}>
                    Table {t.tableNumber} (🟢 Free)
                  </option>
                ))}
              </select>
            </div>

            <div className="flex gap-2 pt-2">
              <button
                onClick={() => setIsShiftModalOpen(false)}
                className="flex-1 py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs"
              >
                Cancel
              </button>
              <button
                onClick={handleShiftTable}
                className="flex-1 py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-xl text-xs shadow-md"
              >
                Confirm Shift
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL: BILL REQUEST DISPATCH TO CASHIER DESK */}
      {isBillModalOpen && selectedGroup && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-5 sm:p-6 space-y-4 shadow-2xl max-h-[92vh] overflow-y-auto">
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <h3 className="font-black text-lg text-gray-900">
                    Table {selectedTable} Bill Request
                  </h3>
                  {selectedGroup.requestedBill && (
                    <span className="text-[10px] font-extrabold uppercase bg-amber-100 text-amber-800 border border-amber-300 px-2 py-0.5 rounded-full">
                      Cashier Alerted
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mt-0.5">
                  {selectedGroup.orders.length} KOTs • Captain: {selectedCaptain}
                </p>
              </div>
              <button
                onClick={() => setIsBillModalOpen(false)}
                className="p-1.5 text-gray-400 hover:text-gray-700 rounded-full hover:bg-gray-100"
              >
                <X size={18} />
              </button>
            </div>

            {/* Bill Summary Banner */}
            <div className="bg-[#F8F6F0] border border-[#E6E0D2] p-3.5 rounded-2xl flex items-center justify-between">
              <div>
                <span className="text-xs text-gray-600 font-bold uppercase tracking-wider">Total Payable</span>
                <div className="text-2xl font-black text-gray-900 font-mono mt-0.5">
                  ₹{selectedGroup.total}
                </div>
              </div>
              <div className="text-right text-[11px] text-gray-500">
                <div>GST (5% CGST+SGST) Inc.</div>
                <div className="text-emerald-700 font-bold mt-0.5">Ready for Settlement</div>
              </div>
            </div>

            {/* Items Breakdown Checklist */}
            <div className="space-y-2">
              <div className="flex items-center justify-between text-[11px] font-bold text-gray-400 uppercase tracking-wider">
                <span>Items Ordered ({selectedGroup.orders.length} KOTs)</span>
                <span>Amount</span>
              </div>
              <div className="max-h-40 overflow-y-auto space-y-1.5 bg-gray-50 p-2.5 rounded-2xl border border-gray-100">
                {selectedGroup.orders.map((ord: any) => {
                  let items: any[] = [];
                  try {
                    items = typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items;
                  } catch (e) {}
                  return (
                    <div key={ord.id} className="space-y-1">
                      {Array.isArray(items) && items.filter((i: any) => i.id !== "NOTE").map((it: any, idx: number) => (
                        <div key={idx} className="flex justify-between text-xs font-medium text-gray-800">
                          <span>{it.qty}x {it.name}</span>
                          <span className="font-mono font-bold text-gray-900">₹{it.price * it.qty}</span>
                        </div>
                      ))}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Cashier Alert Action Section */}
            <div className="space-y-3 pt-1">
              {selectedGroup.requestedBill ? (
                <div className="border border-amber-300 bg-amber-50 rounded-2xl p-4 space-y-3">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-amber-500 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Bell size={18} className="animate-bounce" />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-amber-950">
                        Cashier Desk Alerted
                      </h4>
                      <p className="text-xs text-amber-900/80 leading-relaxed">
                        The billing counter has been notified. The cashier is printing the official GST invoice slip. Please collect the printed bill booklet from the counter and present it to the guest.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAlertCashier(selectedTable!)}
                    className="w-full py-2.5 px-3 bg-amber-500 hover:bg-amber-600 active:scale-[0.99] text-white text-xs font-bold rounded-xl shadow-xs flex items-center justify-center gap-1.5 transition"
                  >
                    <Bell size={14} />
                    <span>Re-send Alert Chime to Cashier</span>
                  </button>
                </div>
              ) : (
                <div className="border border-gray-200 bg-white rounded-2xl p-4 space-y-3 shadow-xs">
                  <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-zinc-900 text-white flex items-center justify-center shrink-0 mt-0.5">
                      <Receipt size={18} />
                    </div>
                    <div className="space-y-1">
                      <h4 className="text-sm font-black text-gray-900">
                        Request Printed Bill Slip
                      </h4>
                      <p className="text-xs text-gray-600 leading-relaxed">
                        Notify the cashier counter to generate and print the official thermal bill slip for Table {selectedTable}.
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={() => handleAlertCashier(selectedTable!)}
                    className="w-full py-3 px-3 bg-zinc-900 hover:bg-black active:scale-[0.99] text-white text-xs font-bold uppercase tracking-wider rounded-xl shadow-md flex items-center justify-center gap-2 transition"
                  >
                    <Bell size={15} />
                    <span>Send Bill Request to Cashier</span>
                  </button>
                </div>
              )}

              <div className="p-3 bg-gray-50 border border-gray-200 rounded-2xl text-[11px] text-gray-500 leading-relaxed flex items-center gap-2">
                <CheckCircle2 size={16} className="text-emerald-600 shrink-0" />
                <span>
                  Bill payment settlement & table clearance are handled by the Cashier at the POS billing counter.
                </span>
              </div>

              <button
                onClick={() => setIsBillModalOpen(false)}
                className="w-full py-2.5 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-xs transition"
              >
                Close Window
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
