"use client";

import React, { useState, useEffect, useRef } from "react";
import { supabase } from "@/lib/supabase";
import { 
  Receipt, ChefHat, Search, Plus, Minus, X, Check, Clock, 
  RotateCcw, Printer, Send, Smartphone, DollarSign, Split, 
  Layers, Users, Bell, BellOff, RefreshCw, ChevronRight, 
  Sparkles, ArrowLeft, CheckCircle2, ShieldCheck, Utensils, 
  ShoppingBag, Bike, Coffee, Flame, AlertCircle, FileText,
  Lock, KeyRound, Shield
} from "lucide-react";
import toast from "react-hot-toast";

// 15 Standard Tables configured across 3 Restaurant Sections
const SECTIONS = [
  { id: "ALL", name: "All Tables (15)" },
  { id: "GROUND", name: "Ground Floor (T1-T5)", tables: ["1", "2", "3", "4", "5"] },
  { id: "AC_HALL", name: "AC Family Hall (T6-T10)", tables: ["6", "7", "8", "9", "10"] },
  { id: "GARDEN", name: "Garden / Terrace (T11-T15)", tables: ["11", "12", "13", "14", "15"] }
];

const CAPTAINS = [
  "Cashier Counter",
  "Rahul (Lead Captain)",
  "Manoj (Captain)",
  "Vikram (Captain)",
  "Suresh (Captain)"
];

const DEFAULT_MENU_ITEMS = [
  { id: "m-1", name: "Paneer Butter Masala", category: "Main Course", price: 280, isVeg: true },
  { id: "m-2", name: "Butter Chicken", category: "Main Course", price: 340, isVeg: false },
  { id: "m-3", name: "Dal Makhani", category: "Main Course", price: 220, isVeg: true },
  { id: "m-4", name: "Butter Naan", category: "Breads", price: 50, isVeg: true },
  { id: "m-5", name: "Garlic Naan", category: "Breads", price: 65, isVeg: true },
  { id: "m-6", name: "Tandoori Roti", category: "Breads", price: 25, isVeg: true },
  { id: "m-7", name: "Paneer Tikka (6 Pcs)", category: "Starters", price: 260, isVeg: true },
  { id: "m-8", name: "Chicken Tikka (6 Pcs)", category: "Starters", price: 320, isVeg: false },
  { id: "m-9", name: "Crispy Veg Spring Rolls", category: "Starters", price: 190, isVeg: true },
  { id: "m-10", name: "Chicken Dum Biryani", category: "Rice & Biryani", price: 320, isVeg: false },
  { id: "m-11", name: "Jeera Rice", category: "Rice & Biryani", price: 160, isVeg: true },
  { id: "m-12", name: "Fresh Lime Soda", category: "Beverages", price: 70, isVeg: true },
  { id: "m-13", name: "Cold Coffee with Ice Cream", category: "Beverages", price: 120, isVeg: true },
  { id: "m-14", name: "Mineral Water (1L)", category: "Beverages", price: 30, isVeg: true },
  { id: "m-15", name: "Gulab Jamun (2 Pcs)", category: "Dessert", price: 90, isVeg: true }
];

