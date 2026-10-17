"use client";

import React, { useState, useEffect } from "react";
import { QRCode } from "react-qrcode-logo";
import { 
  Printer, Copy, ExternalLink, Download, RefreshCw, QrCode as QrIcon, 
  Check, Layers, Plus, Trash2, Save, Sparkles, Building, Hash, 
  AlertCircle, LayoutGrid, ArrowRight, ShieldCheck, CheckCircle2 
} from "lucide-react";
import toast from "react-hot-toast";
import { TableSection, DEFAULT_TABLE_SECTIONS, extractAllTableNumbers } from "@/lib/tableConfig";

export default function TablesAndFloorsPage() {
  const [activeTab, setActiveTab] = useState<"floors" | "print">("floors");
  const [sections, setSections] = useState<TableSection[]>(DEFAULT_TABLE_SECTIONS);
  const [tables, setTables] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [copiedTable, setCopiedTable] = useState<string | null>(null);
  const [printFilterSection, setPrintFilterSection] = useState<string>("ALL");

  // New Floor Form state
  const [newFloorName, setNewFloorName] = useState("");
  const [isAddingFloor, setIsAddingFloor] = useState(false);

  // Table add inputs per section: { [sectionId]: { single: string, rangeFrom: string, rangeTo: string, mode: 'single' | 'range' } }
  const [tableInputs, setTableInputs] = useState<{ [secId: string]: { single: string; rangeFrom: string; rangeTo: string } }>({});

  useEffect(() => {
    fetchTablesAndConfig();
  }, []);

  const fetchTablesAndConfig = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/admin/tables");
      const data = await res.json();
      if (data.success) {
        if (Array.isArray(data.sections) && data.sections.length > 0) {
          setSections(data.sections);
        }
        if (Array.isArray(data.tables)) {
          setTables(data.tables);
        }
      }
    } catch (error) {
      console.error(error);
      toast.error("Failed to load tables configuration");
    } finally {
      setLoading(false);
    }
  };

  // Save updated sections to server
  const handleSaveFloorPlan = async () => {
    // Validate
    if (sections.length === 0) {
      toast.error("At least one floor section is required.");
      return;
    }
    const all = extractAllTableNumbers(sections);
    if (all.length === 0) {
      toast.error("Please add at least one table to your restaurant floors.");
      return;
    }

    setSaving(true);
    try {
      const res = await fetch("/api/admin/tables", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ sections })
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Floor & Table plan saved successfully!", { icon: "✅" });
        await fetchTablesAndConfig();
      } else {
        toast.error(data.message || "Failed to save floor layout");
      }
    } catch {
      toast.error("Network error while saving table layout");
    } finally {
      setSaving(false);
    }
  };

  // Add a new section / floor
  const handleAddFloor = () => {
    const trimmed = newFloorName.trim();
    if (!trimmed) {
      toast.error("Please enter a floor/section name.");
      return;
    }
    const id = trimmed.toUpperCase().replace(/[^A-Z0-9]/g, "_") + "_" + Date.now().toString().slice(-4);
    const updated: TableSection[] = [...sections, { id, name: trimmed, tables: [] }];
    setSections(updated);
    setNewFloorName("");
    setIsAddingFloor(false);
    toast.success(`Floor "${trimmed}" added! Now add tables to it.`, { icon: "🏢" });
  };

  // Delete a floor
  const handleDeleteFloor = (id: string, name: string) => {
    if (sections.length <= 1) {
      toast.error("You must have at least one active floor.");
      return;
    }
    if (confirm(`Are you sure you want to delete floor "${name}" and its table assignments?`)) {
      setSections(sections.filter(s => s.id !== id));
      toast.success(`Removed floor "${name}". Click 'Save Layout' to persist.`);
    }
  };

  // Rename a floor
  const handleRenameFloor = (id: string, currentName: string) => {
    const newName = prompt("Enter new name for this floor/section:", currentName);
    if (newName && newName.trim() && newName.trim() !== currentName) {
      setSections(sections.map(s => s.id === id ? { ...s, name: newName.trim() } : s));
    }
  };

  // Remove a table from a section
  const handleRemoveTable = (secId: string, tableNum: string) => {
    setSections(sections.map(s => {
      if (s.id === secId) {
        return { ...s, tables: s.tables.filter(t => t !== tableNum) };
      }
      return s;
    }));
  };

  // Add single table to section
  const handleAddSingleTable = (secId: string) => {
    const val = (tableInputs[secId]?.single || "").trim();
    if (!val) return;

    // Check if table already exists in ANY section
    const all = extractAllTableNumbers(sections);
    if (all.includes(val)) {
      toast.error(`Table "${val}" already exists! Table numbers must be unique.`);
      return;
    }

    setSections(sections.map(s => {
      if (s.id === secId) {
        const next = [...s.tables, val].sort((a, b) => {
          const nA = parseInt(a, 10);
          const nB = parseInt(b, 10);
          if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
          return a.localeCompare(b);
        });
        return { ...s, tables: next };
      }
      return s;
    }));

    setTableInputs({
      ...tableInputs,
      [secId]: { ...tableInputs[secId], single: "" }
    });
    toast.success(`Table ${val} added to floor!`);
  };

  // Add table range to section (e.g. 16 to 25)
  const handleAddRangeTables = (secId: string) => {
    const fromStr = (tableInputs[secId]?.rangeFrom || "").trim();
    const toStr = (tableInputs[secId]?.rangeTo || "").trim();

    const from = parseInt(fromStr, 10);
    const to = parseInt(toStr, 10);

    if (isNaN(from) || isNaN(to) || from > to) {
      toast.error("Please enter a valid range (e.g. From: 16, To: 25)");
      return;
    }

    if (to - from > 50) {
      toast.error("Maximum 50 tables can be added at once.");
      return;
    }

    const all = new Set(extractAllTableNumbers(sections));
    const toAdd: string[] = [];
    const duplicates: string[] = [];

    for (let i = from; i <= to; i++) {
      const numStr = String(i);
      if (all.has(numStr)) {
        duplicates.push(numStr);
      } else {
        toAdd.push(numStr);
        all.add(numStr);
      }
    }

    if (toAdd.length === 0) {
      toast.error(`All tables from ${from} to ${to} already exist.`);
      return;
    }

    setSections(sections.map(s => {
      if (s.id === secId) {
        const next = [...s.tables, ...toAdd].sort((a, b) => {
          const nA = parseInt(a, 10);
          const nB = parseInt(b, 10);
          if (!isNaN(nA) && !isNaN(nB)) return nA - nB;
          return a.localeCompare(b);
        });
        return { ...s, tables: next };
      }
      return s;
    }));

    setTableInputs({
      ...tableInputs,
      [secId]: { ...tableInputs[secId], rangeFrom: "", rangeTo: "" }
    });

    let msg = `Added ${toAdd.length} tables (${toAdd[0]} - ${toAdd[toAdd.length - 1]})!`;
    if (duplicates.length > 0) {
      msg += ` (${duplicates.length} skipped as already existing)`;
    }
    toast.success(msg, { icon: "✨" });
  };

  // Apply quick presets
  const handleApplyPreset = (presetType: "15_DEFAULT" | "25_EXPANDED" | "40_LARGE") => {
    if (!confirm("This will replace current floor configuration with the preset layout. Continue?")) return;

    if (presetType === "15_DEFAULT") {
      setSections([
        { id: "GROUND", name: "Ground Floor", tables: ["1", "2", "3", "4", "5"] },
        { id: "AC_HALL", name: "AC Family Hall", tables: ["6", "7", "8", "9", "10"] },
        { id: "GARDEN", name: "Garden / Terrace", tables: ["11", "12", "13", "14", "15"] }
      ]);
    } else if (presetType === "25_EXPANDED") {
      setSections([
        { id: "GROUND", name: "Ground Floor", tables: ["1", "2", "3", "4", "5", "6", "7", "8", "9", "10"] },
        { id: "AC_HALL", name: "AC Family Hall", tables: ["11", "12", "13", "14", "15", "16", "17", "18", "19", "20"] },
        { id: "GARDEN", name: "Garden / Terrace", tables: ["21", "22", "23", "24", "25"] }
      ]);
    } else if (presetType === "40_LARGE") {
      setSections([
        { id: "GROUND", name: "Ground Floor", tables: Array.from({ length: 15 }, (_, i) => String(i + 1)) },
        { id: "FIRST_FLOOR", name: "First Floor Banquet", tables: Array.from({ length: 15 }, (_, i) => String(i + 16)) },
        { id: "ROOFTOP", name: "Rooftop Open Lounge", tables: Array.from({ length: 10 }, (_, i) => String(i + 31)) }
      ]);
    }
    toast.success("Preset applied! Click 'Save Floor Plan' to make it live.", { icon: "⚡" });
  };

  const copyLink = (url: string, tableNum: string) => {
    navigator.clipboard.writeText(url);
    setCopiedTable(tableNum);
    toast.success(`Table #${tableNum} QR link copied!`, { icon: "📋" });
    setTimeout(() => setCopiedTable(null), 2000);
  };

  const downloadQR = (tableNum: string) => {
    const canvas = document.getElementById(`qr-canvas-${tableNum}`) as HTMLCanvasElement;
    if (!canvas) {
      toast.error("Could not generate QR download");
      return;
    }
    const link = document.createElement("a");
    link.download = `Hotel-Marquis-Table-${tableNum}-QR.png`;
    link.href = canvas.toDataURL("image/png");
    link.click();
    toast.success(`Table #${tableNum} QR image saved!`, { icon: "💾" });
  };

  // Derived counts
  const allConfiguredTables = extractAllTableNumbers(sections);
  const totalTablesCount = allConfiguredTables.length;

  // Filtered tables for standee printing
  const printTables = tables.filter(t => {
    if (printFilterSection === "ALL") return true;
    const currentSec = sections.find(s => s.id === printFilterSection);
    return currentSec?.tables.includes(String(t.table));
  });

  return (
    <div className="min-h-screen bg-[#FDFBF7] p-4 sm:p-6 lg:p-8">
      {/* Header Controls (Hidden on Print) */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center mb-6 print:hidden gap-4 pb-6 border-b border-[#e8dfd3]">
        <div>
          <div className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-widest text-[#A18D6D] mb-1">
            <Building size={14} /> Restaurant Layout & QR Studio
          </div>
          <h1 className="text-2xl sm:text-3xl font-bold font-playfair text-[#1E1B16]">
            Floors, Tables & QR Standees
          </h1>
          <p className="text-xs sm:text-sm text-[#6F624E] mt-0.5">
            Manage your restaurant floors, add unlimited tables, and print luxury QR tent cards.
          </p>
        </div>

        {/* Tab Switcher & Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5 w-full md:w-auto">
          <div className="bg-white p-1 rounded-2xl border border-[#e8dfd3] shadow-xs flex items-center">
            <button
              onClick={() => setActiveTab("floors")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "floors"
                  ? "bg-[#1E1B16] text-[#F8F5F0] shadow-xs"
                  : "text-[#6F624E] hover:text-[#1E1B16]"
              }`}
            >
              <LayoutGrid size={14} />
              <span>Floor & Table Setup</span>
              <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] bg-[#A18D6D]/20 text-[#A18D6D]">
                {totalTablesCount}
              </span>
            </button>

            <button
              onClick={() => setActiveTab("print")}
              className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-1.5 ${
                activeTab === "print"
                  ? "bg-[#1E1B16] text-[#F8F5F0] shadow-xs"
                  : "text-[#6F624E] hover:text-[#1E1B16]"
              }`}
            >
              <QrIcon size={14} />
              <span>Print Standees</span>
            </button>
          </div>

          {activeTab === "floors" ? (
            <button
              onClick={handleSaveFloorPlan}
              disabled={saving}
              className="inline-flex items-center gap-2 bg-gradient-to-r from-emerald-600 to-teal-700 hover:from-emerald-700 hover:to-teal-800 text-white px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md disabled:opacity-50"
            >
              <Save size={15} className={saving ? "animate-spin" : ""} />
              <span>{saving ? "Saving..." : "Save Floor Plan"}</span>
            </button>
          ) : (
            <button
              onClick={() => window.print()}
              className="inline-flex items-center gap-1.5 bg-[#1E1B16] hover:bg-black text-[#F8F5F0] px-5 py-2.5 rounded-xl font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-md"
            >
              <Printer size={15} />
              <span>Print All (Ctrl + P)</span>
            </button>
          )}
        </div>
      </div>

      {/* TAB 1: FLOOR & TABLE SETUP */}
      {activeTab === "floors" && (
        <div className="space-y-6 print:hidden">
          {/* Quick Overview & Presets Banner */}
          <div className="bg-white p-5 rounded-3xl border border-[#e8dfd3] shadow-xs flex flex-col lg:flex-row items-start lg:items-center justify-between gap-4">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 rounded-2xl bg-[#FAF7F2] border border-[#e8dfd3] flex items-center justify-center text-[#A18D6D]">
                <Building size={24} />
              </div>
              <div>
                <h3 className="font-bold text-[#1E1B16] text-base">
                  Active Floor Layout: {sections.length} Floors · {totalTablesCount} Total Tables
                </h3>
                <p className="text-xs text-[#6F624E] mt-0.5">
                  Tables added here automatically sync across POS, Captain Waiter app, Cashier live map, and public QR ordering.
                </p>
              </div>
            </div>

            {/* Quick Presets */}
            <div className="flex flex-wrap items-center gap-2">
              <span className="text-[11px] font-bold text-gray-500 uppercase tracking-wider mr-1">
                Presets:
              </span>
              <button
                onClick={() => handleApplyPreset("15_DEFAULT")}
                className="text-xs px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-gray-700 font-bold rounded-xl border border-[#e8dfd3] transition"
              >
                15 Tables (Default)
              </button>
              <button
                onClick={() => handleApplyPreset("25_EXPANDED")}
                className="text-xs px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-gray-700 font-bold rounded-xl border border-[#e8dfd3] transition"
              >
                25 Tables (Medium)
              </button>
              <button
                onClick={() => handleApplyPreset("40_LARGE")}
                className="text-xs px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F0EAE1] text-gray-700 font-bold rounded-xl border border-[#e8dfd3] transition"
              >
                40 Tables (Multi-Floor)
              </button>
            </div>
          </div>

          {/* Floors Cards Grid */}
          <div className="space-y-6">
            {sections.map((sec, secIdx) => {
              const secInput = tableInputs[sec.id] || { single: "", rangeFrom: "", rangeTo: "" };

              return (
                <div
                  key={sec.id}
                  className="bg-white rounded-3xl border border-[#e8dfd3] p-5 sm:p-6 shadow-xs space-y-4 relative overflow-hidden transition-all hover:border-[#c5b59f]"
                >
                  {/* Floor Header */}
                  <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between pb-4 border-b border-[#f0eae1] gap-3">
                    <div className="flex items-center gap-3">
                      <div className="w-8 h-8 rounded-xl bg-[#1E1B16] text-[#F8F5F0] font-black text-xs flex items-center justify-center">
                        {secIdx + 1}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <h2 className="font-bold text-lg text-[#1E1B16]">{sec.name}</h2>
                          <button
                            onClick={() => handleRenameFloor(sec.id, sec.name)}
                            className="text-xs text-gray-400 hover:text-gray-700 font-medium underline"
                          >
                            Rename
                          </button>
                        </div>
                        <p className="text-xs text-[#6F624E]">
                          {sec.tables.length} {sec.tables.length === 1 ? "Table" : "Tables"} assigned to this floor
                        </p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <button
                        onClick={() => handleDeleteFloor(sec.id, sec.name)}
                        className="text-xs text-red-600 hover:text-red-700 hover:bg-red-50 p-2 rounded-xl transition flex items-center gap-1 border border-transparent hover:border-red-200"
                        title="Delete this floor"
                      >
                        <Trash2 size={14} />
                        <span className="font-semibold">Remove Floor</span>
                      </button>
                    </div>
                  </div>

                  {/* Active Tables Badges */}
                  <div>
                    <label className="block text-xs font-bold uppercase tracking-wider text-gray-500 mb-2">
                      Active Tables on {sec.name}:
                    </label>
                    {sec.tables.length === 0 ? (
                      <div className="p-4 bg-[#FAF7F2] rounded-2xl border border-dashed border-[#e8dfd3] text-center text-xs text-gray-500">
                        No tables on this floor yet. Use the inputs below to add tables.
                      </div>
                    ) : (
                      <div className="flex flex-wrap gap-2">
                        {sec.tables.map(tNum => (
                          <div
                            key={tNum}
                            className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#FAF7F2] hover:bg-[#F3EDE3] border border-[#e8dfd3] rounded-xl text-xs font-bold text-[#1E1B16] group transition"
                          >
                            <span className="w-2 h-2 rounded-full bg-emerald-500"></span>
                            <span>Table {tNum}</span>
                            <button
                              onClick={() => handleRemoveTable(sec.id, tNum)}
                              className="text-gray-400 hover:text-red-600 ml-1 rounded-full p-0.5 hover:bg-white transition"
                              title={`Remove Table ${tNum}`}
                            >
                              ✕
                            </button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {/* Add Tables Controls (Single Table or Range) */}
                  <div className="pt-2 border-t border-[#f0eae1] grid grid-cols-1 md:grid-cols-2 gap-4">
                    {/* Add Single Table */}
                    <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#e8dfd3] space-y-2">
                      <span className="block text-xs font-bold text-[#1E1B16]">
                        ➕ Add Single Table
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="text"
                          placeholder="e.g. 16 or T-16"
                          value={secInput.single}
                          onChange={(e) => setTableInputs({
                            ...tableInputs,
                            [sec.id]: { ...secInput, single: e.target.value }
                          })}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") {
                              e.preventDefault();
                              handleAddSingleTable(sec.id);
                            }
                          }}
                          className="flex-1 border border-[#e8dfd3] bg-white rounded-xl px-3 py-1.5 text-xs font-bold text-[#1E1B16] focus:border-[#A18D6D] outline-none"
                        />
                        <button
                          onClick={() => handleAddSingleTable(sec.id)}
                          className="px-4 py-1.5 bg-[#1E1B16] hover:bg-black text-[#F8F5F0] rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          Add
                        </button>
                      </div>
                    </div>

                    {/* Add Table Range (e.g. 16-25) */}
                    <div className="bg-[#FAF7F2] p-3.5 rounded-2xl border border-[#e8dfd3] space-y-2">
                      <span className="block text-xs font-bold text-[#1E1B16]">
                        ⚡ Add Multiple Range (Quick)
                      </span>
                      <div className="flex items-center gap-2">
                        <input
                          type="number"
                          placeholder="From (16)"
                          value={secInput.rangeFrom}
                          onChange={(e) => setTableInputs({
                            ...tableInputs,
                            [sec.id]: { ...secInput, rangeFrom: e.target.value }
                          })}
                          className="w-24 border border-[#e8dfd3] bg-white rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E1B16] focus:border-[#A18D6D] outline-none text-center"
                        />
                        <span className="text-xs text-gray-500 font-bold">to</span>
                        <input
                          type="number"
                          placeholder="To (25)"
                          value={secInput.rangeTo}
                          onChange={(e) => setTableInputs({
                            ...tableInputs,
                            [sec.id]: { ...secInput, rangeTo: e.target.value }
                          })}
                          className="w-24 border border-[#e8dfd3] bg-white rounded-xl px-2.5 py-1.5 text-xs font-bold text-[#1E1B16] focus:border-[#A18D6D] outline-none text-center"
                        />
                        <button
                          onClick={() => handleAddRangeTables(sec.id)}
                          className="flex-1 px-3 py-1.5 bg-[#A18D6D] hover:bg-[#8e7a5b] text-white rounded-xl text-xs font-bold transition active:scale-95"
                        >
                          Add Range
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Add New Floor / Section Card */}
          <div className="bg-[#FAF7F2] border-2 border-dashed border-[#e8dfd3] rounded-3xl p-6 text-center">
            {isAddingFloor ? (
              <div className="max-w-md mx-auto space-y-3">
                <h4 className="font-bold text-sm text-[#1E1B16]">
                  Add New Floor or Dining Section
                </h4>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    autoFocus
                    placeholder="e.g. 1st Floor, Rooftop Lounge, Banquet Hall"
                    value={newFloorName}
                    onChange={(e) => setNewFloorName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        e.preventDefault();
                        handleAddFloor();
                      }
                    }}
                    className="flex-1 border border-[#e8dfd3] bg-white rounded-xl px-3.5 py-2 text-sm font-bold text-[#1E1B16] focus:border-[#A18D6D] outline-none"
                  />
                  <button
                    onClick={handleAddFloor}
                    className="px-4 py-2 bg-[#1E1B16] hover:bg-black text-[#F8F5F0] rounded-xl text-xs font-bold transition"
                  >
                    Confirm
                  </button>
                  <button
                    onClick={() => {
                      setIsAddingFloor(false);
                      setNewFloorName("");
                    }}
                    className="px-3 py-2 bg-gray-200 hover:bg-gray-300 text-gray-700 rounded-xl text-xs font-bold transition"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setIsAddingFloor(true)}
                className="inline-flex items-center gap-2 px-5 py-3 bg-white hover:bg-[#F3EDE3] border border-[#e8dfd3] rounded-2xl text-xs font-bold text-[#1E1B16] shadow-xs transition"
              >
                <Plus size={16} className="text-[#A18D6D]" />
                <span>Add Another Floor / Dining Section</span>
              </button>
            )}
          </div>

          {/* Bottom Sticky Action Bar */}
          <div className="sticky bottom-6 z-20 bg-[#1E1B16] text-[#F8F5F0] p-4 rounded-3xl shadow-2xl flex flex-col sm:flex-row items-center justify-between gap-4 border border-white/10">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center font-bold">
                ✓
              </div>
              <div>
                <p className="text-sm font-bold text-white">
                  {totalTablesCount} Active Tables across {sections.length} Floors
                </p>
                <p className="text-xs text-gray-400">
                  Click 'Save Floor Plan' to apply updates across all restaurant devices.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-2 w-full sm:w-auto">
              <button
                onClick={handleSaveFloorPlan}
                disabled={saving}
                className="flex-1 sm:flex-none inline-flex items-center justify-center gap-2 bg-gradient-to-r from-emerald-500 to-teal-600 hover:from-emerald-600 hover:to-teal-700 text-white px-6 py-3 rounded-2xl font-bold text-xs uppercase tracking-wider transition active:scale-95 shadow-lg disabled:opacity-50"
              >
                <Save size={16} className={saving ? "animate-spin" : ""} />
                <span>{saving ? "Saving Changes..." : "Save Floor Plan Now"}</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: PRINT QR STANDEES */}
      {activeTab === "print" && (
        <div>
          {/* Floor Filter Bar (Hidden on Print) */}
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6 print:hidden bg-white p-4 rounded-3xl border border-[#e8dfd3] shadow-xs">
            <div className="flex items-center gap-2">
              <span className="text-xs font-bold uppercase tracking-wider text-gray-500">
                Filter by Floor:
              </span>
              <div className="flex flex-wrap gap-1.5">
                <button
                  onClick={() => setPrintFilterSection("ALL")}
                  className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                    printFilterSection === "ALL"
                      ? "bg-[#1E1B16] text-[#F8F5F0] shadow-xs"
                      : "bg-[#FAF7F2] text-gray-700 hover:bg-[#F0EAE1]"
                  }`}
                >
                  All Floors ({tables.length})
                </button>
                {sections.map(s => (
                  <button
                    key={s.id}
                    onClick={() => setPrintFilterSection(s.id)}
                    className={`px-3 py-1.5 rounded-xl text-xs font-bold transition ${
                      printFilterSection === s.id
                        ? "bg-[#1E1B16] text-[#F8F5F0] shadow-xs"
                        : "bg-[#FAF7F2] text-gray-700 hover:bg-[#F0EAE1]"
                    }`}
                  >
                    {s.name} ({s.tables.length})
                  </button>
                ))}
              </div>
            </div>

            <p className="text-xs text-gray-500 font-medium">
              Showing {printTables.length} QR Standees
            </p>
          </div>

          {loading ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-10 h-10 rounded-full border-3 border-zinc-200 border-t-[#A18D6D] animate-spin mb-4" />
              <p className="text-sm font-semibold text-zinc-700">Loading Table Standees...</p>
            </div>
          ) : printTables.length === 0 ? (
            <div className="text-center py-16 bg-white rounded-3xl border border-[#e8dfd3] p-8">
              <AlertCircle size={32} className="mx-auto text-amber-600 mb-2" />
              <h3 className="font-bold text-base text-[#1E1B16]">No tables found in this selection</h3>
              <p className="text-xs text-gray-500 mt-1 mb-4">
                Add tables to this floor in the "Floor & Table Setup" tab.
              </p>
              <button
                onClick={() => setActiveTab("floors")}
                className="px-4 py-2 bg-[#1E1B16] text-white rounded-xl text-xs font-bold"
              >
                Go to Floor Setup
              </button>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 print:grid-cols-2 print:gap-6 print:p-0">
              {printTables.map((t) => (
                <div 
                  key={t.table} 
                  className="standee-card bg-white p-6 rounded-3xl shadow-xs border border-[#e8dfd3] flex flex-col items-center justify-between text-center relative overflow-hidden transition-all hover:shadow-md"
                >
                  {/* Luxury Gold Accents & Branding */}
                  <div className="w-full flex flex-col items-center">
                    <div className="text-[10px] font-bold tracking-[0.25em] text-[#A18D6D] uppercase mb-1">
                      HOTEL MARQUIS
                    </div>
                    <div className="w-12 h-0.5 bg-[#A18D6D]/40 mb-3" />

                    <h2 className="font-playfair text-2xl font-bold text-[#1E1B16] mb-0.5">
                      Table {t.table}
                    </h2>
                    <p className="text-xs text-[#6F624E] mb-4 font-light">
                      Scan to View Menu & Order
                    </p>

                    {/* QR Code Container */}
                    <div className="w-full max-w-[190px] aspect-square flex items-center justify-center p-3.5 bg-white rounded-2xl border-2 border-[#e8dfd3] shadow-xs mb-4 [&>canvas]:!w-full [&>canvas]:!h-auto [&>canvas]:!max-w-full">
                      <QRCode 
                        id={`qr-canvas-${t.table}`}
                        value={t.qrUrl || ""}
                        size={240}
                        qrStyle="squares"
                        eyeRadius={[
                          [8, 8, 0, 8],
                          [8, 8, 8, 0],
                          [8, 0, 8, 8],
                        ]}
                        fgColor="#1E1B16"
                        bgColor="#FFFFFF"
                        ecLevel="M"
                      />
                    </div>

                    {/* Scan Instructions */}
                    <div className="space-y-1 mb-2">
                      <p className="text-xs font-semibold text-[#1E1B16]">
                        📸 Open Camera to Scan
                      </p>
                      <p className="text-[11px] text-[#A18D6D] font-medium tracking-wide">
                        Digital Self-Ordering Table
                      </p>
                    </div>
                  </div>

                  {/* Admin Utility Toolbar (Hidden on print) */}
                  <div className="w-full pt-4 mt-2 border-t border-gray-100 flex items-center justify-center gap-2 print:hidden">
                    <button
                      onClick={() => copyLink(t.qrUrl, String(t.table))}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-gray-700 bg-gray-50 hover:bg-gray-100 py-1.5 px-2.5 rounded-lg border border-gray-200 transition"
                      title="Copy Table Link"
                    >
                      {copiedTable === String(t.table) ? <Check size={12} className="text-emerald-600" /> : <Copy size={12} />}
                      <span>{copiedTable === String(t.table) ? "Copied" : "Copy"}</span>
                    </button>
                    <button
                      onClick={() => downloadQR(String(t.table))}
                      className="flex-1 inline-flex items-center justify-center gap-1 text-[11px] font-bold text-[#A18D6D] bg-[#FAF7F2] hover:bg-[#F3EDE3] py-1.5 px-2.5 rounded-lg border border-[#e8dfd3] transition"
                      title="Download Standalone QR PNG"
                    >
                      <Download size={12} />
                      <span>PNG</span>
                    </button>
                    <a
                      href={t.qrUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="inline-flex items-center justify-center p-1.5 text-gray-500 hover:text-gray-900 bg-gray-50 hover:bg-gray-100 rounded-lg border border-gray-200 transition"
                      title="Open Menu in new tab"
                    >
                      <ExternalLink size={12} />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* Print-specific Stylesheet */}
      <style dangerouslySetInnerHTML={{__html: `
        @media print {
          @page {
            size: A4 portrait;
            margin: 10mm;
          }
          body {
            background: white !important;
            color: black !important;
          }
          .print\\:hidden {
            display: none !important;
          }
          .standee-card {
            border: 2px solid #A18D6D !important;
            box-shadow: none !important;
            break-inside: avoid !important;
            page-break-inside: avoid !important;
            margin-bottom: 12mm;
            padding: 16mm 10mm !important;
          }
        }
      `}} />
    </div>
  );
}
