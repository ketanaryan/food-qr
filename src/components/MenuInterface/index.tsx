"use client"

import React, { useState, useMemo, useEffect, useRef } from "react"
import Image from "next/image"
import NavBar from "../common/NavBar"
import Footer from "../common/Footer"
import { ReactLenis } from "lenis/react"
import MenuSection from "./MenuSection"
import ItemNotch from "./ItemNotch"
import Link from "next/link"
import toast from "react-hot-toast"
import { 
  Bell, 
  ScrollText, 
  Search, 
  X, 
  UtensilsCrossed, 
  Sparkles, 
  ChevronRight,
  Filter
} from "lucide-react"
import { supabase } from "@/lib/supabase"
import { IMenu } from "@/types/menu"
import { motion, AnimatePresence } from "framer-motion"

function MerchantPage({ merchantId, token, isPosMode = false }: { merchantId: string, token?: string, isPosMode?: boolean }) {
  const [menu, setMenu] = useState<IMenu[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("ALL");
  const [vegFilter, setVegFilter] = useState<"ALL" | "VEG" | "NON_VEG">("ALL");
  const [isCategoryModalOpen, setIsCategoryModalOpen] = useState(false);
  const menuContainerRef = useRef<HTMLDivElement>(null);
  const tabsScrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const fetchMenu = async () => {
      const { data, error } = await supabase.from('menu').select('*').eq('is_available', true);
      if (data) {
        const formattedMenu: IMenu[] = data.map(item => {
          const lowerName = (item.name || '').toLowerCase();
          const lowerSection = (item.section || '').toLowerCase();
          const isExplicitVeg = 
            lowerName.includes("steam rice") ||
            lowerName.includes("jeera rice") ||
            lowerName.includes("curd rice") ||
            lowerSection.includes("veg special") ||
            lowerSection.includes("paneer") ||
            lowerSection.includes("vegetarian guests") ||
            lowerSection.includes("roti") ||
            lowerSection.includes("ice cream") ||
            lowerSection.includes("sath") ||
            lowerSection.includes("basmati") ||
            lowerSection.includes("chinese rice & noodles");

          const isNonVeg = 
            !isExplicitVeg && (
              lowerName.includes("chicken") ||
              lowerName.includes("mutton") ||
              lowerName.includes("egg") ||
              lowerName.includes("fish") ||
              lowerName.includes("prawn") ||
              lowerName.includes("murg") ||
              lowerName.includes("pomfret") ||
              lowerName.includes("surmai") ||
              lowerName.includes("bangda") ||
              lowerName.includes("bombil") ||
              lowerName.includes("tangdi") ||
              lowerName.includes("non veg") ||
              lowerSection.includes("non veg") ||
              lowerSection.includes("meat lovers") ||
              lowerSection.includes("gavathi") ||
              lowerSection.includes("sea") ||
              lowerSection.includes("chicken") ||
              lowerSection.includes("soup")
            );
          const isVeg = !isNonVeg;

          return {
            _id: item.id,
            merchantId: merchantId,
            title: item.name,
            description: item.description || '',
            price: item.price,
            quantity: 0,
            originalPrice: item.original_price,
            image: item.image_url || '/menu/default-food.jpg',
            section: item.section || 'Main Course',
            isVeg: isVeg,
            createdAt: new Date(),
            updatedAt: new Date()
          } as unknown as IMenu;
        });
        setMenu(formattedMenu);
      }
      setLoading(false);
    };
    fetchMenu();
  }, [merchantId]);

  const handleCallWaiter = async () => {
    toast.success("Waiter has been notified! They will be at your table shortly.");
    const channel = supabase.channel('cashier-alerts');
    channel.subscribe((status) => {
      if (status === 'SUBSCRIBED') {
        channel.send({
          type: 'broadcast',
          event: 'waiter_called',
          payload: { table: merchantId },
        });
      }
    });
    setTimeout(() => {
      supabase.removeChannel(channel);
    }, 2000);
  };

  // Total veg and non-veg counts across all menu items
  const vegCount = useMemo(() => menu.filter(i => i.isVeg === true).length, [menu]);
  const nonVegCount = useMemo(() => menu.filter(i => i.isVeg === false).length, [menu]);

  // Items matching current veg / non-veg diet filter
  const dietFilteredMenu = useMemo(() => {
    return menu.filter(item => {
      if (vegFilter === "VEG") return item.isVeg === true;
      if (vegFilter === "NON_VEG") return item.isVeg === false;
      return true;
    });
  }, [menu, vegFilter]);

  // Distinct sections that actually exist under current diet filter (strictly no non-veg when Veg is active!)
  const sectionsList = useMemo(() => {
    const list: string[] = [];
    dietFilteredMenu.forEach(item => {
      if (item.section && !list.includes(item.section)) {
        if (vegFilter === "VEG" && (
          item.section.toLowerCase().includes("non veg") ||
          item.section.toLowerCase().includes("chicken") ||
          item.section.toLowerCase().includes("mutton") ||
          item.section.toLowerCase().includes("fish") ||
          item.section.toLowerCase().includes("sea")
        )) {
          return;
        }
        list.push(item.section);
      }
    });
    return list;
  }, [dietFilteredMenu, vegFilter]);

  // Section item counts for current diet
  const categoryCounts = useMemo(() => {
    const counts: { [sec: string]: number } = {};
    dietFilteredMenu.forEach(item => {
      counts[item.section] = (counts[item.section] || 0) + 1;
    });
    return counts;
  }, [dietFilteredMenu]);

  // Auto-reset category if currently selected category has no items in the active diet filter
  useEffect(() => {
    if (selectedCategory !== "ALL" && !sectionsList.includes(selectedCategory)) {
      setSelectedCategory("ALL");
    }
  }, [sectionsList, selectedCategory]);

  const handleSetVegFilter = (filter: "ALL" | "VEG" | "NON_VEG") => {
    setVegFilter(filter);
    setSelectedCategory("ALL");
  };

  // Filtered menu
  const filteredMenu = useMemo(() => {
    return menu.filter(item => {
      // 1. Veg filter
      if (vegFilter === "VEG") {
        if (item.isVeg === false) return false;
        const secLower = (item.section || '').toLowerCase();
        if (
          secLower.includes('non veg') ||
          secLower.includes('chicken') ||
          secLower.includes('mutton') ||
          secLower.includes('fish') ||
          secLower.includes('sea') ||
          secLower.includes('meat')
        ) {
          return false;
        }
      }
      if (vegFilter === "NON_VEG") {
        if (item.isVeg !== false) return false;
      }

      // 2. Category filter
      if (selectedCategory !== "ALL" && item.section !== selectedCategory) return false;

      // 3. Search query
      if (searchQuery.trim()) {
        const q = searchQuery.toLowerCase().trim();
        const matchesTitle = item.title.toLowerCase().includes(q);
        const matchesDesc = (item.description || '').toLowerCase().includes(q);
        const matchesSection = (item.section || '').toLowerCase().includes(q);
        if (!matchesTitle && !matchesDesc && !matchesSection) return false;
      }

      return true;
    });
  }, [menu, selectedCategory, vegFilter, searchQuery]);

  // Group filtered menu by section
  const groupedMenuItems = useMemo(() => {
    const map = new Map<string, IMenu[]>();
    for (const item of filteredMenu) {
      if (!map.has(item.section)) {
        map.set(item.section, []);
      }
      map.get(item.section)!.push(item);
    }
    return map;
  }, [filteredMenu]);

  const scrollToMenu = () => {
    if (menuContainerRef.current) {
      const topOffset = menuContainerRef.current.getBoundingClientRect().top + window.scrollY - (isPosMode ? 10 : 85);
      window.scrollTo({ top: topOffset, behavior: 'smooth' });
    }
  };

  const handleSelectCategory = (sec: string) => {
    setSelectedCategory(sec);
    setIsCategoryModalOpen(false);
    scrollToMenu();
  };

  const handleClearFilters = () => {
    setSearchQuery("");
    setSelectedCategory("ALL");
    setVegFilter("ALL");
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F8F5F0] flex flex-col items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#A18D6D]"></div>
        <p className="mt-4 text-[#A18D6D] font-bold tracking-wider">Loading Authentic Menu...</p>
      </div>
    );
  }

  const isFilterActive = searchQuery.trim() !== "" || selectedCategory !== "ALL" || vegFilter !== "ALL";

  return (
    <>
      <ReactLenis root>
        <div className="min-h-screen bg-[#F8F5F0]">
          {!isPosMode && <NavBar />}

          {/* PREMIUM HERO */}
          <div className="relative min-h-[50vh] sm:min-h-[70vh] flex items-end justify-center pb-20 overflow-hidden">
            <div className="absolute inset-0 z-0">
              <Image
                src="/hotel-white-bliss.jpg"
                alt="Hotel White Bliss"
                fill
                priority
                className="object-cover scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-black/20" />
            </div>

            {/* Quick Actions Header */}
            <div className="absolute top-24 left-4 right-4 sm:left-8 sm:right-8 z-20 flex justify-between items-center">
              {!isPosMode ? (
                <button 
                  onClick={handleCallWaiter}
                  className="flex items-center gap-2 bg-black/50 backdrop-blur-md border border-white/20 text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold hover:bg-white/20 transition-all active:scale-95 shadow-md"
                >
                  <Bell size={15} className="text-yellow-400 animate-pulse" /> Call Waiter
                </button>
              ) : (
                <div />
              )}
              
              {!isPosMode && (
                <Link 
                  href={token ? `/table/${merchantId}/orders?token=${token}` : `/table/${merchantId}/orders`}
                  className="flex items-center gap-2 bg-[#A18D6D] text-white px-4 sm:px-5 py-2 sm:py-2.5 rounded-full text-xs sm:text-sm font-semibold shadow-lg hover:bg-[#8b795d] transition-all active:scale-95"
                >
                  <ScrollText size={15} /> My Orders
                </Link>
              )}
            </div>

            {/* Hero Title & Quick Search Pill */}
            <div className="relative z-10 w-full px-4 sm:px-8 max-w-3xl flex flex-col items-center text-center">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-xs uppercase tracking-widest text-[#A18D6D] bg-black/60 backdrop-blur-md px-3 py-1 rounded-full border border-[#A18D6D]/30 font-medium">
                  Hotel White Bliss
                </span>
                <span className="text-xs font-bold text-amber-200 bg-amber-950/70 backdrop-blur-md px-3 py-1 rounded-full border border-amber-400/40 flex items-center gap-1 shadow-xs">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Table #{merchantId}
                </span>
              </div>
              <h1 className="text-3xl sm:text-5xl font-playfair font-bold text-white tracking-wide drop-shadow-md">
                Culinary Experience
              </h1>
              <p className="mt-2 text-xs sm:text-sm text-gray-200 font-light max-w-md drop-shadow-sm">
                Explore authentic vegetarian specialties, tandoori starters, aromatic biryanis & rich paneer curries.
              </p>
            </div>
          </div>

          {/* MENU WRAPPER */}
          <div 
            id="menu-container" 
            ref={menuContainerRef}
            className="relative -top-10 rounded-t-[36px] bg-[#F8F5F0] pt-6 min-h-screen border-t border-[#e8e1d6]"
          >
            {/* STICKY SEARCH & CATEGORY BAR */}
            <div className={`sticky ${isPosMode ? 'top-0' : 'top-20'} z-30 bg-[#F8F5F0]/95 backdrop-blur-md border-b border-[#e8e1d6] shadow-xs px-4 sm:px-8 py-3 space-y-3 transition-all`}>
              
              {/* Row 1: Search Input & Veg/Non-Veg Filter Buttons */}
              <div className="flex flex-col sm:flex-row items-stretch sm:items-center gap-2 sm:gap-3">
                {/* Search Box */}
                <div className="relative flex-1">
                  <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-[#A18D6D] w-4 h-4 pointer-events-none" />
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search dishes... (e.g. Paneer, Roti, Chicken, Biryani)"
                    className="w-full bg-white pl-10 pr-10 py-2.5 rounded-full border border-[#e8e1d6] text-xs sm:text-sm text-[#1E1B16] placeholder:text-[#a39784] focus:outline-none focus:ring-2 focus:ring-[#A18D6D]/40 focus:border-[#A18D6D] transition-all shadow-xs"
                  />
                  {searchQuery && (
                    <button
                      onClick={() => setSearchQuery("")}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-700 p-1"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>

                {/* Row 1: Veg / Non-Veg Quick Pills */}
                <div className="flex items-center gap-1.5 shrink-0 justify-between sm:justify-start">
                  <button
                    onClick={() => handleSetVegFilter("ALL")}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all border ${
                      vegFilter === "ALL" 
                        ? 'bg-[#1E1B16] text-white border-[#1E1B16] shadow-xs' 
                        : 'bg-white text-[#6F624E] border-[#e8e1d6] hover:bg-gray-50'
                    }`}
                  >
                    All Food ({menu.length})
                  </button>

                  <button
                    onClick={() => handleSetVegFilter(vegFilter === "VEG" ? "ALL" : "VEG")}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                      vegFilter === "VEG" 
                        ? 'bg-emerald-700 text-white border-emerald-700 shadow-xs ring-2 ring-emerald-300' 
                        : 'bg-white text-emerald-800 border-emerald-200 hover:bg-emerald-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
                    <span>Veg ({vegCount})</span>
                  </button>

                  <button
                    onClick={() => handleSetVegFilter(vegFilter === "NON_VEG" ? "ALL" : "NON_VEG")}
                    className={`px-3.5 py-2 rounded-full text-xs font-semibold tracking-wider transition-all flex items-center gap-1.5 border ${
                      vegFilter === "NON_VEG" 
                        ? 'bg-red-700 text-white border-red-700 shadow-xs ring-2 ring-red-300' 
                        : 'bg-white text-red-800 border-red-200 hover:bg-red-50'
                    }`}
                  >
                    <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />
                    <span>Non-Veg ({nonVegCount})</span>
                  </button>
                </div>
              </div>

              {/* Row 2: Horizontally Scrollable Category Pills (Diet-filtered!) */}
              <div 
                ref={tabsScrollRef}
                className="flex items-center gap-2 overflow-x-auto pb-1 pt-0.5 no-scrollbar scroll-smooth"
                style={{ scrollbarWidth: 'none', msOverflowStyle: 'none' }}
              >
                {/* View All Sections Pill */}
                <button
                  onClick={() => handleSelectCategory("ALL")}
                  className={`shrink-0 px-4 py-1.5 rounded-full text-xs font-bold whitespace-nowrap transition-all border ${
                    selectedCategory === "ALL"
                      ? 'bg-[#A18D6D] text-white border-[#A18D6D] shadow-sm'
                      : 'bg-white text-[#1E1B16] border-[#e8e1d6] hover:border-[#A18D6D]'
                  }`}
                >
                  {vegFilter === "VEG" 
                    ? `View All Veg (${vegCount})` 
                    : vegFilter === "NON_VEG" 
                    ? `View All Non-Veg (${nonVegCount})` 
                    : `View All Sections (${sectionsList.length})`}
                </button>

                {sectionsList.map((sec) => {
                  const count = categoryCounts[sec] || 0;
                  const isSelected = selectedCategory === sec;
                  return (
                    <button
                      key={sec}
                      onClick={() => handleSelectCategory(sec)}
                      className={`shrink-0 px-3.5 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition-all flex items-center gap-1.5 border ${
                        isSelected
                          ? 'bg-[#1E1B16] text-white border-[#1E1B16] shadow-sm font-semibold'
                          : 'bg-white text-[#6F624E] border-[#e8e1d6] hover:bg-white hover:border-[#A18D6D]/60'
                      }`}
                    >
                      <span>{sec}</span>
                      <span className={`text-[10px] px-1.5 py-0.2 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-[#F2ECE1] text-[#8b795d]'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* Active Filter Summary Bar */}
              {isFilterActive && (
                <div className="flex items-center justify-between gap-2 pt-1 pb-0.5 text-xs text-[#6F624E] border-t border-[#e8e1d6]/60">
                  <div className="flex items-center gap-1.5 truncate">
                    <Filter size={13} className="text-[#A18D6D] shrink-0" />
                    <span className="truncate">
                      Showing <strong>{filteredMenu.length}</strong> {vegFilter === "VEG" ? "Veg" : vegFilter === "NON_VEG" ? "Non-Veg" : ""} items
                      {selectedCategory !== "ALL" && <span> in <strong>{selectedCategory}</strong></span>}
                      {searchQuery && <span> matching &ldquo;{searchQuery}&rdquo;</span>}
                    </span>
                  </div>
                  <button
                    onClick={handleClearFilters}
                    className="shrink-0 text-xs font-bold text-[#A18D6D] hover:text-[#1E1B16] underline underline-offset-2 ml-2"
                  >
                    Reset
                  </button>
                </div>
              )}
            </div>

            {/* MENU ITEMS CONTENT */}
            <div className="px-4 sm:px-8 py-4">
              {groupedMenuItems.size === 0 ? (
                /* No Results Empty State */
                <div className="my-16 py-12 px-4 rounded-3xl bg-white border border-[#e8e1d6] max-w-lg mx-auto text-center space-y-4 shadow-sm">
                  <div className="w-16 h-16 mx-auto rounded-full bg-[#F8F5F0] flex items-center justify-center text-3xl">
                    🔍
                  </div>
                  <h3 className="text-xl font-playfair font-bold text-[#1E1B16]">
                    No Dishes Found
                  </h3>
                  <p className="text-sm text-[#6F624E] max-w-xs mx-auto">
                    {vegFilter === "VEG" 
                      ? "We couldn't find any vegetarian dishes matching your search. Try searching for \"Paneer\", \"Dal\", or \"Roti\"."
                      : vegFilter === "NON_VEG"
                      ? "We couldn't find any non-veg dishes matching your search. Try searching for \"Chicken\", \"Mutton\", or \"Biryani\"."
                      : "We couldn't find any items matching your current filters. Try searching for \"Paneer\", \"Roti\", or \"Biryani\"."
                    }
                  </p>
                  <button
                    onClick={handleClearFilters}
                    className="mt-2 inline-flex items-center gap-2 px-6 py-2.5 rounded-full bg-[#A18D6D] text-white text-xs font-bold hover:bg-[#8b795d] transition-colors shadow-md"
                  >
                    <X size={14} /> Clear All Filters
                  </button>
                </div>
              ) : (
                /* Render Menu Sections */
                Array.from(groupedMenuItems.entries()).map(([section, items]) => (
                  <MenuSection
                    key={section}
                    section={section}
                    items={items}
                  />
                ))
              )}
            </div>

            <Footer />
          </div>
        </div>
      </ReactLenis>

      {/* FLOATING QUICK "CATEGORIES" BUTTON */}
      <button
        onClick={() => setIsCategoryModalOpen(true)}
        className="fixed bottom-24 right-4 sm:bottom-8 sm:right-8 z-40 flex items-center gap-2 bg-[#1E1B16] text-[#F8F5F0] px-4 py-2.5 rounded-full shadow-2xl border border-white/20 text-xs sm:text-sm font-semibold hover:bg-black transition-all active:scale-95 group"
      >
        <UtensilsCrossed size={15} className="text-[#A18D6D] group-hover:rotate-12 transition-transform" />
        <span>Menu ({sectionsList.length})</span>
      </button>

      {/* CATEGORY DRAWER / MODAL */}
      <AnimatePresence>
        {isCategoryModalOpen && (
          <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center">
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsCategoryModalOpen(false)}
              className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            />

            {/* Modal Sheet */}
            <motion.div
              initial={{ y: "100%", opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: "100%", opacity: 0 }}
              transition={{ type: "spring", damping: 25, stiffness: 300 }}
              className="relative w-full sm:max-w-md bg-white rounded-t-[32px] sm:rounded-3xl p-6 shadow-2xl z-10 max-h-[80vh] flex flex-col"
            >
              {/* Header */}
              <div className="flex items-center justify-between pb-4 border-b border-gray-100">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-full bg-[#A18D6D]/15 flex items-center justify-center text-[#A18D6D]">
                    <UtensilsCrossed size={16} />
                  </div>
                  <div>
                    <h3 className="text-base font-playfair font-bold text-[#1E1B16]">
                      {vegFilter === "VEG" ? "Vegetarian Categories" : vegFilter === "NON_VEG" ? "Non-Veg Categories" : "Menu Categories"}
                    </h3>
                    <p className="text-[11px] text-gray-500">
                      {sectionsList.length} sections &bull; {dietFilteredMenu.length} dishes
                    </p>
                  </div>
                </div>

                <button
                  onClick={() => setIsCategoryModalOpen(false)}
                  className="p-1.5 rounded-full hover:bg-gray-100 text-gray-500"
                >
                  <X size={18} />
                </button>
              </div>

              {/* Category List */}
              <div className="overflow-y-auto py-3 space-y-1.5 flex-1 divide-y divide-gray-50">
                {/* View All Option */}
                <button
                  onClick={() => handleSelectCategory("ALL")}
                  className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                    selectedCategory === "ALL" 
                      ? 'bg-[#1E1B16] text-white font-bold' 
                      : 'hover:bg-[#FAF7F2] text-[#1E1B16]'
                  }`}
                >
                  <span className="text-sm font-semibold">
                    ✨ View All {vegFilter === "VEG" ? "Veg Dishes" : vegFilter === "NON_VEG" ? "Non-Veg Dishes" : "Dishes"}
                  </span>
                  <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                    selectedCategory === "ALL" ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {dietFilteredMenu.length}
                  </span>
                </button>

                {sectionsList.map((sec) => {
                  const count = categoryCounts[sec] || 0;
                  const isSelected = selectedCategory === sec;
                  return (
                    <button
                      key={sec}
                      onClick={() => handleSelectCategory(sec)}
                      className={`w-full text-left p-3 rounded-2xl flex items-center justify-between transition-colors ${
                        isSelected 
                          ? 'bg-[#1E1B16] text-white font-bold' 
                          : 'hover:bg-[#FAF7F2] text-[#1E1B16]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <ChevronRight size={14} className={isSelected ? 'text-[#A18D6D]' : 'text-gray-400'} />
                        <span className="text-xs sm:text-sm font-medium">{sec}</span>
                      </div>
                      <span className={`text-xs px-2.5 py-0.5 rounded-full font-mono ${
                        isSelected ? 'bg-white/20 text-white' : 'bg-gray-100 text-gray-600'
                      }`}>
                        {count}
                      </span>
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      <ItemNotch merchantId={merchantId} isPosMode={isPosMode} />
    </>
  );
}

export default MerchantPage;