function escapeHtml(str: any): string {
  return String(str || '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}

export default function PetpoojaPOSPage() {
  // Navigation View: 'tables' (Floor Plan), 'quick_bill' (Takeaway/Delivery), 'live_kots' (Kitchen Monitor), 'register' (Settled Bills)
  const [activeView, setActiveView] = useState<'tables' | 'quick_bill' | 'live_kots' | 'register'>('tables');
  
  // Floor & Filter state
  const [selectedSection, setSelectedSection] = useState<string>("ALL");
  const [statusFilter, setStatusFilter] = useState<"ALL" | "FREE" | "OCCUPIED" | "BILLING">("ALL");

  // Mobile Sub-View in Punching Mode: 'menu' (Dish Explorer) or 'cart' (KOT & Bill Docket)
  const [mobilePunchView, setMobilePunchView] = useState<'menu' | 'cart'>('menu');
  const [isPunching, setIsPunching] = useState(false);

  // Orders Data
  const [orders, setOrders] = useState<any[]>([]);
  const [settledOrders, setSettledOrders] = useState<any[]>([]);
  const [menuItems, setMenuItems] = useState<any[]>(DEFAULT_MENU_ITEMS);
  const [loading, setLoading] = useState(true);

  // Digital Clock
  const [currentTime, setCurrentTime] = useState<string>("");

  // Audio Alerts
  const [audioEnabled, setAudioEnabled] = useState(false);
  const audioEnabledRef = useRef(false);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Selected Active Punching Context
  const [selectedTable, setSelectedTable] = useState<string | null>(null);
  const [selectedCaptain, setSelectedCaptain] = useState<string>(CAPTAINS[0]);
  const [guestPax, setGuestPax] = useState<number>(2);
  const [customerName, setCustomerName] = useState<string>("");
  const [customerPhone, setCustomerPhone] = useState<string>("");

  // Punching Cart: { [itemId]: { item, qty, note } }
  const [cart, setCart] = useState<{ [id: string]: { item: any; qty: number; note?: string } }>({});
  const [cookingNotes, setCookingNotes] = useState("");
  const [searchQuery, setSearchQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("ALL");
  const [vegFilter, setVegFilter] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");

  // Financial Adjustment State
  const [discountPercent, setDiscountPercent] = useState<number>(0);
  const [customDiscountAmt, setCustomDiscountAmt] = useState<number>(0);
  const [discountReason, setDiscountReason] = useState<string>("Owner Comp");
  const [applyServiceCharge, setApplyServiceCharge] = useState<boolean>(true);

  // Modals
  const [isShiftModalOpen, setIsShiftModalOpen] = useState(false);
  const [targetShiftTable, setTargetShiftTable] = useState("");

  const [waModal, setWaModal] = useState<{
    isOpen: boolean;
    data: any;
    paymentMethod: 'CASH' | 'UPI' | 'SPLIT' | null;
  }>({ isOpen: false, data: null, paymentMethod: null });
  const [waPhone, setWaPhone] = useState('');
  const [cashTendered, setCashTendered] = useState<number>(0);
  const [splitCashAmt, setSplitCashAmt] = useState<number>(0);

  // Manager PIN Security Modal for Admin Back-Office
  const [isAdminPinModalOpen, setIsAdminPinModalOpen] = useState(false);
  const [adminPinInput, setAdminPinInput] = useState("");
  const [adminPinError, setAdminPinError] = useState("");

  // Online & Delivery Channels (Takeaway / Swiggy / Zomato)
  const [isDeliveryChannelModalOpen, setIsDeliveryChannelModalOpen] = useState(false);
  const [selectedChannel, setSelectedChannel] = useState<'TAKEAWAY' | 'SWIGGY' | 'ZOMATO'>('TAKEAWAY');
  const [onlineOrderId, setOnlineOrderId] = useState("");
  const [deliveryRiderName, setDeliveryRiderName] = useState("");

  const handleVerifyAdminPin = (inputPin?: string) => {
    const pinToTest = inputPin ?? adminPinInput;
    const savedPin = typeof window !== 'undefined' ? localStorage.getItem('wb_manager_pin') || '1234' : '1234';
    if (pinToTest === savedPin) {
      toast.success("Manager Access Granted! Redirecting to Admin...", { icon: "🔐" });
      setIsAdminPinModalOpen(false);
      setAdminPinInput("");
      setAdminPinError("");
      window.location.href = "/admin/dashboard";
    } else {
      setAdminPinError("Invalid PIN! Access Denied.");
      toast.error("Incorrect Manager PIN! (Default: 1234)", { icon: "❌" });
      setAdminPinInput("");
    }
  };

  const handleStartDeliveryOrder = (channelOverride?: 'TAKEAWAY' | 'SWIGGY' | 'ZOMATO', customId?: string) => {
    const channel = channelOverride || selectedChannel;
    const prefix = channel === 'SWIGGY' ? 'Swiggy' : channel === 'ZOMATO' ? 'Zomato' : 'Takeaway';
    const cleanId = (customId ?? onlineOrderId).trim();
    const rand = Math.floor(100 + Math.random() * 900);
    const token = cleanId ? `#${cleanId}` : String(rand);
    const tableId = `${prefix}-${token}`;

    setSelectedTable(tableId);
    if (deliveryRiderName.trim()) {
      setCustomerName(deliveryRiderName.trim());
    } else {
      setCustomerName(channel === 'SWIGGY' ? 'Swiggy Order' : channel === 'ZOMATO' ? 'Zomato Order' : 'Direct Parcel');
    }
    setActiveView('quick_bill');
    setMobilePunchView('menu');
    setCart({});
    setIsDeliveryChannelModalOpen(false);
    setOnlineOrderId("");
    setDeliveryRiderName("");
    toast.success(`Started ${prefix} Order ${token}`, { 
      icon: channel === 'SWIGGY' ? '🟠' : channel === 'ZOMATO' ? '🔴' : '🥡' 
    });
  };

  // Clock Update
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit', hour12: true }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Sync Audio ref
  useEffect(() => {
    audioEnabledRef.current = audioEnabled;
  }, [audioEnabled]);

  // Load orders & menu
  useEffect(() => {
    fetchOrders();
    fetchSettledOrders();
    fetchMenu();

    const channel = supabase
      .channel("petpooja-pos-orders")
      .on("postgres_changes", { event: "*", schema: "public", table: "orders" }, (payload) => {
        if (payload.eventType === "UPDATE" && payload.new.status === "billing") {
          if (audioEnabledRef.current && audioRef.current) {
            audioRef.current.play().catch(() => {});
            toast(`Table ${payload.new.table_number} requested the Bill!`, {
              icon: "🔔",
              duration: 5000,
              style: { background: "#ea580c", color: "#fff", fontWeight: "bold" }
            });
          }
        }
        fetchOrders();
        fetchSettledOrders();
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

  const fetchSettledOrders = async () => {
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const { data } = await supabase
      .from("orders")
      .select("*")
      .eq("status", "completed")
      .gte("created_at", today.toISOString())
      .order("created_at", { ascending: false });

    if (data) setSettledOrders(data);
  };

  const fetchMenu = async () => {
    const { data } = await supabase.from("menu").select("*");
    if (data && data.length > 0) {
      const formatted = data.map(d => ({
        id: String(d.id),
        name: d.name,
        category: d.section || "Main Course",
        price: Number(d.price),
        isVeg: !d.name.toLowerCase().includes("chicken") && 
               !d.name.toLowerCase().includes("mutton") && 
               !d.name.toLowerCase().includes("egg") &&
               !d.name.toLowerCase().includes("fish")
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
        firstOrderTime: order.created_at,
        kotCount: 0
      };
    }
    tableGroups[t].orders.push(order);
    tableGroups[t].total += Number(order.total_amount || 0);
    tableGroups[t].kotCount += 1;
    if (order.status === "billing") {
      tableGroups[t].requestedBill = true;
    }
  });

  // 15 Standard Tables
  const allTableNumbers = Array.from({ length: 15 }, (_, i) => String(i + 1));
  const tablesList = allTableNumbers.map(tNum => {
    const group = tableGroups[tNum];
    let status: "FREE" | "OCCUPIED" | "BILLING" = "FREE";
    if (group) {
      status = group.requestedBill ? "BILLING" : "OCCUPIED";
    }

    // Elapsed time calculation
    let elapsedMinutes = 0;
    if (group?.firstOrderTime) {
      const diffMs = new Date().getTime() - new Date(group.firstOrderTime).getTime();
      elapsedMinutes = Math.max(1, Math.floor(diffMs / (1000 * 60)));
    }

    // Item count
    let itemCount = 0;
    if (group) {
      group.orders.forEach((o: any) => {
        try {
          const parsed = typeof o.items === "string" ? JSON.parse(o.items) : o.items;
          if (Array.isArray(parsed)) {
            itemCount += parsed.filter((it: any) => it.id !== "NOTE").reduce((sum: number, it: any) => sum + (it.qty || 1), 0);
          }
        } catch (e) {}
      });
    }

    // Identify Section
    let sectionName = "Ground Floor";
    const num = parseInt(tNum, 10);
    if (num > 5 && num <= 10) sectionName = "AC Hall";
    if (num > 10) sectionName = "Garden";

    return {
      tableNumber: tNum,
      status,
      group,
      total: group ? group.total : 0,
      itemCount,
      elapsedMinutes,
      sectionName
    };
  });

  // Filter tables by section and status
  const currentSectionTables = tablesList.filter(t => {
    if (selectedSection === "ALL") return true;
    const currentSec = SECTIONS.find(s => s.id === selectedSection);
    return currentSec?.tables?.includes(t.tableNumber);
  });

  const filteredTables = currentSectionTables.filter(t => {
    if (statusFilter === "ALL") return true;
    return t.status === statusFilter;
  });

  // Counts
  const freeCount = tablesList.filter(t => t.status === "FREE").length;
  const occupiedCount = tablesList.filter(t => t.status === "OCCUPIED").length;
  const billingCount = tablesList.filter(t => t.status === "BILLING").length;
  const deliveryGroups = Object.values(tableGroups).filter((g: any) => g.table.match(/^(Swiggy|Zomato|Takeaway)/i));

  // Menu Categories
  const categories = ["ALL", ...Array.from(new Set(menuItems.map(m => m.category)))];

  // Cart operations
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

  // Financial calculations for Active Selected Table or Quick Cart
  const activeGroup = selectedTable ? tableGroups[selectedTable] : null;
  const runningSubtotal = activeGroup ? activeGroup.total : 0;
  const combinedSubtotal = runningSubtotal + cartSubtotal;

  const calculatedDiscount = discountPercent > 0 
    ? Math.round((combinedSubtotal * discountPercent) / 100)
    : customDiscountAmt;

  const discountedSubtotal = Math.max(0, combinedSubtotal - calculatedDiscount);
  const gst = Math.round(discountedSubtotal * 0.05); // 5% GST (2.5% CGST + 2.5% SGST)
  const serviceCharge = applyServiceCharge ? Math.round(discountedSubtotal * 0.05) : 0;
  const grandTotal = discountedSubtotal + gst + serviceCharge;

  // 1. PUNCH KOT (Saves to Kitchen via secure backend API & alerts speech engine)
  const handlePunchKOT = async (autoPrintKOT = true) => {
    if (!selectedTable) return;
    if (cartItems.length === 0) return toast.error("Please add at least 1 dish to punch KOT");
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
        name: `Kitchen Note (${selectedCaptain}): ${cookingNotes.trim()}`,
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

      toast.success(`KOT #${orderNumber} Dispatched to Kitchen!`, {
        icon: "🔥",
        duration: 3500
      });

      if (autoPrintKOT) {
        printKOTSlip(selectedTable, orderNumber, cartItems, cookingNotes, selectedCaptain);
      }

      // Reset cart and switch to bill view so staff sees running KOT
      setCart({});
      setCookingNotes("");
      fetchOrders();
      setMobilePunchView('cart');
    } catch (err: any) {
      toast.error(err.message || "Failed to punch KOT");
    } finally {
      setIsPunching(false);
    }
  };

  // 2. SETTLE BILL & CLEAR TABLE
  const markPaid = async (tableNumber: string, orderIds: number[], paymentMethod: 'CASH' | 'UPI', customerPhoneNum?: string) => {
    setOrders(prev => prev.filter(o => o.table_number !== tableNumber));

    try {
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
          customerPhone: customerPhoneNum || customerPhone 
        })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to mark as paid');

      toast.success(`Table ${tableNumber} Settled & Marked Available!`, { icon: "✅" });
      setSelectedTable(null);
      setCart({});
      setDiscountPercent(0);
      setCustomDiscountAmt(0);
      setCustomerPhone("");
      setCustomerName("");
      fetchOrders();
      fetchSettledOrders();
    } catch (e: any) {
      toast.error(e.message || "Failed to mark as paid");
    }
  };

  // 3. TABLE TRANSFER / SHIFT (Using secure backend API)
  const handleShiftTable = async () => {
    if (!selectedTable || !targetShiftTable) return;
    if (selectedTable === targetShiftTable) return toast.error("Choose a different table");
    const group = tableGroups[selectedTable];
    if (!group || group.orders.length === 0) return;

    try {
      const orderIds = group.orders.map((o: any) => o.id);
      const res = await fetch('/api/orders/update', {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'x-staff-access': 'pos_secure_override'
        },
        body: JSON.stringify({ orderIds, newTableNumber: targetShiftTable })
      });
      const data = await res.json();
      if (!data.success) throw new Error(data.message || 'Failed to shift table');

      toast.success(`Shifted Table ${selectedTable} ➜ Table ${targetShiftTable}!`, { icon: "🔄" });
      setIsShiftModalOpen(false);
      setSelectedTable(targetShiftTable);
      setTargetShiftTable("");
      fetchOrders();
    } catch (e: any) {
      toast.error(e.message || "Failed to shift table");
    }
  };

  // 4. PRINT 80MM PETPOOJA GST INVOICE WITH DYNAMIC UPI QR
  const printOfficialInvoice = (
    tableNumber: string, 
    groupOrders: any[], 
    subTot: number, 
    discAmt: number, 
    gstAmt: number, 
    scAmt: number, 
    gTotal: number, 
    payMethod?: string
  ) => {
    const printWindow = window.open('', '', 'width=420,height=700');
    if (!printWindow) return toast.error('Please allow popups to print receipts');

    const now = new Date();
    const day = String(now.getDate()).padStart(2, '0');
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const year = String(now.getFullYear()).slice(-2);
    let hours = now.getHours();
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const ampm = hours >= 12 ? 'PM' : 'AM';
    hours = hours % 12 || 12;
    const formattedDate = `${day}/${month}/${year} ${String(hours).padStart(2, '0')}:${minutes} ${ampm}`;

    const firstOrder = groupOrders[0];
    const orderNum = firstOrder?.order_number || firstOrder?.id || 101;
    const invoiceNo = `HWB-${String(orderNum).padStart(4, '0')}`;

    const isDelivery = tableNumber.match(/^(Swiggy|Zomato|Takeaway)/i);
    const orderType = isDelivery ? tableNumber : 'Dine-in';
    const location = isDelivery ? 'Counter' : `Table ${tableNumber}`;

    const itemsRows = groupOrders.flatMap(order => {
      let parsed: any[] = [];
      try { parsed = typeof order.items === 'string' ? JSON.parse(order.items) : order.items; } catch(e) {}
      if (!Array.isArray(parsed)) parsed = [];
      return parsed.filter((it: any) => it.id !== 'NOTE');
    }).map((it: any) => `
      <tr>
        <td style="padding: 3px 0; text-align: left; word-break: break-word;">${escapeHtml(it.name)}</td>
        <td style="padding: 3px 0; text-align: center;">${escapeHtml(it.qty)}</td>
        <td style="padding: 3px 0; text-align: right;">${escapeHtml(it.price)}</td>
        <td style="padding: 3px 0; text-align: right; font-weight: 600;">${Number(it.price) * Number(it.qty)}</td>
      </tr>
    `).join('');

    const cgst = (gstAmt / 2).toFixed(2);
    const sgst = (gstAmt / 2).toFixed(2);
    const exactSum = (subTot - discAmt) + gstAmt + scAmt;
    const roundOff = (gTotal - exactSum).toFixed(2);
    const paidLabel = payMethod ? `PAID • ${payMethod}` : 'DUE / PENDING';

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>Invoice ${invoiceNo} - ${location}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            * { box-sizing: border-box; }
            body {
              font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, Arial, monospace;
              color: #000;
              width: 76mm;
              max-width: 320px;
              margin: 0 auto;
              padding: 12px 8px;
              font-size: 12px;
              line-height: 1.35;
            }
            .text-center { text-align: center; }
            .text-right { text-align: right; }
            .text-left { text-align: left; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 1px dashed #222; margin: 7px 0; }
            .header-title { font-size: 17px; font-weight: 800; letter-spacing: 0.5px; margin: 0 0 3px 0; }
            .header-sub { font-size: 10.5px; color: #333; margin: 1.5px 0; line-height: 1.25; }
            .meta-grid { width: 100%; font-size: 11px; margin: 4px 0; }
            .meta-grid td { padding: 1.5px 0; }
            .items-table { width: 100%; border-collapse: collapse; font-size: 11.5px; margin: 3px 0; }
            .items-table th { font-size: 10.5px; font-weight: bold; text-transform: uppercase; padding: 4px 0; border-top: 1px dashed #222; border-bottom: 1px dashed #222; }
            .calc-row { display: flex; justify-content: space-between; font-size: 11.5px; padding: 1.5px 0; }
            .total-row { display: flex; justify-content: space-between; font-size: 15px; font-weight: 900; padding: 3px 0; }
            .footer-text { font-size: 11.5px; font-weight: bold; margin: 6px 0 2px 0; }
            .qr-box { text-align: center; margin: 8px 0; padding: 6px; border: 1px dashed #999; border-radius: 6px; }
          </style>
        </head>
        <body>
          <div class="text-center">
            <div class="header-title">Hotel White Bliss</div>
            <div class="header-sub">Amrut Garden, Pathardi Phata, Nashik, Maharashtra 422009</div>
            <div class="header-sub">GSTIN: 27AABCH1234F1Z5 • FSSAI: 11521045000123</div>
            <div class="header-sub">Contact: 7499934257</div>
          </div>
          <div class="divider"></div>
          <table class="meta-grid">
            <tr><td class="text-left" style="color:#555; width:35%;">Invoice No</td><td class="text-right bold">${invoiceNo}</td></tr>
            <tr><td class="text-left" style="color:#555;">Date</td><td class="text-right">${formattedDate}</td></tr>
            <tr><td class="text-left" style="color:#555;">Type</td><td class="text-right">${orderType}</td></tr>
            <tr><td class="text-left" style="color:#555;">Location</td><td class="text-right bold">${escapeHtml(location)}</td></tr>
            <tr><td class="text-left" style="color:#555;">Cashier / Captain</td><td class="text-right">${escapeHtml(selectedCaptain)}</td></tr>
          </table>
          <table class="items-table">
            <thead>
              <tr>
                <th class="text-left" style="width: 48%;">Item</th>
                <th class="text-center" style="width: 14%;">Qty</th>
                <th class="text-right" style="width: 18%;">Rate</th>
                <th class="text-right" style="width: 20%;">Amt</th>
              </tr>
            </thead>
            <tbody>${itemsRows}</tbody>
          </table>
          <div class="divider"></div>
          <div class="calc-row"><span>Subtotal</span><span>₹${subTot}</span></div>
          ${discAmt > 0 ? `<div class="calc-row" style="color:#16a34a; font-weight:bold;"><span>Discount</span><span>-₹${discAmt}</span></div>` : ''}
          <div class="calc-row"><span>CGST (2.5%)</span><span>₹${cgst}</span></div>
          <div class="calc-row"><span>SGST (2.5%)</span><span>₹${sgst}</span></div>
          ${scAmt > 0 ? `<div class="calc-row"><span>Service Charge (5%)</span><span>₹${scAmt}</span></div>` : ''}
          ${Number(roundOff) !== 0 ? `<div class="calc-row" style="color:#666;"><span>Round Off</span><span>${roundOff}</span></div>` : ''}
          <div class="divider"></div>
          <div class="total-row"><span>GRAND TOTAL</span><span>₹${gTotal}</span></div>
          <div class="divider"></div>
          <div class="text-center bold" style="font-size: 13px; margin: 4px 0 1px 0;">${paidLabel}</div>
          ${payMethod !== 'CASH' ? `
          <div class="qr-box">
            <div style="font-size: 10px; font-weight: bold; margin-bottom: 4px;">SCAN TO PAY VIA UPI</div>
            <img 
              id="qrImg"
              src="https://api.qrserver.com/v1/create-qr-code/?size=130x130&data=${encodeURIComponent(`upi://pay?pa=7499934257@okaxis&pn=Hotel%20White%20Bliss&am=${gTotal}&cu=INR&tn=${invoiceNo}%20${location}`)}" 
              width="130" height="130" style="margin: 0 auto; display: block;" alt="UPI QR"
            />
            <div style="font-size: 11px; font-weight: bold; margin-top: 4px;">Exact Amount: ₹${gTotal}</div>
            <div style="font-size: 9px; color: #666;">Google Pay • PhonePe • Paytm • BHIM</div>
          </div>
          <div class="divider"></div>
          ` : ''}
          <div class="text-center">
            <div class="footer-text">Thank you! Please visit again!</div>
            <div style="font-size: 9.5px; color: #666;">powered by BlissPOS Pro (Petpooja Edition)</div>
          </div>
          <script>
            window.onload = function() {
              setTimeout(function() { window.print(); window.close(); }, 800);
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // 5. PRINT 80MM KOT SLIP (Kitchen Order Ticket)
  const printKOTSlip = (tableNumber: string, orderNumber: number, items: any[], notes: string, captain: string) => {
    const printWindow = window.open('', '', 'width=380,height=500');
    if (!printWindow) return;

    const now = new Date();
    const timeStr = now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

    const rows = items.map(c => `
      <div style="display:flex; justify-content:space-between; font-size:14px; font-weight:bold; padding:4px 0; border-bottom:1px dashed #ccc;">
        <span>${escapeHtml(c.qty)} x ${escapeHtml(c.item?.name)}</span>
      </div>
    `).join('');

    printWindow.document.write(`
      <!DOCTYPE html>
      <html>
        <head>
          <title>KOT #${escapeHtml(orderNumber)} - Table ${escapeHtml(tableNumber)}</title>
          <style>
            @page { margin: 0; size: 80mm auto; }
            body { font-family: monospace; width: 72mm; margin: 0 auto; padding: 10px; font-size: 12px; }
            .center { text-align: center; }
            .bold { font-weight: bold; }
            .divider { border-bottom: 2px dashed #000; margin: 6px 0; }
          </style>
        </head>
        <body>
          <div class="center bold" style="font-size:18px;">*** KITCHEN ORDER TICKET ***</div>
          <div class="center" style="font-size:14px; margin-top:2px;">HOTEL WHITE BLISS</div>
          <div class="divider"></div>
          <div style="display:flex; justify-content:space-between; font-weight:bold; font-size:13px;">
            <span>TABLE: ${escapeHtml(tableNumber)}</span>
            <span>KOT: #${escapeHtml(orderNumber)}</span>
          </div>
          <div style="display:flex; justify-content:space-between; font-size:11px; margin-top:2px;">
            <span>Time: ${escapeHtml(timeStr)}</span>
            <span>Captain: ${escapeHtml(captain)}</span>
          </div>
          <div class="divider"></div>
          <div style="margin: 8px 0;">${rows}</div>
          ${notes ? `
          <div class="divider"></div>
          <div style="font-weight:bold; font-size:12px; color:#000;">
            INSTRUCTIONS: <span style="background:#000; color:#fff; padding:2px 4px;">${escapeHtml(notes.toUpperCase())}</span>
          </div>
          ` : ''}
          <div class="divider"></div>
          <div class="center" style="font-size:10px;">BlissPOS • Kitchen Dispatch</div>
          <script>
            window.onload = function() {
              window.print();
              window.close();
            };
          </script>
        </body>
      </html>
    `);
    printWindow.document.close();
  };

  // WhatsApp Bill Handlers
  const handleSendWa = () => {
    if (!waModal.data || !waModal.paymentMethod) return;
    const { tableNumber, groupOrders, grandTotal } = waModal.data;
    const cleanPhone = waPhone.replace(/\D/g, '');
    if (cleanPhone.length < 10) return toast.error("Enter valid 10-digit mobile number");

    const orderIds = groupOrders.map((o: any) => o.id).join('-');
    const cleanUrl = `${window.location.origin}/bill/${orderIds}`;

    const text = `🧾 *HOTEL WHITE BLISS* 🧾\n------------------------\nTable ${tableNumber} | Date: ${new Date().toLocaleDateString()}\n------------------------\n*GRAND TOTAL: ₹${grandTotal}*\nPayment Status: PAID VIA ${waModal.paymentMethod}\n------------------------\n📄 *View & Download Tax Invoice PDF:*\n${cleanUrl}\n------------------------\n⭐ *Review us on Google:*\nhttps://www.google.com/search?q=Hotel+White+Bliss+Nashik\n------------------------\nThank you for dining with us! 🙏`;

    window.open(`https://wa.me/91${cleanPhone}?text=${encodeURIComponent(text)}`, '_blank');
    markPaid(tableNumber, groupOrders.map((o: any) => o.id), waModal.paymentMethod, cleanPhone);
    setWaModal({ isOpen: false, data: null, paymentMethod: null });
    setWaPhone('');
  };

  const handleSkipWa = () => {
    if (!waModal.data || !waModal.paymentMethod) return;
    const { tableNumber, groupOrders } = waModal.data;
    markPaid(tableNumber, groupOrders.map((o: any) => o.id), waModal.paymentMethod);
    setWaModal({ isOpen: false, data: null, paymentMethod: null });
    setWaPhone('');
  };

  // Filtered Menu Items
  const filteredMenuItems = menuItems.filter(item => {
    const matchesCategory = activeCategory === "ALL" || item.category === activeCategory;
    const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesVeg = vegFilter === "ALL" 
      ? true 
      : vegFilter === "VEG" 
      ? item.isVeg 
      : !item.isVeg;
    return matchesCategory && matchesSearch && matchesVeg;
  });

  return (
    <div className="h-screen h-[100dvh] overflow-hidden bg-[#F4F1EA] text-[#1E1B16] flex flex-col font-sans select-none">
      <audio ref={audioRef} src="https://cdn.pixabay.com/download/audio/2021/08/04/audio_0625c1539c.mp3?filename=service-bell-ring-14610.mp3" preload="auto" />

      {/* TOP RESPONSIVE PETPOOJA PRO NAVIGATION BAR */}
      <header className="bg-[#1E1B16] text-white px-3 sm:px-4 py-2 sticky top-0 z-50 shadow-md border-b border-[#322c24] flex items-center justify-between gap-2">
        
        {/* Brand & Status */}
        <div className="flex items-center gap-2 sm:gap-3 min-w-0">
          <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-gradient-to-br from-[#A18D6D] to-[#6F624E] flex items-center justify-center font-black text-white text-sm sm:text-base shadow shrink-0">
            WB
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-1.5 flex-wrap">
              <h1 className="font-playfair font-bold text-sm sm:text-base tracking-wide text-white truncate">
                Hotel White Bliss
              </h1>
              <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider bg-[#A18D6D]/30 text-[#e8d5b5] border border-[#A18D6D]/40 px-1.5 sm:px-2 py-0.5 rounded">
                POS
              </span>
            </div>
            <div className="flex items-center gap-1.5 text-[10px] sm:text-[11px] text-gray-400">
              <span className="font-mono text-emerald-400 font-bold">● ONLINE</span>
              <span className="hidden sm:inline">•</span>
              <span className="font-mono text-gray-300 hidden sm:inline">{currentTime || "12:00 PM"}</span>
            </div>
          </div>
        </div>

        {/* DESKTOP VIEW MODE SELECTOR */}
        <div className="hidden lg:flex items-center p-1 bg-white/10 rounded-xl border border-white/15 text-xs font-bold">
          <button
            onClick={() => { setActiveView('tables'); setSelectedTable(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeView === 'tables' && !selectedTable ? "bg-white text-gray-900 shadow font-extrabold" : "text-gray-300 hover:text-white"
            }`}
          >
            <Layers size={14} />
            <span>Table Floor ({tablesList.length})</span>
          </button>
          <button
            onClick={() => {
              if (activeView === 'quick_bill' && selectedTable) {
                setActiveView('quick_bill');
              } else {
                setSelectedChannel('TAKEAWAY');
                setIsDeliveryChannelModalOpen(true);
              }
            }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeView === 'quick_bill' ? "bg-white text-gray-900 shadow font-extrabold" : "text-gray-300 hover:text-white"
            }`}
          >
            <ShoppingBag size={14} />
            <span>Takeaway / Online</span>
          </button>
          <button
            onClick={() => { setActiveView('live_kots'); setSelectedTable(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeView === 'live_kots' ? "bg-white text-gray-900 shadow font-extrabold" : "text-gray-300 hover:text-white"
            }`}
          >
            <ChefHat size={14} />
            <span>Live KOTs ({orders.length})</span>
          </button>
          <button
            onClick={() => { setActiveView('register'); setSelectedTable(null); }}
            className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg transition ${
              activeView === 'register' ? "bg-white text-gray-900 shadow font-extrabold" : "text-gray-300 hover:text-white"
            }`}
          >
            <Receipt size={14} />
            <span>Register ({settledOrders.length})</span>
          </button>
        </div>

        {/* RIGHT QUICK ACTIONS */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          <button
            onClick={() => {
              setAudioEnabled(!audioEnabled);
              if (!audioEnabled && audioRef.current) {
                audioRef.current.play().then(() => audioRef.current?.pause()).catch(() => {});
              }
            }}
            className={`p-1.5 sm:p-2 rounded-xl text-xs font-bold transition flex items-center gap-1 ${
              audioEnabled ? "bg-green-600/90 text-white" : "bg-red-500/20 text-red-300 border border-red-500/30"
            }`}
            title="Toggle Audio Bell"
          >
            {audioEnabled ? <Bell size={14} /> : <BellOff size={14} />}
            <span className="hidden md:inline">{audioEnabled ? "On" : "Muted"}</span>
          </button>

          <a
            href="/kitchen"
            target="_blank"
            className="hidden sm:flex p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold items-center gap-1 border border-white/10"
            title="Kitchen Display"
          >
            <ChefHat size={14} />
            <span className="hidden xl:inline">KDS</span>
          </a>

          <a
            href="/captain"
            target="_blank"
            className="hidden sm:flex p-1.5 sm:p-2 bg-white/10 hover:bg-white/20 text-white rounded-xl text-xs font-bold items-center gap-1 border border-white/10"
            title="Waiter App"
          >
            <Smartphone size={14} />
            <span className="hidden xl:inline">Waiter</span>
          </a>

          <button
            onClick={() => {
              setAdminPinInput("");
              setAdminPinError("");
              setIsAdminPinModalOpen(true);
            }}
            className="p-1.5 sm:p-2 bg-gradient-to-r from-[#A18D6D] to-[#8e7a5c] hover:brightness-110 active:scale-95 text-white rounded-xl text-xs font-bold flex items-center gap-1.5 shadow"
            title="Owner Back-Office (Manager PIN Protected)"
          >
            <Lock size={12} className="text-amber-200" />
            <span>Admin</span>
          </button>
        </div>
      </header>

      {/* MOBILE / TABLET PRIMARY VIEW SELECTOR BAR (100% FIT-TO-SCREEN 4-COL GRID) */}
      <nav className="lg:hidden grid grid-cols-4 bg-[#28241d] text-gray-300 text-[11px] font-bold p-1 gap-1 border-b border-black/20 shrink-0">
        <button
          onClick={() => { setActiveView('tables'); setSelectedTable(null); }}
          className={`py-1.5 px-0.5 rounded-lg text-center transition truncate ${activeView === 'tables' && !selectedTable ? "bg-white text-gray-900 shadow-xs font-extrabold" : "hover:text-white"}`}
        >
          Tables ({tablesList.length})
        </button>
        <button
          onClick={() => {
            if (activeView === 'quick_bill' && selectedTable) {
              setActiveView('quick_bill');
            } else {
              setSelectedChannel('TAKEAWAY');
              setIsDeliveryChannelModalOpen(true);
            }
          }}
          className={`py-1.5 px-0.5 rounded-lg text-center transition truncate ${activeView === 'quick_bill' ? "bg-white text-gray-900 shadow-xs font-extrabold" : "hover:text-white"}`}
        >
          Takeaway / Online
        </button>
        <button
          onClick={() => { setActiveView('live_kots'); setSelectedTable(null); }}
          className={`py-1.5 px-0.5 rounded-lg text-center transition truncate ${activeView === 'live_kots' ? "bg-white text-gray-900 shadow-xs font-extrabold" : "hover:text-white"}`}
        >
          KOTs ({orders.length})
        </button>
        <button
          onClick={() => { setActiveView('register'); setSelectedTable(null); }}
          className={`py-1.5 px-0.5 rounded-lg text-center transition truncate ${activeView === 'register' ? "bg-white text-gray-900 shadow-xs font-extrabold" : "hover:text-white"}`}
        >
          Register
        </button>
      </nav>

      {/* MAIN VIEW AREA */}
      <div className="flex-1 flex flex-col min-h-0 overflow-hidden relative">

        {/* ============================================================= */}
        {/* VIEW 1: DINE-IN TABLE FLOOR LAYOUT (When no table is selected) */}
        {/* ============================================================= */}
        {activeView === 'tables' && !selectedTable && (
          <div className="flex-1 overflow-y-auto p-3 sm:p-5 md:p-6 max-w-7xl mx-auto w-full space-y-3 sm:space-y-4 pb-28 sm:pb-12">
            
            {/* Top Filter & Section Bar */}
            <div className="flex flex-col sm:flex-row items-stretch sm:items-center justify-between gap-2.5 bg-white p-2.5 sm:p-3 rounded-2xl border border-[#e8e1d6] shadow-xs">
              
              {/* Floor Section Selection */}
              {/* Mobile: Compact Native Dropdown (Zero cut-off) */}
              <div className="sm:hidden flex items-center gap-2 w-full">
                <div className="relative flex-1">
                  <select
                    value={selectedSection}
                    onChange={(e) => setSelectedSection(e.target.value)}
                    className="w-full bg-[#F4F1EA] text-gray-900 font-extrabold text-xs py-2 pl-3 pr-8 rounded-xl border border-[#e8e1d6] appearance-none focus:outline-none focus:ring-1 focus:ring-gray-900"
                  >
                    {SECTIONS.map(sec => (
                      <option key={sec.id} value={sec.id}>
                        {sec.id === 'ALL' ? '🏢 All Tables (15)' :
                         sec.id === 'GROUND' ? '🟢 Ground Floor (T1-T5)' :
                         sec.id === 'AC_HALL' ? '❄️ AC Family Hall (T6-T10)' :
                         '🌿 Garden / Terrace (T11-T15)'}
                      </option>
                    ))}
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-gray-500 text-xs">
                    ▼
                  </div>
                </div>
              </div>

              {/* Desktop / Tablet: Section Pills */}
              <div className="hidden sm:flex items-center gap-1.5 text-xs">
                {SECTIONS.map(sec => (
                  <button
                    key={sec.id}
                    onClick={() => setSelectedSection(sec.id)}
                    className={`px-3 py-1.5 rounded-xl font-bold transition whitespace-nowrap ${
                      selectedSection === sec.id
                        ? "bg-[#1E1B16] text-white shadow-xs"
                        : "bg-[#F4F1EA] text-gray-700 hover:bg-[#e8e1d6]"
                    }`}
                  >
                    {sec.name}
                  </button>
                ))}
              </div>

              {/* Status Badges (4-col grid on mobile, flex on desktop - 100% Fit) */}
              <div className="grid grid-cols-4 gap-1 sm:flex sm:items-center sm:gap-1.5 w-full sm:w-auto text-[11px] sm:text-xs font-bold">
                <button
                  onClick={() => setStatusFilter("ALL")}
                  className={`py-1.5 px-1 sm:px-2.5 rounded-lg border text-center transition truncate ${
                    statusFilter === "ALL" ? "bg-gray-900 text-white border-gray-900 font-extrabold" : "bg-white text-gray-700 border-gray-200"
                  }`}
                >
                  All ({currentSectionTables.length})
                </button>
                <button
                  onClick={() => setStatusFilter("FREE")}
                  className={`py-1.5 px-0.5 sm:px-2.5 rounded-lg border text-center transition truncate flex items-center justify-center gap-1 ${
                    statusFilter === "FREE" ? "bg-emerald-600 text-white border-emerald-600 font-extrabold" : "bg-emerald-50 text-emerald-800 border-emerald-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0"></span>
                  <span className="truncate">Free ({freeCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter("OCCUPIED")}
                  className={`py-1.5 px-0.5 sm:px-2.5 rounded-lg border text-center transition truncate flex items-center justify-center gap-1 ${
                    statusFilter === "OCCUPIED" ? "bg-blue-600 text-white border-blue-600 font-extrabold" : "bg-blue-50 text-blue-800 border-blue-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-blue-500 shrink-0"></span>
                  <span className="truncate">Dining ({occupiedCount})</span>
                </button>
                <button
                  onClick={() => setStatusFilter("BILLING")}
                  className={`py-1.5 px-0.5 sm:px-2.5 rounded-lg border text-center transition truncate flex items-center justify-center gap-1 ${
                    statusFilter === "BILLING" ? "bg-amber-600 text-white border-amber-600 font-extrabold" : "bg-amber-50 text-amber-800 border-amber-200"
                  }`}
                >
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0"></span>
                  <span className="truncate">Bill ({billingCount})</span>
                </button>
              </div>
            </div>

            {/* Online Aggregators & Parcel Quick Action Bar */}
            <div className="bg-[#1E1B16] text-white rounded-2xl p-3 sm:p-3.5 space-y-2.5 shadow-md border border-[#322c24]">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-7 h-7 rounded-lg bg-[#A18D6D]/20 border border-[#A18D6D]/40 flex items-center justify-center text-[#A18D6D]">
                    <Bike size={16} />
                  </div>
                  <div>
                    <div className="text-xs font-black tracking-wide flex items-center gap-2">
                      <span>Online & Parcel Desk</span>
                      {deliveryGroups.length > 0 && (
                        <span className="bg-amber-400 text-gray-950 font-black text-[10px] px-2 py-0.5 rounded-full font-mono">
                          {deliveryGroups.length} Active
                        </span>
                      )}
                    </div>
                    <div className="text-[10px] text-gray-400">Swiggy • Zomato • Parcel Takeaway Orders</div>
                  </div>
                </div>

                {/* Quick Channel Buttons */}
                <div className="flex items-center gap-1.5 flex-wrap">
                  <button
                    onClick={() => { setSelectedChannel('TAKEAWAY'); setIsDeliveryChannelModalOpen(true); }}
                    className="px-2.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                  >
                    <ShoppingBag size={13} />
                    <span>+ Takeaway</span>
                  </button>
                  <button
                    onClick={() => { setSelectedChannel('SWIGGY'); setIsDeliveryChannelModalOpen(true); }}
                    className="px-2.5 py-1.5 bg-[#FC8019] hover:bg-[#e06f14] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                  >
                    <Bike size={13} />
                    <span>+ Swiggy</span>
                  </button>
                  <button
                    onClick={() => { setSelectedChannel('ZOMATO'); setIsDeliveryChannelModalOpen(true); }}
                    className="px-2.5 py-1.5 bg-[#E23744] hover:bg-[#c92b37] text-white rounded-xl text-xs font-bold flex items-center gap-1 transition shadow-xs"
                  >
                    <Utensils size={13} />
                    <span>+ Zomato</span>
                  </button>
                </div>
              </div>

              {/* Active Delivery Orders Grid */}
              {deliveryGroups.length > 0 && (
                <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-2 pt-1 border-t border-white/10">
                  {deliveryGroups.map((g: any) => {
                    const isSwiggy = g.table.toLowerCase().includes('swiggy');
                    const isZomato = g.table.toLowerCase().includes('zomato');
                    const isTakeaway = g.table.toLowerCase().includes('takeaway');

                    const badgeColor = isSwiggy 
                      ? 'bg-[#FC8019] text-white' 
                      : isZomato 
                      ? 'bg-[#E23744] text-white' 
                      : 'bg-amber-600 text-white';

                    const borderHover = isSwiggy 
                      ? 'border-[#FC8019]/40 hover:border-[#FC8019]' 
                      : isZomato 
                      ? 'border-[#E23744]/40 hover:border-[#E23744]' 
                      : 'border-amber-400/40 hover:border-amber-500';

                    return (
                      <button
                        key={g.table}
                        onClick={() => {
                          setSelectedTable(g.table);
                          setMobilePunchView('cart');
                          setCart({});
                        }}
                        className={`p-2.5 bg-white text-gray-900 border rounded-xl text-left shadow-xs flex justify-between items-center transition ${borderHover}`}
                      >
                        <div className="min-w-0 pr-1">
                          <div className="flex items-center gap-1 mb-0.5">
                            <span className={`text-[9px] font-black px-1.5 py-0.2 rounded uppercase ${badgeColor}`}>
                              {isSwiggy ? 'Swiggy' : isZomato ? 'Zomato' : 'Parcel'}
                            </span>
                          </div>
                          <div className="font-extrabold text-xs text-gray-900 truncate font-mono">
                            {g.table}
                          </div>
                          <div className="text-[10px] text-gray-500">{g.orders.length} KOTs</div>
                        </div>
                        <div className="text-right font-black text-xs text-gray-900 font-mono shrink-0">
                          ₹{g.total}
                        </div>
                      </button>
                    );
                  })}
                </div>
              )}
            </div>

            {/* 15 TABLE TILES GRID (RESPONSIVE) */}
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-2.5 sm:gap-3.5">
              {filteredTables.map(t => {
                const isFree = t.status === "FREE";
                const isOccupied = t.status === "OCCUPIED";
                const isBilling = t.status === "BILLING";

                return (
                  <button
                    key={t.tableNumber}
                    onClick={() => {
                      setSelectedTable(t.tableNumber);
                      setMobilePunchView(isFree ? 'menu' : 'cart');
                      setCart({});
                      setCookingNotes("");
                      setDiscountPercent(0);
                      setCustomDiscountAmt(0);
                    }}
                    className={`relative p-3 sm:p-4 rounded-2xl border-2 text-left flex flex-col justify-between transition-all active:scale-[0.98] shadow-xs min-h-[115px] sm:min-h-[135px] group ${
                      isBilling
                        ? "bg-amber-50/90 border-amber-400 ring-2 ring-amber-300 shadow-amber-100 animate-pulse"
                        : isOccupied
                        ? "bg-white border-blue-400 hover:border-blue-500 shadow-xs"
                        : "bg-white border-emerald-200 hover:border-emerald-400 hover:bg-emerald-50/30"
                    }`}
                  >
                    {/* Tile Top */}
                    <div className="flex items-start justify-between w-full gap-1">
                      <div>
                        <div className="flex items-center gap-1.5 flex-wrap">
                          <span className="text-lg sm:text-xl font-black text-gray-900 font-mono">
                            T-{t.tableNumber.padStart(2, '0')}
                          </span>
                          <span className="text-[9px] sm:text-[10px] text-gray-400 font-bold">
                            [{t.sectionName}]
                          </span>
                        </div>
                        {isFree && (
                          <div className="flex items-center gap-1 mt-0.5 sm:mt-1">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500"></span>
                            <span className="text-[10px] sm:text-[11px] font-bold text-emerald-700">Available</span>
                          </div>
                        )}
                      </div>

                      {/* Status Badges */}
                      {isBilling && (
                        <span className="text-[9px] sm:text-[10px] font-extrabold uppercase bg-amber-500 text-white px-1.5 sm:px-2 py-0.5 rounded-full shadow-xs shrink-0">
                          Bill
                        </span>
                      )}
                      {isOccupied && (
                        <span className="text-[9px] sm:text-[10px] font-bold uppercase bg-blue-100 text-blue-800 border border-blue-200 px-1.5 sm:px-2 py-0.5 rounded-full shrink-0">
                          Dining
                        </span>
                      )}
                    </div>

                    {/* Tile Middle / Running Data */}
                    {isOccupied && (
                      <div className="my-1.5 p-1.5 sm:p-2 bg-blue-50/70 rounded-xl border border-blue-100/80">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] sm:text-xs text-blue-900 font-bold">Running</span>
                          <span className="text-sm sm:text-base font-black text-blue-950 font-mono">₹{t.total}</span>
                        </div>
                        <div className="flex items-center justify-between text-[9px] sm:text-[10px] text-blue-700 mt-0.5">
                          <span>{t.itemCount} Items</span>
                          <span className="flex items-center gap-0.5 font-mono">
                            <Clock size={9} /> {t.elapsedMinutes}m
                          </span>
                        </div>
                      </div>
                    )}

                    {isBilling && (
                      <div className="my-1.5 p-1.5 sm:p-2 bg-amber-100/70 rounded-xl border border-amber-200">
                        <div className="flex items-baseline justify-between">
                          <span className="text-[11px] sm:text-xs text-amber-900 font-bold">Bill Due</span>
                          <span className="text-sm sm:text-base font-black text-amber-950 font-mono">₹{t.total}</span>
                        </div>
                        <div className="text-[9px] sm:text-[10px] text-amber-800 mt-0.5">
                          Requested
                        </div>
                      </div>
                    )}

                    {/* Tile Footer Action */}
                    <div className="pt-1.5 border-t border-gray-100 flex items-center justify-between text-xs text-gray-500">
                      {isFree ? (
                        <>
                          <span className="text-[10px] sm:text-[11px] font-bold text-emerald-800 flex items-center gap-0.5">
                            ⚡ Punch Order
                          </span>
                          <ChevronRight size={13} className="text-emerald-600 group-hover:translate-x-1 transition-transform" />
                        </>
                      ) : (
                        <>
                          <span className="text-[10px] sm:text-[11px] font-bold text-gray-700">Manage / Settle</span>
                          <ChevronRight size={13} className="text-gray-400 group-hover:translate-x-1 transition-transform" />
                        </>
                      )}
                    </div>
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 2: RESPONSIVE TOUCH POS PUNCHING & BILL TERMINAL          */}
        {/* ============================================================= */}
        {(selectedTable || activeView === 'quick_bill') && (
          <div className="flex-1 flex flex-col min-h-0 bg-white overflow-hidden">
            
            {/* MOBILE & TABLET SUB-HEADER & VIEW TOGGLE (< 1024px) */}
            <div className="lg:hidden bg-[#1E1B16] text-white px-3 py-2 border-b border-[#322c24] flex items-center justify-between gap-2 shrink-0">
              <div className="flex items-center gap-2 min-w-0">
                <button
                  onClick={() => {
                    setSelectedTable(null);
                    if (activeView === 'quick_bill') setActiveView('tables');
                  }}
                  className="p-1.5 bg-white/10 hover:bg-white/20 active:scale-95 rounded-lg text-xs font-bold text-gray-200 shrink-0"
                  title="Back to tables"
                >
                  <ArrowLeft size={16} />
                </button>
                <div className="min-w-0">
                  <div className="font-mono font-black text-sm text-[#A18D6D] truncate">
                    {selectedTable?.startsWith("Takeaway") || selectedTable?.startsWith("Swiggy") || selectedTable?.startsWith("Zomato") 
                      ? selectedTable 
                      : `T-${selectedTable?.padStart(2, '0')}`}
                  </div>
                  {activeGroup && (
                    <div className="text-[10px] text-gray-400 font-mono leading-none mt-0.5">
                      ₹{activeGroup.total} running
                    </div>
                  )}
                </div>
              </div>

              {/* Segmented Switcher on Mobile: Menu vs Cart */}
              <div className="flex items-center p-0.5 bg-white/10 rounded-xl text-xs font-bold shrink-0">
                <button
                  onClick={() => setMobilePunchView('menu')}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 text-xs ${
                    mobilePunchView === 'menu' ? 'bg-white text-gray-900 shadow-xs font-extrabold' : 'text-gray-300'
                  }`}
                >
                  <Utensils size={13} />
                  <span>Menu</span>
                </button>
                <button
                  onClick={() => setMobilePunchView('cart')}
                  className={`px-2.5 py-1.5 rounded-lg transition flex items-center gap-1 text-xs ${
                    mobilePunchView === 'cart' ? 'bg-[#A18D6D] text-white shadow-xs font-extrabold' : 'text-gray-300'
                  }`}
                >
                  <Receipt size={13} />
                  <span>
                    Docket{cartItemCount > 0 ? ` (${cartItemCount})` : ''}
                  </span>
                </button>
              </div>
            </div>

            {/* MAIN TWO-PANE BODY */}
            <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">
              
              {/* --------------------------------------------------------- */}
              {/* PANE 1: MENU EXPLORER & QUICK TOUCH PUNCH                  */}
              {/* (Visible when mobilePunchView === 'menu' OR desktop lg:flex) */}
              {/* --------------------------------------------------------- */}
              <div className={`${mobilePunchView === 'menu' ? 'flex' : 'hidden'} lg:flex flex-1 flex-col border-r border-[#e8e1d6] min-h-0 overflow-hidden bg-[#FBF9F5]`}>
                
                {/* Search & Category Header */}
                <div className="p-2.5 sm:p-3.5 bg-white border-b border-[#e8e1d6] space-y-2 shrink-0">
                  <div className="flex items-center justify-between gap-2">
                    <button
                      onClick={() => {
                        setSelectedTable(null);
                        if (activeView === 'quick_bill') setActiveView('tables');
                      }}
                      className="hidden lg:flex items-center gap-1 px-3 py-1.5 bg-gray-100 hover:bg-gray-200 border border-gray-200 rounded-xl text-xs font-bold text-gray-700 shadow-xs shrink-0"
                    >
                      <ArrowLeft size={14} /> Back
                    </button>

                    {/* Search Bar */}
                    <div className="relative flex-1">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={14} />
                      <input
                        type="text"
                        placeholder="Search dishes (e.g. Naan, Paneer, Biryani)..."
                        value={searchQuery}
                        onChange={e => setSearchQuery(e.target.value)}
                        className="w-full pl-8 pr-7 py-2 text-xs bg-gray-50 border border-gray-200 rounded-xl focus:outline-none focus:ring-1 focus:ring-gray-900 font-medium"
                      />
                      {searchQuery && (
                        <button
                          onClick={() => setSearchQuery("")}
                          className="absolute right-2.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                        >
                          <X size={13} />
                        </button>
                      )}
                    </div>

                    {/* Veg / Non-Veg Quick Switcher */}
                    <div className="flex items-center p-0.5 bg-gray-100 rounded-xl text-xs font-bold shrink-0">
                      <button
                        onClick={() => setVegFilter("ALL")}
                        className={`px-2 py-1 rounded-lg transition text-[11px] ${vegFilter === "ALL" ? "bg-white text-gray-900 shadow-xs" : "text-gray-600"}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setVegFilter("VEG")}
                        className={`px-2 py-1 rounded-lg transition text-[11px] flex items-center gap-1 ${vegFilter === "VEG" ? "bg-green-600 text-white shadow-xs" : "text-green-700"}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-green-500"></span> Veg
                      </button>
                      <button
                        onClick={() => setVegFilter("NON_VEG")}
                        className={`px-2 py-1 rounded-lg transition text-[11px] flex items-center gap-1 ${vegFilter === "NON_VEG" ? "bg-red-600 text-white shadow-xs" : "text-red-700"}`}
                      >
                        <span className="w-1.5 h-1.5 rounded-full bg-red-500"></span> Non
                      </button>
                    </div>
                  </div>

                  {/* Category Pills Bar */}
                  <div className="flex items-center gap-1.5 overflow-x-auto pb-1 text-xs">
                    {categories.map(cat => (
                      <button
                        key={cat}
                        onClick={() => setActiveCategory(cat)}
                        className={`px-2.5 py-1 rounded-xl font-bold whitespace-nowrap transition text-[11px] sm:text-xs ${
                          activeCategory === cat
                            ? "bg-[#1E1B16] text-white shadow-xs"
                            : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                        }`}
                      >
                        {cat}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Dishes Grid */}
                <div className="flex-1 p-2.5 sm:p-3.5 pb-24 lg:pb-3.5 overflow-y-auto">
                  <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-4 gap-2 sm:gap-2.5">
                    {filteredMenuItems.map(item => {
                      const inCartQty = cart[item.id]?.qty || 0;

                      return (
                        <div
                          key={item.id}
                          className={`p-2.5 sm:p-3 rounded-2xl border transition-all flex flex-col justify-between shadow-xs ${
                            inCartQty > 0
                              ? "bg-amber-50/80 border-[#A18D6D] ring-1 ring-[#A18D6D]"
                              : "bg-white border-gray-200 hover:border-gray-300"
                          }`}
                        >
                          <div>
                            <div className="flex items-start justify-between gap-1 mb-1">
                              <span className={`w-3.5 h-3.5 border flex items-center justify-center shrink-0 mt-0.5 ${
                                item.isVeg ? "border-green-600" : "border-red-600"
                              }`}>
                                <span className={`w-1.5 h-1.5 rounded-full ${
                                  item.isVeg ? "bg-green-600" : "bg-red-600"
                                }`}></span>
                              </span>
                              <span className="text-[9px] font-bold text-gray-400 uppercase truncate">
                                {item.category}
                              </span>
                            </div>

                            <div className="font-extrabold text-xs sm:text-sm text-gray-900 leading-tight">
                              {item.name}
                            </div>
                          </div>

                          <div className="flex items-center justify-between mt-2.5 pt-2 border-t border-gray-100">
                            <span className="font-black text-xs sm:text-sm font-mono text-[#A18D6D]">
                              ₹{item.price}
                            </span>

                            {inCartQty > 0 ? (
                              <div className="flex items-center gap-1 bg-gray-900 text-white rounded-xl p-0.5 shadow-xs">
                                <button
                                  onClick={() => removeFromCart(item.id)}
                                  className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-lg active:scale-90"
                                >
                                  <Minus size={12} />
                                </button>
                                <span className="font-mono font-black text-xs w-4 text-center">
                                  {inCartQty}
                                </span>
                                <button
                                  onClick={() => addToCart(item)}
                                  className="w-6 h-6 flex items-center justify-center hover:bg-white/20 rounded-lg active:scale-90"
                                >
                                  <Plus size={12} />
                                </button>
                              </div>
                            ) : (
                              <button
                                onClick={() => addToCart(item)}
                                className="px-2.5 py-1 bg-gray-100 hover:bg-gray-200 text-gray-900 font-extrabold text-xs rounded-xl transition active:scale-95 border border-gray-200"
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

                {/* MOBILE FLOATING CART BAR (Shown when items in cart on mobile) */}
                {(cartItemCount > 0 || (activeGroup && activeGroup.total > 0)) && (
                  <div className="lg:hidden p-3 bg-[#1E1B16] text-white border-t border-[#3a332a] shadow-2xl z-40 shrink-0">
                    <div className="flex items-center justify-between gap-2 max-w-full">
                      <div className="min-w-0">
                        <span className="text-[11px] text-gray-400 font-bold block truncate">
                          {cartItemCount > 0 ? `${cartItemCount} New Item${cartItemCount > 1 ? 's' : ''}` : 'Running Orders'} • T-{selectedTable?.padStart(2, '0')}
                        </span>
                        <span className="text-lg font-black font-mono text-[#e8d5b5]">
                          ₹{combinedSubtotal}
                        </span>
                      </div>
                      <button
                        onClick={() => setMobilePunchView('cart')}
                        className="px-3.5 py-2.5 bg-[#A18D6D] hover:bg-[#8e7a5c] text-white text-xs font-black uppercase tracking-wider rounded-xl shadow-md flex items-center gap-1.5 shrink-0 active:scale-95 transition"
                      >
                        <span>View Docket</span>
                        <ChevronRight size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              {/* --------------------------------------------------------- */}
              {/* PANE 2: THE LIVE KOT TICKET & BILL DOCKET                  */}
              {/* (Visible when mobilePunchView === 'cart' OR desktop lg:flex) */}
              {/* --------------------------------------------------------- */}
              <div className={`${mobilePunchView === 'cart' ? 'flex' : 'hidden'} lg:flex w-full lg:w-[380px] xl:w-[420px] max-w-full flex-col bg-white border-t lg:border-t-0 shadow-lg min-h-0 overflow-hidden shrink-0`}>
                
                {/* Desktop Ticket Header */}
                <div className="p-3 bg-[#1E1B16] text-white space-y-2 shrink-0">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-base sm:text-lg font-black font-mono text-[#A18D6D]">
                        {selectedTable?.startsWith("Takeaway") || selectedTable?.startsWith("Swiggy") || selectedTable?.startsWith("Zomato") 
                          ? selectedTable 
                          : `TABLE ${selectedTable}`}
                      </span>
                      {activeGroup && (
                        <span className="text-[10px] font-bold bg-blue-500/20 text-blue-300 border border-blue-500/30 px-2 py-0.5 rounded">
                          ₹{activeGroup.total} Running
                        </span>
                      )}
                    </div>

                    <div className="flex items-center gap-1.5">
                      {activeGroup && (
                        <button
                          onClick={() => setIsShiftModalOpen(true)}
                          className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-gray-300"
                          title="Shift Table"
                        >
                          <RotateCcw size={13} />
                        </button>
                      )}
                      <button
                        onClick={() => {
                          setSelectedTable(null);
                          setCart({});
                        }}
                        className="p-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold text-gray-300"
                        title="Close Table"
                      >
                        <X size={14} />
                      </button>
                    </div>
                  </div>

                  {/* Mobile Shortcut to add more dishes */}
                  <div className="lg:hidden flex justify-between items-center pt-1 border-t border-white/10">
                    <button
                      onClick={() => setMobilePunchView('menu')}
                      className="text-xs text-[#e8d5b5] font-bold flex items-center gap-1 hover:underline"
                    >
                      <Plus size={13} /> Add More Dishes from Menu
                    </button>
                  </div>

                  {/* Captain & Pax Selectors */}
                  <div className="grid grid-cols-2 gap-2 text-xs">
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Captain / Steward</label>
                      <select
                        value={selectedCaptain}
                        onChange={e => setSelectedCaptain(e.target.value)}
                        className="w-full bg-white/10 text-white rounded-lg p-1 text-xs font-bold border border-white/20 focus:outline-none"
                      >
                        {CAPTAINS.map(c => <option key={c} value={c} className="bg-gray-900">{c}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="text-[10px] text-gray-400 block mb-0.5">Guest Pax Count</label>
                      <select
                        value={guestPax}
                        onChange={e => setGuestPax(Number(e.target.value))}
                        className="w-full bg-white/10 text-white rounded-lg p-1 text-xs font-bold border border-white/20 focus:outline-none"
                      >
                        {[1, 2, 3, 4, 5, 6, 8, 10, 12].map(p => <option key={p} value={p} className="bg-gray-900">{p} Guests</option>)}
                      </select>
                    </div>
                  </div>
                </div>

                {/* Scrollable Middle: Running KOTs, New Cart Items & Discount Engine */}
                <div className="flex-1 p-3 overflow-y-auto space-y-3 bg-gray-50/50">
                  
                  {/* 1. RUNNING KOTs (If already sent to kitchen) */}
                  {activeGroup && activeGroup.orders.length > 0 && (
                    <div className="bg-white p-2.5 rounded-2xl border border-blue-200 shadow-xs space-y-2">
                      <div className="flex items-center justify-between text-xs font-black text-blue-900 border-b border-gray-100 pb-1">
                        <span className="flex items-center gap-1">
                          <Utensils size={13} className="text-blue-600" />
                          Running in Kitchen ({activeGroup.orders.length} KOTs)
                        </span>
                        <span className="font-mono text-blue-950 font-bold">₹{activeGroup.total}</span>
                      </div>

                      <div className="space-y-1.5 max-h-36 overflow-y-auto">
                        {activeGroup.orders.map((ord: any) => {
                          let items: any[] = [];
                          try {
                            items = typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items;
                          } catch (e) {}

                          return (
                            <div key={ord.id} className="bg-blue-50/40 p-2 rounded-xl text-xs space-y-0.5">
                              <div className="flex justify-between text-[10px] font-bold text-gray-500">
                                <span>KOT #{ord.order_number || ord.id}</span>
                                <span className="uppercase text-blue-700 font-black">{ord.status}</span>
                              </div>
                              {Array.isArray(items) && items.filter(i => i.id !== "NOTE").map((it, idx) => (
                                <div key={idx} className="flex justify-between text-gray-800 text-[11px]">
                                  <span>{it.qty}x {it.name}</span>
                                  <span className="font-mono font-bold">₹{it.price * it.qty}</span>
                                </div>
                              ))}
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* 2. NEW ITEMS CART */}
                  <div className="bg-white p-2.5 rounded-2xl border border-[#e8e1d6] shadow-xs space-y-2">
                    <div className="flex items-center justify-between text-xs font-black text-gray-900 border-b border-gray-100 pb-1">
                      <span>New Items to Punch ({cartItemCount})</span>
                      {cartItemCount > 0 && (
                        <button
                          onClick={() => setCart({})}
                          className="text-[10px] text-red-600 font-bold hover:underline"
                        >
                          Clear
                        </button>
                      )}
                    </div>

                    {cartItems.length === 0 ? (
                      <div className="py-4 text-center text-gray-400 text-xs">
                        No new dishes in cart.<br />
                        <button
                          onClick={() => setMobilePunchView('menu')}
                          className="mt-2 text-blue-600 font-bold underline inline-flex items-center gap-1"
                        >
                          <Plus size={13} /> Browse Menu
                        </button>
                      </div>
                    ) : (
                      <div className="space-y-1.5 max-h-44 overflow-y-auto">
                        {cartItems.map(c => (
                          <div key={c.item.id} className="flex items-center justify-between text-xs py-1 border-b border-gray-50">
                            <div className="flex-1 pr-2">
                              <div className="font-bold text-gray-900 truncate">{c.item.name}</div>
                              <div className="text-[10px] text-gray-500 font-mono">₹{c.item.price} each</div>
                            </div>

                            <div className="flex items-center gap-1.5 shrink-0">
                              <div className="flex items-center gap-1 bg-gray-100 rounded-lg p-0.5">
                                <button
                                  onClick={() => removeFromCart(c.item.id)}
                                  className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded text-gray-700"
                                >
                                  -
                                </button>
                                <span className="font-mono font-bold w-4 text-center">{c.qty}</span>
                                <button
                                  onClick={() => addToCart(c.item)}
                                  className="w-5 h-5 flex items-center justify-center hover:bg-gray-200 rounded text-gray-700"
                                >
                                  +
                                </button>
                              </div>
                              <span className="font-mono font-black text-gray-900 w-11 text-right">
                                ₹{c.item.price * c.qty}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}

                    {/* Quick Kitchen Cooking Tags */}
                    {cartItemCount > 0 && (
                      <div className="pt-2 border-t border-gray-100 space-y-1.5">
                        <div className="flex flex-wrap gap-1">
                          {["Extra Spicy", "Jain / No Onion", "Less Oil", "Crispy", "Extra Butter"].map(tag => (
                            <button
                              key={tag}
                              type="button"
                              onClick={() => setCookingNotes(prev => prev ? `${prev}, ${tag}` : tag)}
                              className="text-[9px] font-bold bg-gray-100 hover:bg-gray-200 text-gray-700 px-1.5 py-0.5 rounded transition"
                            >
                              +{tag}
                            </button>
                          ))}
                        </div>
                        <input
                          type="text"
                          placeholder="Cooking instruction (e.g. less salt)..."
                          value={cookingNotes}
                          onChange={e => setCookingNotes(e.target.value)}
                          className="w-full text-xs p-1.5 bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
                        />
                      </div>
                    )}
                  </div>

                  {/* 3. DISCOUNT & CHARGES CONTROLS */}
                  {combinedSubtotal > 0 && (
                    <div className="bg-white p-2.5 rounded-2xl border border-gray-200 shadow-xs space-y-2 text-xs">
                      <div className="flex items-center justify-between font-bold text-gray-700">
                        <span>Discount Voucher</span>
                        <span className="text-[#A18D6D] font-mono">
                          {discountPercent > 0 ? `${discountPercent}% Off` : customDiscountAmt > 0 ? `₹${customDiscountAmt} Off` : "None"}
                        </span>
                      </div>

                      <div className="grid grid-cols-5 gap-1 text-[11px] font-bold w-full max-w-full">
                        {[0, 5, 10, 15, 20].map(pct => (
                          <button
                            key={pct}
                            onClick={() => {
                              setDiscountPercent(pct);
                              setCustomDiscountAmt(0);
                            }}
                            className={`py-1.5 px-0.5 rounded-lg border text-center transition truncate text-[11px] ${
                              discountPercent === pct && customDiscountAmt === 0
                                ? "bg-gray-900 text-white border-gray-900 shadow-xs font-black"
                                : "bg-gray-50 text-gray-700 border-gray-200 hover:bg-gray-100"
                            }`}
                          >
                            {pct === 0 ? "0%" : `${pct}%`}
                          </button>
                        ))}
                      </div>

                      {/* Service charge toggle */}
                      <div className="flex items-center justify-between pt-1 border-t border-gray-100">
                        <label className="text-gray-600 flex items-center gap-1.5 cursor-pointer text-[11px]">
                          <input
                            type="checkbox"
                            checked={applyServiceCharge}
                            onChange={e => setApplyServiceCharge(e.target.checked)}
                            className="rounded text-gray-900"
                          />
                          <span>Apply Service Charge (5%)</span>
                        </label>
                        <span className="font-mono text-gray-500 text-[11px] shrink-0">₹{serviceCharge}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Financial Calculation Bar */}
                {combinedSubtotal > 0 && (
                  <div className="p-2.5 sm:p-3 bg-gray-50 border-t border-gray-200 space-y-1.5 text-xs shrink-0 max-w-full">
                    <div className="flex items-center justify-between text-gray-600 gap-2">
                      <span className="truncate">Subtotal</span>
                      <span className="font-mono font-bold shrink-0">₹{combinedSubtotal}</span>
                    </div>
                    {calculatedDiscount > 0 && (
                      <div className="flex items-center justify-between text-emerald-700 font-bold gap-2">
                        <span className="truncate">Discount ({discountPercent > 0 ? `${discountPercent}%` : 'Flat'})</span>
                        <span className="font-mono shrink-0">-₹{calculatedDiscount}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between text-gray-600 gap-2">
                      <span className="truncate text-[11px] sm:text-xs">GST (5% • CGST+SGST)</span>
                      <span className="font-mono font-bold shrink-0">₹{gst}</span>
                    </div>
                    {serviceCharge > 0 && (
                      <div className="flex items-center justify-between text-gray-600 gap-2">
                        <span className="truncate text-[11px] sm:text-xs">Service Charge (5%)</span>
                        <span className="font-mono font-bold shrink-0">₹{serviceCharge}</span>
                      </div>
                    )}
                    <div className="flex items-center justify-between gap-2 pt-2 mt-1 border-t-2 border-gray-900">
                      <span className="font-black text-gray-950 text-sm sm:text-base">GRAND TOTAL</span>
                      <span className="font-black text-xl sm:text-2xl font-mono text-gray-950 shrink-0">₹{grandTotal}</span>
                    </div>
                  </div>
                )}

                {/* ACTION BUTTONS */}
                <div className="p-2.5 sm:p-3 bg-white border-t border-gray-200 space-y-2 shrink-0 max-w-full">
                  
                  {/* Punch KOT (if new items in cart) */}
                  {cartItemCount > 0 && (
                    <div className="flex flex-col sm:flex-row gap-2 w-full">
                      <button
                        onClick={() => handlePunchKOT(true)}
                        disabled={isPunching}
                        className="flex-1 py-3 px-3 bg-[#1E1B16] hover:bg-black text-white font-black text-xs uppercase tracking-wider rounded-xl transition shadow-md flex items-center justify-center gap-1.5 active:scale-[0.98] disabled:opacity-50"
                      >
                        <Printer size={15} />
                        <span>{isPunching ? "Punching..." : "🔥 KOT & Print Slip"}</span>
                      </button>
                      <button
                        onClick={() => handlePunchKOT(false)}
                        disabled={isPunching}
                        className="py-2.5 sm:py-3 px-3 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold text-xs rounded-xl transition border border-gray-200 flex items-center justify-center gap-1 active:scale-[0.98] disabled:opacity-50"
                        title="Send to kitchen without printing"
                      >
                        <span>🔥 KOT Only</span>
                      </button>
                    </div>
                  )}

                  {/* Settle / Bill Print (if table has running orders) */}
                  {activeGroup && activeGroup.orders.length > 0 && (
                    <div className="space-y-2">
                      <button
                        onClick={() => {
                          printOfficialInvoice(
                            activeGroup.table,
                            activeGroup.orders,
                            activeGroup.total,
                            calculatedDiscount,
                            gst,
                            serviceCharge,
                            grandTotal
                          );
                        }}
                        className="w-full py-2 bg-gray-800 hover:bg-gray-900 text-white font-bold text-xs rounded-xl transition shadow-xs flex items-center justify-center gap-1.5"
                      >
                        <Printer size={14} /> Print Estimate / Bill
                      </button>

                      <div className="grid grid-cols-3 gap-1.5">
                        <button
                          onClick={() => {
                            setCashTendered(grandTotal);
                            setWaModal({
                              isOpen: true,
                              data: {
                                tableNumber: activeGroup.table,
                                groupOrders: activeGroup.orders,
                                grandTotal
                              },
                              paymentMethod: 'CASH'
                            });
                          }}
                          className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1"
                        >
                          <DollarSign size={14} /> Cash
                        </button>

                        <button
                          onClick={() => {
                            setWaModal({
                              isOpen: true,
                              data: {
                                tableNumber: activeGroup.table,
                                groupOrders: activeGroup.orders,
                                grandTotal
                              },
                              paymentMethod: 'UPI'
                            });
                          }}
                          className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1"
                        >
                          <Smartphone size={14} /> UPI QR
                        </button>

                        <button
                          onClick={() => {
                            setSplitCashAmt(Math.round(grandTotal / 2));
                            setWaModal({
                              isOpen: true,
                              data: {
                                tableNumber: activeGroup.table,
                                groupOrders: activeGroup.orders,
                                grandTotal
                              },
                              paymentMethod: 'SPLIT'
                            });
                          }}
                          className="py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1"
                        >
                          <Split size={14} /> Split
                        </button>
                      </div>

                      {/* Dedicated Online Settle Buttons */}
                      {activeGroup.table.toLowerCase().includes('swiggy') && (
                        <button
                          onClick={() => markPaid(activeGroup.table, activeGroup.orders.map((o: any) => o.id), 'SWIGGY')}
                          className="w-full py-2.5 bg-[#FC8019] hover:bg-[#e06f14] text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Bike size={14} /> Settle Swiggy Paid (₹{grandTotal})
                        </button>
                      )}

                      {activeGroup.table.toLowerCase().includes('zomato') && (
                        <button
                          onClick={() => markPaid(activeGroup.table, activeGroup.orders.map((o: any) => o.id), 'ZOMATO')}
                          className="w-full py-2.5 bg-[#E23744] hover:bg-[#c92b37] text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Utensils size={14} /> Settle Zomato Paid (₹{grandTotal})
                        </button>
                      )}
                    </div>
                  )}

                  {/* Quick Bill instant settle */}
                  {activeView === 'quick_bill' && cartItemCount > 0 && (
                    <div className="grid grid-cols-2 gap-2">
                      {selectedTable?.toLowerCase().includes('swiggy') ? (
                        <button
                          onClick={async () => {
                            await handlePunchKOT(false);
                            const group = tableGroups[selectedTable || ''];
                            if (group) {
                              markPaid(selectedTable || '', group.orders.map((o: any) => o.id), 'SWIGGY');
                            }
                          }}
                          className="col-span-2 py-2.5 bg-[#FC8019] hover:bg-[#e06f14] text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Bike size={14} /> Instant Settle Swiggy Order
                        </button>
                      ) : selectedTable?.toLowerCase().includes('zomato') ? (
                        <button
                          onClick={async () => {
                            await handlePunchKOT(false);
                            const group = tableGroups[selectedTable || ''];
                            if (group) {
                              markPaid(selectedTable || '', group.orders.map((o: any) => o.id), 'ZOMATO');
                            }
                          }}
                          className="col-span-2 py-2.5 bg-[#E23744] hover:bg-[#c92b37] text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1.5"
                        >
                          <Utensils size={14} /> Instant Settle Zomato Order
                        </button>
                      ) : (
                        <>
                          <button
                            onClick={async () => {
                              await handlePunchKOT(false);
                              const group = tableGroups[selectedTable || ''];
                              if (group) {
                                markPaid(selectedTable || '', group.orders.map((o: any) => o.id), 'CASH');
                              }
                            }}
                            className="py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1"
                          >
                            <DollarSign size={14} /> Settle Cash
                          </button>
                          <button
                            onClick={async () => {
                              await handlePunchKOT(false);
                              const group = tableGroups[selectedTable || ''];
                              if (group) {
                                markPaid(selectedTable || '', group.orders.map((o: any) => o.id), 'UPI');
                              }
                            }}
                            className="py-2.5 bg-purple-600 hover:bg-purple-700 text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-1"
                          >
                            <Smartphone size={14} /> Settle UPI
                          </button>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 3: LIVE KITCHEN MONITOR (KOT TRACKER)                     */}
        {/* ============================================================= */}
        {activeView === 'live_kots' && (
          <div className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4 pb-28 sm:pb-12">
            <div className="flex items-center justify-between bg-white p-3.5 rounded-2xl border border-gray-200">
              <div>
                <h2 className="text-base sm:text-lg font-black text-gray-900 flex items-center gap-2">
                  <ChefHat className="text-[#A18D6D]" size={18} /> Active Kitchen Tickets ({orders.length} KOTs)
                </h2>
                <p className="text-[11px] text-gray-500">Synced live with Kitchen Display System</p>
              </div>
              <button
                onClick={fetchOrders}
                className="p-2 bg-gray-100 hover:bg-gray-200 rounded-xl text-xs font-bold text-gray-700 flex items-center gap-1.5"
              >
                <RefreshCw size={13} /> Refresh
              </button>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {orders.map(ord => {
                let items: any[] = [];
                try {
                  items = typeof ord.items === "string" ? JSON.parse(ord.items) : ord.items;
                } catch (e) {}

                const diffMs = new Date().getTime() - new Date(ord.created_at).getTime();
                const minsAgo = Math.max(1, Math.floor(diffMs / 60000));

                return (
                  <div key={ord.id} className="bg-white rounded-2xl border border-gray-200 p-3.5 shadow-xs space-y-2.5">
                    <div className="flex items-start justify-between border-b pb-2">
                      <div>
                        <span className="text-base font-black text-gray-900">
                          {ord.table_number.match(/^(Swiggy|Zomato|Takeaway)/i) ? ord.table_number : `Table ${ord.table_number}`}
                        </span>
                        <div className="text-[10px] text-gray-400 font-mono">
                          KOT #{ord.order_number || ord.id} • {minsAgo}m ago
                        </div>
                      </div>
                      <span className={`text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full ${
                        ord.status === "received" ? "bg-red-100 text-red-700" :
                        ord.status === "preparing" ? "bg-amber-100 text-amber-700" :
                        ord.status === "ready" ? "bg-emerald-100 text-emerald-700" : "bg-gray-100 text-gray-700"
                      }`}>
                        {ord.status}
                      </span>
                    </div>

                    <div className="space-y-1 max-h-36 overflow-y-auto text-xs">
                      {Array.isArray(items) && items.map((it, idx) => (
                        <div key={idx} className="flex justify-between py-0.5">
                          <span className={it.id === "NOTE" ? "text-amber-800 font-bold" : "text-gray-800 font-medium"}>
                            {it.id === "NOTE" ? `📝 ${it.name}` : `${it.qty}x ${it.name}`}
                          </span>
                          {it.id !== "NOTE" && <span className="font-mono text-gray-500">₹{it.price * it.qty}</span>}
                        </div>
                      ))}
                    </div>

                    <div className="pt-2 border-t flex justify-between items-center text-xs">
                      <span className="font-black text-gray-900 font-mono">Total: ₹{ord.total_amount}</span>
                      <button
                        onClick={() => {
                          setSelectedTable(ord.table_number);
                          setMobilePunchView('cart');
                          setActiveView('tables');
                        }}
                        className="text-blue-600 font-bold hover:underline"
                      >
                        View Table ➜
                      </button>
                    </div>
                  </div>
                );
              })}
              {orders.length === 0 && (
                <div className="col-span-full bg-white p-8 rounded-2xl border text-center text-gray-400 text-xs">
                  No active orders in kitchen right now.
                </div>
              )}
            </div>
          </div>
        )}

        {/* ============================================================= */}
        {/* VIEW 4: DAY REGISTER / SETTLED BILLS REPRINT                  */}
        {/* ============================================================= */}
        {activeView === 'register' && (
          <div className="flex-1 p-3 sm:p-5 md:p-6 overflow-y-auto max-w-7xl mx-auto w-full space-y-4 pb-28 sm:pb-12">
            
            {/* Day Sales Summary */}
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2.5 sm:gap-3">
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-[11px] sm:text-xs font-bold text-gray-500">Today's Settled Bills</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-gray-900 mt-0.5">{settledOrders.length}</div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-[11px] sm:text-xs font-bold text-gray-500">Total Sales</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-emerald-700 mt-0.5">
                  ₹{settledOrders.reduce((acc, o) => acc + Number(o.total_amount || 0), 0)}
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-[11px] sm:text-xs font-bold text-gray-500">Cash Collections</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-blue-700 mt-0.5">
                  ₹{settledOrders.filter(o => o.items?.includes("CASH")).reduce((acc, o) => acc + Number(o.total_amount || 0), 0)}
                </div>
              </div>
              <div className="bg-white p-3 sm:p-4 rounded-2xl border border-gray-200 shadow-xs">
                <span className="text-[11px] sm:text-xs font-bold text-gray-500">UPI Collections</span>
                <div className="text-xl sm:text-2xl font-black font-mono text-purple-700 mt-0.5">
                  ₹{settledOrders.filter(o => o.items?.includes("UPI")).reduce((acc, o) => acc + Number(o.total_amount || 0), 0)}
                </div>
              </div>
            </div>

            {/* Settled Orders Table */}
            <div className="bg-white rounded-2xl border border-gray-200 shadow-xs overflow-hidden">
              <div className="p-3.5 border-b border-gray-200 flex justify-between items-center">
                <h3 className="font-bold text-xs sm:text-sm text-gray-900">Today's Completed Invoices</h3>
                <span className="text-[11px] text-gray-500">{new Date().toLocaleDateString()}</span>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs min-w-[500px]">
                  <thead className="bg-gray-50 border-b text-gray-500 font-bold uppercase text-[10px]">
                    <tr>
                      <th className="p-2.5">Invoice #</th>
                      <th className="p-2.5">Table / Source</th>
                      <th className="p-2.5">Time</th>
                      <th className="p-2.5">Amount</th>
                      <th className="p-2.5">Mode</th>
                      <th className="p-2.5 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {settledOrders.map((ord: any) => {
                      const payMode = ord.items?.includes("UPI") ? "UPI" : "CASH";
                      const timeStr = new Date(ord.created_at).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: true });

                      return (
                        <tr key={ord.id} className="hover:bg-gray-50">
                          <td className="p-2.5 font-mono font-bold text-gray-900">#{ord.order_number || ord.id}</td>
                          <td className="p-2.5 font-medium text-gray-800">
                            {ord.table_number.match(/^(Swiggy|Zomato|Takeaway)/i) ? ord.table_number : `Table ${ord.table_number}`}
                          </td>
                          <td className="p-2.5 text-gray-500 font-mono">{timeStr}</td>
                          <td className="p-2.5 font-mono font-black text-gray-900">₹{ord.total_amount}</td>
                          <td className="p-2.5">
                            <span className={`px-2 py-0.5 rounded font-bold text-[10px] ${
                              payMode === "UPI" ? "bg-purple-100 text-purple-700" : "bg-emerald-100 text-emerald-700"
                            }`}>
                              {payMode}
                            </span>
                          </td>
                          <td className="p-2.5 text-right">
                            <button
                              onClick={() => {
                                const subtotal = ord.total_amount;
                                const gstAmt = Math.round(subtotal * 0.05);
                                const gTot = subtotal + gstAmt;
                                printOfficialInvoice(ord.table_number, [ord], subtotal, 0, gstAmt, 0, gTot, payMode);
                              }}
                              className="px-2 py-1 bg-gray-100 hover:bg-gray-200 text-gray-800 font-bold rounded-lg text-[10px] inline-flex items-center gap-1"
                            >
                              <Printer size={12} /> Reprint
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                    {settledOrders.length === 0 && (
                      <tr>
                        <td colSpan={6} className="p-8 text-center text-gray-400">
                          No settled bills recorded for today yet.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ============================================================= */}
      {/* MODAL 1: SHIFT / TRANSFER TABLE                                */}
      {/* ============================================================= */}
      {isShiftModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm p-5 space-y-4 shadow-2xl">
            <h3 className="font-black text-base sm:text-lg text-gray-900 flex items-center gap-2">
              <RotateCcw className="text-blue-600" size={18} /> Shift Table {selectedTable}
            </h3>
            <p className="text-xs text-gray-500">
              Transfer active running KOTs to an empty table.
            </p>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-1">Target Empty Table:</label>
              <select
                value={targetShiftTable}
                onChange={e => setTargetShiftTable(e.target.value)}
                className="w-full border border-gray-200 rounded-xl p-2.5 text-xs sm:text-sm font-bold focus:ring-2 focus:ring-blue-500 outline-none"
              >
                <option value="">-- Choose Free Table --</option>
                {tablesList.filter(t => t.status === "FREE").map(t => (
                  <option key={t.tableNumber} value={t.tableNumber}>
                    Table {t.tableNumber} (🟢 Free - {t.sectionName})
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

      {/* ============================================================= */}
      {/* MODAL 2: PETPOOJA SETTLEMENT, TENDER & DIGITAL BILL            */}
      {/* ============================================================= */}
      {waModal.isOpen && waModal.data && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-3 sm:p-4 backdrop-blur-xs">
          <div className="bg-white rounded-3xl w-full max-w-sm sm:max-w-md overflow-hidden shadow-2xl animate-in zoom-in-95 duration-150 max-h-[92vh] flex flex-col">
            {/* Header */}
            <div className={`p-3.5 text-white text-center ${
              waModal.paymentMethod === 'CASH' ? 'bg-emerald-600' :
              waModal.paymentMethod === 'UPI' ? 'bg-purple-600' : 'bg-blue-600'
            }`}>
              <h3 className="font-black text-base sm:text-lg">
                Settle Table {waModal.data.tableNumber} • ₹{waModal.data.grandTotal}
              </h3>
              <p className="text-white/90 text-xs font-bold">
                {waModal.paymentMethod === 'CASH' ? '💵 CASH SETTLEMENT' : waModal.paymentMethod === 'UPI' ? '📱 DYNAMIC UPI QR' : '🔀 SPLIT PAYMENT (CASH + UPI)'}
              </p>
            </div>

            <div className="p-4 sm:p-5 space-y-3.5 overflow-y-auto flex-1">
              {/* CASH TENDER CALCULATOR */}
              {waModal.paymentMethod === 'CASH' && (
                <div className="bg-emerald-50 border border-emerald-200 p-3 rounded-2xl space-y-2">
                  <div className="flex items-center justify-between text-xs font-bold text-emerald-950">
                    <span>Cash Tendered / Received:</span>
                    <span className="font-mono text-sm text-emerald-900">Bill: ₹{waModal.data.grandTotal}</span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-gray-500 text-sm">₹</span>
                    <input
                      type="number"
                      value={cashTendered || ''}
                      onChange={(e) => setCashTendered(Number(e.target.value) || 0)}
                      className="w-full bg-white border border-emerald-300 rounded-xl p-2 font-mono font-black text-base text-gray-900 focus:outline-none focus:ring-2 focus:ring-emerald-500"
                      placeholder={String(waModal.data.grandTotal)}
                    />
                  </div>

                  {/* Quick Denominations */}
                  <div className="flex items-center gap-1.5 flex-wrap text-xs">
                    <button
                      type="button"
                      onClick={() => setCashTendered(waModal.data.grandTotal)}
                      className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-emerald-800 text-[11px]"
                    >
                      Exact (₹{waModal.data.grandTotal})
                    </button>
                    {[500, 1000, 2000].map(amt => (
                      <button
                        key={amt}
                        type="button"
                        onClick={() => setCashTendered(amt)}
                        className="px-2.5 py-1 bg-white hover:bg-emerald-100 border border-emerald-300 rounded-lg font-bold text-emerald-800 text-[11px]"
                      >
                        ₹{amt}
                      </button>
                    ))}
                  </div>

                  {/* Return Change Indicator */}
                  <div className="pt-1.5 border-t border-emerald-200 flex items-center justify-between font-mono font-black">
                    <span className="text-xs text-gray-700">Change to Return:</span>
                    <span className={`text-base ${cashTendered >= waModal.data.grandTotal ? 'text-emerald-700' : 'text-red-600'}`}>
                      {cashTendered >= waModal.data.grandTotal 
                        ? `₹${cashTendered - waModal.data.grandTotal}` 
                        : `Short by ₹${waModal.data.grandTotal - cashTendered}`}
                    </span>
                  </div>
                </div>
              )}

              {/* DYNAMIC UPI QR DISPLAY */}
              {waModal.paymentMethod === 'UPI' && (
                <div className="bg-purple-50 border border-purple-200 p-3 rounded-2xl flex flex-col items-center text-center">
                  <span className="text-xs font-bold text-purple-900 mb-1">Customer Counter Scan QR</span>
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=150x150&data=${encodeURIComponent(`upi://pay?pa=7499934257@okaxis&pn=Hotel%20White%20Bliss&am=${waModal.data.grandTotal}&cu=INR&tn=Table%20${waModal.data.tableNumber}`)}`}
                    alt="UPI QR Code"
                    className="w-36 h-36 my-1 border p-1 rounded-xl shadow-xs bg-white"
                  />
                  <div className="font-mono font-black text-sm text-purple-950">₹{waModal.data.grandTotal}</div>
                  <div className="text-[10px] text-gray-500">Google Pay • PhonePe • Paytm • BHIM</div>
                </div>
              )}

              {/* SPLIT PAYMENT (CASH + UPI) */}
              {waModal.paymentMethod === 'SPLIT' && (
                <div className="bg-blue-50 border border-blue-200 p-3 rounded-2xl space-y-2.5 text-xs">
                  <div className="flex items-center justify-between font-bold text-blue-950">
                    <span>Split Payment:</span>
                    <span className="font-mono">Total: ₹{waModal.data.grandTotal}</span>
                  </div>

                  <div>
                    <label className="block text-[11px] font-bold text-gray-700 mb-1">Cash Part (₹):</label>
                    <input
                      type="number"
                      value={splitCashAmt || ''}
                      onChange={(e) => setSplitCashAmt(Math.min(waModal.data.grandTotal, Math.max(0, Number(e.target.value) || 0)))}
                      className="w-full bg-white border border-blue-300 rounded-xl p-2 font-mono font-bold text-sm text-gray-900 focus:outline-none"
                    />
                  </div>

                  <div className="p-2 bg-white rounded-xl border border-blue-200 flex items-center justify-between font-mono font-bold">
                    <span className="text-gray-600">UPI Part:</span>
                    <span className="text-purple-700">₹{Math.max(0, waModal.data.grandTotal - splitCashAmt)}</span>
                  </div>
                </div>
              )}

              {/* Customer Mobile (Optional) */}
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Customer Mobile Number (Optional):</label>
                <input
                  type="tel"
                  placeholder="e.g. 9876543210 (for WhatsApp invoice)"
                  value={waPhone}
                  onChange={(e) => setWaPhone(e.target.value)}
                  className="w-full border-2 border-gray-200 rounded-xl p-2.5 font-mono font-bold text-gray-800 focus:border-gray-900 outline-none text-xs"
                />
              </div>

              {/* Action Buttons */}
              <div className="space-y-2 pt-1">
                <button
                  onClick={() => {
                    const payMode = waModal.paymentMethod === 'SPLIT' ? 'CASH' : waModal.paymentMethod!;
                    if (waPhone.replace(/\D/g, '').length >= 10) {
                      handleSendWa();
                    } else {
                      markPaid(waModal.data.tableNumber, waModal.data.groupOrders.map((o: any) => o.id), payMode);
                      setWaModal({ isOpen: false, data: null, paymentMethod: null });
                      setWaPhone('');
                    }
                  }}
                  className="w-full bg-emerald-600 hover:bg-emerald-700 text-white font-black py-2.5 rounded-xl transition shadow-md text-xs flex items-center justify-center gap-2"
                >
                  <CheckCircle2 size={15} /> Confirm Payment & Clear Table
                </button>

                <button
                  onClick={() => {
                    const { tableNumber, groupOrders, grandTotal } = waModal.data;
                    const subtotal = groupOrders.reduce((a: any, o: any) => a + Number(o.total_amount || 0), 0);
                    const gstAmt = Math.round(subtotal * 0.05);
                    const payMode = waModal.paymentMethod === 'SPLIT' ? 'CASH' : waModal.paymentMethod!;
                    printOfficialInvoice(tableNumber, groupOrders, subtotal, 0, gstAmt, 0, grandTotal, payMode);
                    markPaid(tableNumber, groupOrders.map((o: any) => o.id), payMode);
                    setWaModal({ isOpen: false, data: null, paymentMethod: null });
                    setWaPhone('');
                  }}
                  className="w-full bg-gray-900 hover:bg-black text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                >
                  <Printer size={14} /> Print 80mm GST Invoice & Clear Table
                </button>

                {waPhone.replace(/\D/g, '').length >= 10 && (
                  <button
                    onClick={handleSendWa}
                    className="w-full bg-[#25D366] hover:bg-[#1ebd5b] text-white font-bold py-2.5 rounded-xl transition text-xs flex items-center justify-center gap-2"
                  >
                    <Send size={14} /> Send WhatsApp Bill & Clear Table
                  </button>
                )}

                <button
                  onClick={() => { setWaModal({ isOpen: false, data: null, paymentMethod: null }); setWaPhone(''); }}
                  className="w-full text-gray-400 font-bold py-1 text-xs hover:text-gray-600 transition"
                >
                  Cancel (Keep Table)
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: MANAGER / OWNER SECURITY PIN (PETPOOJA STANDARD)       */}
      {/* ------------------------------------------------------------- */}
      {isAdminPinModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-[#1E1B16] text-white border border-[#3a3328] rounded-3xl w-full max-w-sm p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="text-center space-y-1">
              <div className="w-12 h-12 mx-auto rounded-2xl bg-gradient-to-br from-[#A18D6D] to-[#6F624E] flex items-center justify-center text-white shadow-md">
                <Lock size={22} />
              </div>
              <h3 className="font-playfair text-lg font-bold tracking-wide text-white pt-2">
                Manager / Owner Access
              </h3>
              <p className="text-xs text-gray-400">
                Enter 4-digit security PIN to unlock Admin Back-Office & Reports
              </p>
            </div>

            {/* PIN Display */}
            <div className="space-y-2">
              <div className="flex items-center justify-center gap-3">
                {[0, 1, 2, 3].map((idx) => {
                  const filled = adminPinInput.length > idx;
                  return (
                    <div
                      key={idx}
                      className={`w-11 h-12 rounded-xl border-2 flex items-center justify-center text-xl font-bold font-mono transition ${
                        filled 
                          ? 'border-[#A18D6D] bg-[#A18D6D]/20 text-[#e8d5b5]' 
                          : 'border-white/10 bg-white/5 text-transparent'
                      }`}
                    >
                      {filled ? '●' : '—'}
                    </div>
                  );
                })}
              </div>

              {adminPinError && (
                <p className="text-[11px] text-red-400 font-bold text-center animate-bounce">
                  {adminPinError}
                </p>
              )}
            </div>

            {/* Touch Screen Keypad (0-9, C, Backspace) */}
            <div className="grid grid-cols-3 gap-2">
              {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((num) => (
                <button
                  key={num}
                  type="button"
                  onClick={() => {
                    if (adminPinInput.length < 4) {
                      const next = adminPinInput + num;
                      setAdminPinInput(next);
                      setAdminPinError("");
                      if (next.length === 4) handleVerifyAdminPin(next);
                    }
                  }}
                  className="py-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl font-mono text-lg font-bold text-white transition"
                >
                  {num}
                </button>
              ))}
              <button
                type="button"
                onClick={() => { setAdminPinInput(""); setAdminPinError(""); }}
                className="py-3 bg-red-500/20 hover:bg-red-500/30 active:scale-95 text-red-300 rounded-xl text-xs font-black uppercase transition"
              >
                Clear
              </button>
              <button
                type="button"
                onClick={() => {
                  if (adminPinInput.length < 4) {
                    const next = adminPinInput + "0";
                    setAdminPinInput(next);
                    setAdminPinError("");
                    if (next.length === 4) handleVerifyAdminPin(next);
                  }
                }}
                className="py-3 bg-white/10 hover:bg-white/20 active:scale-95 rounded-xl font-mono text-lg font-bold text-white transition"
              >
                0
              </button>
              <button
                type="button"
                onClick={() => {
                  setAdminPinInput(prev => prev.slice(0, -1));
                  setAdminPinError("");
                }}
                className="py-3 bg-white/10 hover:bg-white/20 active:scale-95 text-gray-300 rounded-xl text-xs font-black transition flex items-center justify-center"
              >
                ⌫
              </button>
            </div>

            <div className="pt-1 space-y-2">
              <div className="text-[10px] text-gray-400 text-center">
                Default Master PIN: <span className="font-mono text-amber-300 font-bold">1234</span>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsAdminPinModalOpen(false);
                  setAdminPinInput("");
                  setAdminPinError("");
                }}
                className="w-full py-2 text-xs font-bold text-gray-400 hover:text-white transition"
              >
                Cancel / Return to POS
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ------------------------------------------------------------- */}
      {/* MODAL: START TAKEAWAY / SWIGGY / ZOMATO ORDER                  */}
      {/* ------------------------------------------------------------- */}
      {isDeliveryChannelModalOpen && (
        <div className="fixed inset-0 z-50 bg-black/75 backdrop-blur-xs flex items-center justify-center p-4">
          <div className="bg-white text-gray-900 rounded-3xl w-full max-w-md p-5 sm:p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-3 border-b">
              <div>
                <h3 className="text-base font-black text-gray-900 flex items-center gap-2">
                  <Bike className="text-gray-900" size={18} /> New Delivery / Parcel Docket
                </h3>
                <p className="text-xs text-gray-500">Select order channel & punch items for Kitchen</p>
              </div>
              <button
                onClick={() => setIsDeliveryChannelModalOpen(false)}
                className="p-1.5 hover:bg-gray-100 rounded-xl text-gray-400 hover:text-gray-700 transition"
              >
                <X size={18} />
              </button>
            </div>

            {/* 3 Channel Options */}
            <div className="grid grid-cols-3 gap-2.5">
              {/* Takeaway */}
              <button
                type="button"
                onClick={() => setSelectedChannel('TAKEAWAY')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  selectedChannel === 'TAKEAWAY'
                    ? 'border-amber-600 bg-amber-50 text-amber-950 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedChannel === 'TAKEAWAY' ? 'bg-amber-600 text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <ShoppingBag size={20} />
                </div>
                <div className="font-extrabold text-xs">Direct Parcel</div>
                <div className="text-[10px] text-gray-500">Takeaway</div>
              </button>

              {/* Swiggy */}
              <button
                type="button"
                onClick={() => setSelectedChannel('SWIGGY')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  selectedChannel === 'SWIGGY'
                    ? 'border-[#FC8019] bg-orange-50 text-orange-950 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedChannel === 'SWIGGY' ? 'bg-[#FC8019] text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <Bike size={20} />
                </div>
                <div className="font-extrabold text-xs text-[#FC8019]">Swiggy</div>
                <div className="text-[10px] text-gray-500">Online Order</div>
              </button>

              {/* Zomato */}
              <button
                type="button"
                onClick={() => setSelectedChannel('ZOMATO')}
                className={`p-3 rounded-2xl border-2 text-center transition flex flex-col items-center justify-center gap-1.5 ${
                  selectedChannel === 'ZOMATO'
                    ? 'border-[#E23744] bg-red-50 text-red-950 shadow-sm'
                    : 'border-gray-200 hover:border-gray-300 text-gray-600 bg-gray-50/50'
                }`}
              >
                <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${selectedChannel === 'ZOMATO' ? 'bg-[#E23744] text-white' : 'bg-gray-200 text-gray-600'}`}>
                  <Utensils size={20} />
                </div>
                <div className="font-extrabold text-xs text-[#E23744]">Zomato</div>
                <div className="text-[10px] text-gray-500">Online Order</div>
              </button>
            </div>

            {/* Inputs */}
            <div className="space-y-3 pt-1">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {selectedChannel === 'SWIGGY' ? 'Swiggy Order ID / Token #' : selectedChannel === 'ZOMATO' ? 'Zomato Order ID / Token #' : 'Token / Customer Token #'}:
                </label>
                <input
                  type="text"
                  placeholder={selectedChannel === 'SWIGGY' ? 'e.g. 4821 (from Swiggy device)' : selectedChannel === 'ZOMATO' ? 'e.g. 9102 (from Zomato device)' : 'Optional Token # or Name'}
                  value={onlineOrderId}
                  onChange={(e) => setOnlineOrderId(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl p-2.5 text-xs font-bold font-mono outline-none"
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">
                  {selectedChannel === 'TAKEAWAY' ? 'Customer Name / Phone (Optional)' : 'Rider / Delivery Partner Name (Optional)'}:
                </label>
                <input
                  type="text"
                  placeholder="e.g. Rider Manoj / 9876543210"
                  value={deliveryRiderName}
                  onChange={(e) => setDeliveryRiderName(e.target.value)}
                  className="w-full border-2 border-gray-200 focus:border-gray-900 rounded-xl p-2.5 text-xs font-medium outline-none"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="space-y-2 pt-2">
              <button
                type="button"
                onClick={() => handleStartDeliveryOrder()}
                className={`w-full py-3 text-white font-black text-xs uppercase rounded-xl transition shadow-md flex items-center justify-center gap-2 ${
                  selectedChannel === 'SWIGGY'
                    ? 'bg-[#FC8019] hover:bg-[#e06f14]'
                    : selectedChannel === 'ZOMATO'
                    ? 'bg-[#E23744] hover:bg-[#c92b37]'
                    : 'bg-amber-600 hover:bg-amber-700'
                }`}
              >
                <Check size={16} />
                <span>Start Punching {selectedChannel === 'SWIGGY' ? 'Swiggy' : selectedChannel === 'ZOMATO' ? 'Zomato' : 'Takeaway'}</span>
              </button>

              <button
                type="button"
                onClick={() => setIsDeliveryChannelModalOpen(false)}
                className="w-full py-1 text-xs font-bold text-gray-400 hover:text-gray-600 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
