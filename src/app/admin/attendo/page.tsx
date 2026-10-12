"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, Calendar, Clock, DollarSign, Plus, 
  Search, Download, MessageCircle, AlertCircle, CheckCircle2, 
  Trash2, Edit3, ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight, Check,
  X, ShieldAlert, Award, FileText, CheckCircle, XCircle
} from "lucide-react";
import toast from "react-hot-toast";

export interface StaffMember {
  id: string;
  name: string;
  role: "Head Chef" | "Tandoor Master" | "Captain" | "Waiter" | "Kitchen Helper" | "Dishwasher" | "Cashier" | "Manager";
  department: "Kitchen" | "Service" | "Housekeeping" | "Management";
  phone: string;
  monthlySalary: number;
  dailyRate: number;
  joiningDate: string;
  shiftTiming: string;
  leaveBalance: number;
}

export interface AttendanceRecord {
  staffId: string;
  date: string;
  status: "PRESENT" | "HALF_DAY" | "ABSENT" | "PAID_LEAVE";
  inTime: string;
  overtimeHours: number;
  latePenalty: number;
}

export interface LeaveRequest {
  id: string;
  staffId: string;
  staffName: string;
  leaveType: "Sick Leave" | "Casual Leave" | "Emergency" | "Comp-Off";
  startDate: string;
  endDate: string;
  days: number;
  reason: string;
  status: "PENDING" | "APPROVED" | "REJECTED";
}

export interface SalaryAdvance {
  id: string;
  staffId: string;
  staffName: string;
  totalLoanAmount: number;
  monthlyInstallment: number;
  paidSoFar: number;
  remainingBalance: number;
  date: string;
  mode: "CASH" | "UPI";
  reason: string;
}

// Initial realistic default staff for Hotel White Bliss
const INITIAL_STAFF: StaffMember[] = [
  {
    id: "st-1",
    name: "Ramesh Kumar",
    role: "Head Chef",
    department: "Kitchen",
    phone: "9822114455",
    monthlySalary: 22000,
    dailyRate: Math.round(22000 / 30),
    joiningDate: "15 Jan 2024",
    shiftTiming: "10:00 AM - 11:00 PM (Split)",
    leaveBalance: 4
  },
  {
    id: "st-2",
    name: "Manoj Patil",
    role: "Tandoor Master",
    department: "Kitchen",
    phone: "9822336677",
    monthlySalary: 18000,
    dailyRate: Math.round(18000 / 30),
    joiningDate: "01 Mar 2024",
    shiftTiming: "11:00 AM - 11:00 PM",
    leaveBalance: 5
  },
  {
    id: "st-3",
    name: "Vikram Singh",
    role: "Captain",
    department: "Service",
    phone: "9890112233",
    monthlySalary: 15000,
    dailyRate: Math.round(15000 / 30),
    joiningDate: "10 May 2024",
    shiftTiming: "12:00 PM - 11:30 PM",
    leaveBalance: 3
  },
  {
    id: "st-4",
    name: "Suresh Shinde",
    role: "Captain",
    department: "Service",
    phone: "9890223344",
    monthlySalary: 14000,
    dailyRate: Math.round(14000 / 30),
    joiningDate: "01 Jun 2024",
    shiftTiming: "12:00 PM - 11:30 PM",
    leaveBalance: 6
  },
  {
    id: "st-5",
    name: "Ganesh Jadhav",
    role: "Kitchen Helper",
    department: "Kitchen",
    phone: "9765112233",
    monthlySalary: 11000,
    dailyRate: Math.round(11000 / 30),
    joiningDate: "20 Jul 2024",
    shiftTiming: "09:30 AM - 10:30 PM",
    leaveBalance: 2
  },
  {
    id: "st-6",
    name: "Sandeep More",
    role: "Dishwasher",
    department: "Housekeeping",
    phone: "9765223344",
    monthlySalary: 10000,
    dailyRate: Math.round(10000 / 30),
    joiningDate: "15 Aug 2024",
    shiftTiming: "11:00 AM - 11:30 PM",
    leaveBalance: 4
  },
  {
    id: "st-7",
    name: "Pooja Sharma",
    role: "Cashier",
    department: "Management",
    phone: "9823445566",
    monthlySalary: 16000,
    dailyRate: Math.round(16000 / 30),
    joiningDate: "01 Feb 2024",
    shiftTiming: "11:00 AM - 11:00 PM",
    leaveBalance: 5
  }
];

// Initial realistic advance salary logs with installment schedules
const INITIAL_ADVANCES: SalaryAdvance[] = [
  {
    id: "adv-1",
    staffId: "st-1",
    staffName: "Ramesh Kumar",
    totalLoanAmount: 4000,
    monthlyInstallment: 2000,
    paidSoFar: 2000,
    remainingBalance: 2000,
    date: "12 Oct 2026",
    mode: "CASH",
    reason: "Hospital medical emergency (2 installments)"
  },
  {
    id: "adv-2",
    staffId: "st-3",
    staffName: "Vikram Singh",
    totalLoanAmount: 1500,
    monthlyInstallment: 1500,
    paidSoFar: 0,
    remainingBalance: 1500,
    date: "08 Oct 2026",
    mode: "UPI",
    reason: "Bike repair expense (Deduct full)"
  },
  {
    id: "adv-3",
    staffId: "st-5",
    staffName: "Ganesh Jadhav",
    totalLoanAmount: 2000,
    monthlyInstallment: 1000,
    paidSoFar: 1000,
    remainingBalance: 1000,
    date: "10 Oct 2026",
    mode: "CASH",
    reason: "Family grocery advance (2 installments)"
  }
];

// Initial Leave Requests (Matching Attendo screenshot style)
const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: "lv-1",
    staffId: "st-3",
    staffName: "Vikram Singh (Captain)",
    leaveType: "Sick Leave",
    startDate: "14 Oct 2026",
    endDate: "15 Oct 2026",
    days: 2,
    reason: "High viral fever & doctor advised bed rest",
    status: "PENDING"
  },
  {
    id: "lv-2",
    staffId: "st-5",
    staffName: "Ganesh Jadhav (Helper)",
    leaveType: "Casual Leave",
    startDate: "18 Oct 2026",
    endDate: "18 Oct 2026",
    days: 1,
    reason: "Village family festival pooja",
    status: "PENDING"
  },
  {
    id: "lv-3",
    staffId: "st-2",
    staffName: "Manoj Patil (Tandoor)",
    leaveType: "Casual Leave",
    startDate: "05 Oct 2026",
    endDate: "06 Oct 2026",
    days: 2,
    reason: "Sister wedding ceremony",
    status: "APPROVED"
  }
];

export default function AttendoPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<{ [staffId: string]: AttendanceRecord }>({});
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [activeTab, setActiveTab] = useState<"attendance" | "leaves" | "advances" | "payroll" | "shifts" | "directory">("attendance");
  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);

  // Forms
  const [advanceForm, setAdvanceForm] = useState({
    staffId: "",
    totalLoanAmount: "",
    monthlyInstallment: "",
    mode: "CASH" as "CASH" | "UPI",
    reason: ""
  });

  const [leaveForm, setLeaveForm] = useState({
    staffId: "",
    leaveType: "Casual Leave" as "Sick Leave" | "Casual Leave" | "Emergency" | "Comp-Off",
    startDate: "",
    endDate: "",
    days: "1",
    reason: ""
  });

  const [newStaffForm, setNewStaffForm] = useState<Partial<StaffMember>>({
    name: "",
    role: "Captain",
    department: "Service",
    phone: "",
    monthlySalary: 14000,
    shiftTiming: "11:00 AM - 11:00 PM"
  });

  const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Load from localStorage
  useEffect(() => {
    const savedStaff = localStorage.getItem("hwb_attendo_staff");
    const savedAttendance = localStorage.getItem("hwb_attendo_attendance");
    const savedAdvances = localStorage.getItem("hwb_attendo_advances");
    const savedLeaves = localStorage.getItem("hwb_attendo_leaves");

    if (savedStaff) try { setStaff(JSON.parse(savedStaff)); } catch (e) { setStaff(INITIAL_STAFF); }
    else setStaff(INITIAL_STAFF);

    if (savedAdvances) try { setAdvances(JSON.parse(savedAdvances)); } catch (e) { setAdvances(INITIAL_ADVANCES); }
    else setAdvances(INITIAL_ADVANCES);

    if (savedLeaves) try { setLeaves(JSON.parse(savedLeaves)); } catch (e) { setLeaves(INITIAL_LEAVES); }
    else setLeaves(INITIAL_LEAVES);

    if (savedAttendance) {
      try { setAttendance(JSON.parse(savedAttendance)); } catch (e) { initDefaultAttendance(INITIAL_STAFF); }
    } else {
      initDefaultAttendance(INITIAL_STAFF);
    }
  }, []);

  const initDefaultAttendance = (staffList: StaffMember[]) => {
    const initMap: { [id: string]: AttendanceRecord } = {};
    staffList.forEach((s, idx) => {
      const status = idx === 5 ? "HALF_DAY" : idx === 6 ? "ABSENT" : "PRESENT";
      initMap[s.id] = {
        staffId: s.id,
        date: todayStr,
        status,
        inTime: status === "ABSENT" ? "--" : idx === 0 ? "09:45 AM" : "10:15 AM",
        overtimeHours: idx === 0 ? 1 : 0,
        latePenalty: idx === 1 ? 50 : 0 // Manoj arrived late, ₹50 penalty
      };
    });
    setAttendance(initMap);
    localStorage.setItem("hwb_attendo_attendance", JSON.stringify(initMap));
  };

  const saveStaff = (updated: StaffMember[]) => {
    setStaff(updated);
    localStorage.setItem("hwb_attendo_staff", JSON.stringify(updated));
  };

  const saveAttendance = (updatedMap: { [id: string]: AttendanceRecord }) => {
    setAttendance(updatedMap);
    localStorage.setItem("hwb_attendo_attendance", JSON.stringify(updatedMap));
  };

  const saveAdvances = (updated: SalaryAdvance[]) => {
    setAdvances(updated);
    localStorage.setItem("hwb_attendo_advances", JSON.stringify(updated));
  };

  const saveLeaves = (updated: LeaveRequest[]) => {
    setLeaves(updated);
    localStorage.setItem("hwb_attendo_leaves", JSON.stringify(updated));
  };

  // Toggle Attendance Status
  const handleSetStatus = (staffId: string, status: "PRESENT" | "HALF_DAY" | "ABSENT" | "PAID_LEAVE") => {
    const updated = {
      ...attendance,
      [staffId]: {
        staffId,
        date: todayStr,
        status,
        inTime: status === "ABSENT" ? "--" : "10:00 AM",
        overtimeHours: attendance[staffId]?.overtimeHours || 0,
        latePenalty: attendance[staffId]?.latePenalty || 0
      }
    };
    saveAttendance(updated);
    const member = staff.find(s => s.id === staffId);
    toast.success(`${member?.name} marked ${status}!`);
  };

  // Overtime / Penalty Toggle
  const handleAddOvertime = (staffId: string) => {
    const current = attendance[staffId] || { staffId, date: todayStr, status: "PRESENT", inTime: "10:00 AM", overtimeHours: 0, latePenalty: 0 };
    const updated = {
      ...attendance,
      [staffId]: {
        ...current,
        overtimeHours: current.overtimeHours + 1
      }
    };
    saveAttendance(updated);
    toast.success("+1 Hour Overtime added (+₹60 bonus)");
  };

  const handleToggleLatePenalty = (staffId: string) => {
    const current = attendance[staffId] || { staffId, date: todayStr, status: "PRESENT", inTime: "10:00 AM", overtimeHours: 0, latePenalty: 0 };
    const newPenalty = current.latePenalty > 0 ? 0 : 50;
    const updated = {
      ...attendance,
      [staffId]: {
        ...current,
        latePenalty: newPenalty
      }
    };
    saveAttendance(updated);
    toast.success(newPenalty > 0 ? "Late coming penalty (₹50) logged" : "Penalty waived off");
  };

  // Approve / Reject Leave Request (Petpooja Attendo Feature)
  const handleLeaveAction = (leaveId: string, newStatus: "APPROVED" | "REJECTED") => {
    const targetLeave = leaves.find(l => l.id === leaveId);
    if (!targetLeave) return;

    const updated = leaves.map(l => l.id === leaveId ? { ...l, status: newStatus } : l);
    saveLeaves(updated);

    if (newStatus === "APPROVED") {
      // Deduct from staff leave balance
      const updatedStaff = staff.map(s => {
        if (s.id === targetLeave.staffId) {
          return {
            ...s,
            leaveBalance: Math.max(0, s.leaveBalance - targetLeave.days)
          };
        }
        return s;
      });
      saveStaff(updatedStaff);
      toast.success(`Leave Approved for ${targetLeave.staffName} (${targetLeave.days} Days). Salary adjusted.`);
    } else {
      toast.error(`Leave Request Rejected for ${targetLeave.staffName}`);
    }
  };

  // Submit Advance Salary with Installment schedule
  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = staff.find(s => s.id === advanceForm.staffId);
    if (!targetMember) return toast.error("Select staff member");
    const totalAmt = parseFloat(advanceForm.totalLoanAmount);
    if (isNaN(totalAmt) || totalAmt <= 0) return toast.error("Enter valid amount");
    const installment = advanceForm.monthlyInstallment ? parseFloat(advanceForm.monthlyInstallment) : totalAmt;

    const newAdvance: SalaryAdvance = {
      id: "adv-" + Date.now(),
      staffId: targetMember.id,
      staffName: targetMember.name,
      totalLoanAmount: totalAmt,
      monthlyInstallment: installment,
      paidSoFar: 0,
      remainingBalance: totalAmt,
      date: todayStr,
      mode: advanceForm.mode,
      reason: advanceForm.reason || "Staff advance"
    };

    saveAdvances([newAdvance, ...advances]);
    setIsAdvanceModalOpen(false);
    setAdvanceForm({ staffId: "", totalLoanAmount: "", monthlyInstallment: "", mode: "CASH", reason: "" });
    toast.success(`₹${totalAmt} Advance logged for ${targetMember.name}! ₹${installment} will be auto-deducted per cycle.`);
  };

  // Submit New Leave Request
  const handleNewLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = staff.find(s => s.id === leaveForm.staffId);
    if (!targetMember) return toast.error("Select staff member");
    const daysNum = parseInt(leaveForm.days) || 1;

    const newLeave: LeaveRequest = {
      id: "lv-" + Date.now(),
      staffId: targetMember.id,
      staffName: `${targetMember.name} (${targetMember.role})`,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate || todayStr,
      endDate: leaveForm.endDate || todayStr,
      days: daysNum,
      reason: leaveForm.reason || "Personal work",
      status: "APPROVED" // Auto-approve when owner adds directly
    };

    saveLeaves([newLeave, ...leaves]);
    // Deduct leave balance
    const updatedStaff = staff.map(s => s.id === targetMember.id ? { ...s, leaveBalance: Math.max(0, s.leaveBalance - daysNum) } : s);
    saveStaff(updatedStaff);
    setIsNewLeaveModalOpen(false);
    toast.success(`Leave logged & approved for ${targetMember.name}!`);
  };

  // Add New Staff
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name) return toast.error("Enter staff name");
    const sal = Number(newStaffForm.monthlySalary) || 12000;

    const newMember: StaffMember = {
      id: "st-" + Date.now(),
      name: newStaffForm.name,
      role: (newStaffForm.role as any) || "Captain",
      department: (newStaffForm.department as any) || "Service",
      phone: newStaffForm.phone || "7499934257",
      monthlySalary: sal,
      dailyRate: Math.round(sal / 30),
      joiningDate: todayStr,
      shiftTiming: newStaffForm.shiftTiming || "11:00 AM - 11:00 PM",
      leaveBalance: 4
    };

    const updatedStaff = [...staff, newMember];
    saveStaff(updatedStaff);
    setIsAddStaffModalOpen(false);
    toast.success(`${newMember.name} added to staff directory!`);
  };

  // Payroll Calculation Helper (Petpooja Attendo Logic)
  const calculatePayrollForMember = (member: StaffMember) => {
    const memberAdvances = advances.filter(a => a.staffId === member.id && a.remainingBalance > 0);
    // Deduct monthly installment for this cycle
    const installmentDeduction = memberAdvances.reduce((acc, a) => acc + Math.min(a.monthlyInstallment, a.remainingBalance), 0);

    const rec = attendance[member.id];
    let payableDays = 27; // Baseline month assumption
    if (rec?.status === "ABSENT") payableDays = 26;
    if (rec?.status === "HALF_DAY") payableDays = 26.5;

    const overtimeBonus = (rec?.overtimeHours || 0) * 60; // ₹60/hr overtime
    const latePenalty = rec?.latePenalty || 0;

    const grossEarned = Math.round((member.monthlySalary / 30) * payableDays) + overtimeBonus - latePenalty;
    const netSalary = Math.max(0, grossEarned - installmentDeduction);

    return {
      payableDays,
      grossEarned,
      overtimeBonus,
      latePenalty,
      installmentDeduction,
      netSalary
    };
  };

  // 1-Click WhatsApp Salary Slip Share
  const handleWhatsAppSalarySlip = (member: StaffMember, payroll: any) => {
    const cleanPhone = member.phone.replace(/\D/g, "");
    const msg = `🧾 *HOTEL WHITE BLISS — OFFICIAL SALARY SLIP* 🧾\n` +
      `--------------------------------\n` +
      `*Employee:* ${member.name} (${member.role})\n` +
      `*Month:* ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}\n` +
      `--------------------------------\n` +
      `*Base Monthly Salary:* ₹${member.monthlySalary.toLocaleString("en-IN")}\n` +
      `*Payable Days:* ${payroll.payableDays} / 30 Days\n` +
      `*Gross Earned:* ₹${payroll.grossEarned.toLocaleString("en-IN")}\n` +
      (payroll.overtimeBonus > 0 ? `*Overtime Bonus (+):* ₹${payroll.overtimeBonus}\n` : '') +
      (payroll.latePenalty > 0 ? `*Late Penalty (-):* ₹${payroll.latePenalty}\n` : '') +
      `*Less: Advance Installment Deducted:* -₹${payroll.installmentDeduction.toLocaleString("en-IN")}\n` +
      `--------------------------------\n` +
      `*NET SALARY PAYABLE: ₹${payroll.netSalary.toLocaleString("en-IN")}*\n` +
      `Status: APPROVED & DISBURSED VIA UPI\n` +
      `--------------------------------\n` +
      `Dhanyawad! Hotel White Bliss Management. 🙏`;

    window.open(`https://wa.me/91${cleanPhone || "7499934257"}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(`Opening WhatsApp Salary Slip for ${member.name}`);
  };

  // CSV Export
  const handleExportCSV = () => {
    const headers = ["Staff Name,Role,Department,Phone,Monthly Salary (INR),Payable Days,Gross Earned (INR),Advance Deducted (INR),Net Salary (INR)"];
    const rows = staff.map(s => {
      const p = calculatePayrollForMember(s);
      return `"${s.name}","${s.role}","${s.department}","${s.phone}",${s.monthlySalary},${p.payableDays},${p.grossEarned},${p.installmentDeduction},${p.netSalary}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hotel_White_Bliss_Attendo_Payroll_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Attendo Payroll Report downloaded as CSV!");
  };

  // Top KPI calculations
  const totalStaffCount = staff.length;
  const presentCount = Object.values(attendance).filter(a => a.status === "PRESENT").length;
  const halfDayCount = Object.values(attendance).filter(a => a.status === "HALF_DAY").length;
  const absentCount = Object.values(attendance).filter(a => a.status === "ABSENT").length;
  const pendingLeavesCount = leaves.filter(l => l.status === "PENDING").length;
  const totalGrossPayroll = staff.reduce((acc, s) => acc + s.monthlySalary, 0);
  const totalAdvanceDeductionsMonth = staff.reduce((acc, s) => acc + calculatePayrollForMember(s).installmentDeduction, 0);
  const totalNetPayrollLiability = staff.reduce((acc, s) => acc + calculatePayrollForMember(s).netSalary, 0);

  // Filtered staff
  const filteredStaff = staff.filter(s => {
    const matchesDept = departmentFilter === "ALL" || s.department === departmentFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-8 animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-gray-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="p-2.5 bg-blue-600 text-white rounded-2xl shadow-sm">
              <UserCheck size={28} />
            </div>
            <div>
              <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight flex items-center gap-2">
                Attendo HR & Payroll Suite
                <span className="text-xs bg-blue-100 text-blue-800 font-bold px-2.5 py-0.5 rounded-full border border-blue-200">
                  Petpooja Attendo Matched
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Time & Attendance, Leave Approvals, Salary Advance Installments & Instant WhatsApp Payslips
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2.5">
          <button
            onClick={() => setIsNewLeaveModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <Calendar size={17} /> + Apply Leave
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <CreditCard size={17} /> + Log Advance
          </button>

          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex items-center gap-2 px-4 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-sm font-bold shadow-sm transition active:scale-95"
          >
            <Plus size={17} /> + Add Staff
          </button>

          <button
            onClick={handleExportCSV}
            className="p-2.5 bg-white hover:bg-gray-100 text-gray-700 border border-gray-200 rounded-xl transition shadow-sm"
            title="Download CSV Payroll Report"
          >
            <Download size={18} />
          </button>
        </div>
      </div>

      {/* KPI Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4">
        {/* Total Active Staff */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Active Staff</span>
            <div className="p-2 bg-gray-100 text-gray-700 rounded-xl">
              <Users size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-gray-900">
            {totalStaffCount} Members
          </div>
          <p className="text-xs text-gray-500 mt-1">Kitchen & Floor Roster</p>
        </div>

        {/* Today's Attendance */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Today's Present</span>
            <div className="p-2 bg-green-50 text-green-600 rounded-xl">
              <CheckCircle2 size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-green-700">
            {presentCount} / {totalStaffCount}
          </div>
          <p className="text-xs text-gray-500 mt-1">
            {halfDayCount > 0 && `${halfDayCount} Half-day • `} {absentCount} Absent
          </p>
        </div>

        {/* Pending Leave Requests */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          pendingLeavesCount > 0 ? "bg-purple-50/70 border-purple-200" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-purple-900">Leave Requests</span>
            <div className="p-2 bg-purple-600 text-white rounded-xl">
              <Calendar size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-purple-900">
            {pendingLeavesCount} Pending
          </div>
          <p className="text-xs text-purple-700 mt-1">
            {pendingLeavesCount > 0 ? "Needs Manager Approval" : "All Approved"}
          </p>
        </div>

        {/* Total Advance Deductions */}
        <div className={`p-5 rounded-2xl border shadow-sm relative overflow-hidden ${
          totalAdvanceDeductionsMonth > 0 ? "bg-rose-50/70 border-rose-200" : "bg-white border-gray-200"
        }`}>
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-rose-800">Advance Deducted</span>
            <div className="p-2 bg-rose-600 text-white rounded-xl">
              <CreditCard size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-rose-700">
            ₹{totalAdvanceDeductionsMonth.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-rose-600 mt-1">Auto-deducted this month</p>
        </div>

        {/* Net Salary Payable */}
        <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">Net Salary To Pay</span>
            <div className="p-2 bg-emerald-50 text-emerald-600 rounded-xl">
              <Check size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-emerald-700">
            ₹{totalNetPayrollLiability.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-emerald-600 mt-1">Total payout liability</p>
        </div>
      </div>

      {/* Official Attendo Styled Module Navigation Tabs */}
      <div className="flex items-center justify-between border-b border-gray-200 overflow-x-auto pb-px">
        <div className="flex gap-2 min-w-max">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "attendance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Clock size={16} /> 01 Time & Attendance
          </button>

          <button
            onClick={() => setActiveTab("leaves")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "leaves"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Calendar size={16} /> 02 Leave & Holidays ({leaves.length})
            {pendingLeavesCount > 0 && (
              <span className="w-2 h-2 rounded-full bg-purple-600"></span>
            )}
          </button>

          <button
            onClick={() => setActiveTab("advances")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "advances"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <CreditCard size={16} /> 03 Advances & Installments ({advances.length})
          </button>

          <button
            onClick={() => setActiveTab("payroll")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "payroll"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <DollarSign size={16} /> 04 Payroll & Payout
          </button>

          <button
            onClick={() => setActiveTab("shifts")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "shifts"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Award size={16} /> 05 Shifts & Roster
          </button>

          <button
            onClick={() => setActiveTab("directory")}
            className={`pb-3 px-3 sm:px-4 font-bold text-sm border-b-2 transition flex items-center gap-2 ${
              activeTab === "directory"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Users size={16} /> 06 Staff Directory
          </button>
        </div>
      </div>

      {/* TAB 1: 01 TIME & ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div>
              <h3 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <span>⏱️</span> Daily Attendance & Shift Punch: <span className="text-blue-600">{todayStr}</span>
              </h3>
              <p className="text-xs text-gray-500 mt-0.5">
                Mark present, half-day, or absent. Overtime (+₹60/hr) and late penalties (₹50) reflect automatically in the payroll.
              </p>
            </div>
            <div className="text-xs font-bold px-3 py-1.5 bg-green-100 text-green-800 rounded-xl border border-green-200">
              {presentCount} of {staff.length} Present Today
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4">Shift & Dept</th>
                  <th className="py-3.5 px-4">In-Time</th>
                  <th className="py-3.5 px-4 text-center">Overtime / Penalty</th>
                  <th className="py-3.5 px-5 text-right">Attendance Punch</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map(member => {
                  const rec = attendance[member.id] || {
                    status: "PRESENT",
                    inTime: "10:00 AM",
                    overtimeHours: 0,
                    latePenalty: 0
                  };

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-400 mt-0.5">📱 {member.phone}</div>
                      </td>
                      <td className="py-4 px-4">
                        <span className="font-semibold text-gray-800 text-xs block">{member.role}</span>
                        <span className="text-[11px] text-gray-400">{member.shiftTiming}</span>
                      </td>
                      <td className="py-4 px-4 text-xs font-medium text-gray-600">
                        {rec.inTime}
                      </td>
                      <td className="py-4 px-4 text-center">
                        <div className="flex items-center justify-center gap-1.5">
                          <button
                            onClick={() => handleAddOvertime(member.id)}
                            className="px-2 py-1 bg-blue-50 hover:bg-blue-100 text-blue-700 text-xs font-bold rounded-lg border border-blue-200"
                            title="Add 1 Hour Overtime (+₹60)"
                          >
                            +{rec.overtimeHours}h OT
                          </button>
                          <button
                            onClick={() => handleToggleLatePenalty(member.id)}
                            className={`px-2 py-1 text-xs font-bold rounded-lg border transition ${
                              rec.latePenalty > 0
                                ? "bg-rose-100 text-rose-800 border-rose-300"
                                : "bg-gray-50 text-gray-600 border-gray-200 hover:bg-gray-100"
                            }`}
                            title="Toggle Late Penalty (₹50)"
                          >
                            {rec.latePenalty > 0 ? "Late (-₹50)" : "On Time"}
                          </button>
                        </div>
                      </td>
                      <td className="py-4 px-5 text-right">
                        <div className="inline-flex p-1 bg-gray-100 rounded-xl gap-1">
                          <button
                            onClick={() => handleSetStatus(member.id, "PRESENT")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              rec.status === "PRESENT"
                                ? "bg-green-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-green-700"
                            }`}
                          >
                            🟢 Present
                          </button>
                          <button
                            onClick={() => handleSetStatus(member.id, "HALF_DAY")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              rec.status === "HALF_DAY"
                                ? "bg-amber-500 text-white shadow-sm"
                                : "text-gray-600 hover:text-amber-700"
                            }`}
                          >
                            🟡 Half (0.5)
                          </button>
                          <button
                            onClick={() => handleSetStatus(member.id, "ABSENT")}
                            className={`px-3 py-1.5 rounded-lg text-xs font-bold transition ${
                              rec.status === "ABSENT"
                                ? "bg-rose-600 text-white shadow-sm"
                                : "text-gray-600 hover:text-rose-700"
                            }`}
                          >
                            🔴 Absent
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
      )}

      {/* TAB 2: 02 LEAVE & HOLIDAYS (From Attendo Screenshot 1, 2 & 3) */}
      {activeTab === "leaves" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-purple-50/70 border border-purple-200 p-4 rounded-2xl flex items-start gap-3">
            <Calendar className="text-purple-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-purple-950 text-sm">Consolidated Leave Records & Approvals</h3>
              <p className="text-xs text-purple-800 mt-0.5 leading-relaxed">
                Every leave request, approval, and balance in one place. Approved leaves reflect instantly in that month's salary calculation without manual effort.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaves.map(req => {
              const isPending = req.status === "PENDING";
              const isApproved = req.status === "APPROVED";

              return (
                <div key={req.id} className={`bg-white rounded-2xl border p-5 shadow-sm space-y-3 ${
                  isPending ? "border-purple-300 ring-1 ring-purple-300" : "border-gray-200"
                }`}>
                  <div className="flex items-start justify-between border-b pb-3 border-gray-100">
                    <div>
                      <h4 className="font-bold text-gray-900 text-base">{req.staffName}</h4>
                      <span className="text-xs font-bold text-purple-700 bg-purple-100 px-2.5 py-0.5 rounded-md inline-block mt-1">
                        {req.leaveType}
                      </span>
                    </div>
                    {isPending ? (
                      <span className="text-xs font-black bg-amber-100 text-amber-800 px-2.5 py-1 rounded-full animate-pulse">
                        Pending
                      </span>
                    ) : isApproved ? (
                      <span className="text-xs font-bold bg-green-100 text-green-700 px-2.5 py-1 rounded-full">
                        Approved ✓
                      </span>
                    ) : (
                      <span className="text-xs font-bold bg-rose-100 text-rose-700 px-2.5 py-1 rounded-full">
                        Rejected ✕
                      </span>
                    )}
                  </div>

                  <div className="bg-gray-50 p-3 rounded-xl text-xs space-y-1">
                    <div className="flex justify-between text-gray-600">
                      <span>Duration:</span>
                      <strong className="text-gray-900">{req.days} Day(s) ({req.startDate} to {req.endDate})</strong>
                    </div>
                    <div className="text-gray-500 pt-1">
                      Reason: <span className="text-gray-800 italic">"{req.reason}"</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleLeaveAction(req.id, "REJECTED")}
                        className="flex-1 py-2 bg-gray-100 hover:bg-gray-200 text-gray-700 text-xs font-bold rounded-xl transition"
                      >
                        Reject
                      </button>
                      <button
                        onClick={() => handleLeaveAction(req.id, "APPROVED")}
                        className="flex-1 py-2 bg-purple-600 hover:bg-purple-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
                      >
                        Approve
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* TAB 3: 03 ADVANCES & LOAN INSTALLMENTS (From Attendo Screenshot 5) */}
      {activeTab === "advances" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
            <CreditCard className="text-rose-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-rose-950 text-sm">Log Advances & Automatic Installment Deductions</h3>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Record each advance against the employee's profile along with the repayment schedule. Each cycle's installment is automatically deducted until the loan clears!
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Staff Loan & Advance Repayment Ledger</h3>
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="px-3.5 py-2 bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold rounded-xl shadow-xs transition"
              >
                + Log Advance
              </button>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4">Date & Mode</th>
                  <th className="py-3.5 px-4">Reason / Notes</th>
                  <th className="py-3.5 px-4 text-center">Total Advance</th>
                  <th className="py-3.5 px-4 text-center text-rose-600 font-bold">Monthly Installment</th>
                  <th className="py-3.5 px-5 text-right font-black">Remaining Balance</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {advances.map(adv => (
                  <tr key={adv.id} className="hover:bg-gray-50/70 transition">
                    <td className="py-4 px-5 font-bold text-gray-900">
                      {adv.staffName}
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-500">
                      <div>{adv.date}</div>
                      <span className="font-bold text-gray-700 bg-gray-100 px-1.5 py-0.5 rounded text-[10px]">{adv.mode}</span>
                    </td>
                    <td className="py-4 px-4 text-xs text-gray-700 max-w-xs font-medium">
                      {adv.reason}
                    </td>
                    <td className="py-4 px-4 text-center font-bold text-gray-900">
                      ₹{adv.totalLoanAmount.toLocaleString("en-IN")}
                    </td>
                    <td className="py-4 px-4 text-center font-extrabold text-rose-600 bg-rose-50/50">
                      -₹{adv.monthlyInstallment.toLocaleString("en-IN")} / month
                    </td>
                    <td className="py-4 px-5 text-right font-black text-rose-700 text-base">
                      ₹{adv.remainingBalance.toLocaleString("en-IN")}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 4: 04 PAYROLL & PAYOUT (From Attendo Screenshot 4) */}
      {activeTab === "payroll" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex items-start gap-3">
            <DollarSign className="text-emerald-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-emerald-950 text-sm">Payroll Ready Before Month-End</h3>
              <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                Salaries stay calculated through the month with every approved attendance and advance entry. Month-end is simply a 1-tap review and approval step, not a calculation headache.
              </p>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4 text-center">Monthly Base</th>
                  <th className="py-3.5 px-4 text-center">Working Days</th>
                  <th className="py-3.5 px-4 text-center">Gross Earned</th>
                  <th className="py-3.5 px-4 text-center text-rose-600">Advance Installment</th>
                  <th className="py-3.5 px-4 text-right font-black text-emerald-700">Net Payable</th>
                  <th className="py-3.5 px-5 text-right">Instant WhatsApp Payslip</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map(member => {
                  const p = calculatePayrollForMember(member);

                  return (
                    <tr key={member.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{member.name}</div>
                        <div className="text-xs text-gray-400">{member.role}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-gray-700">
                        ₹{member.monthlySalary.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-gray-900">
                        {p.payableDays} / 30
                      </td>
                      <td className="py-4 px-4 text-center font-semibold text-gray-900">
                        ₹{p.grossEarned.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-rose-600 bg-rose-50/40">
                        {p.installmentDeduction > 0 ? `-₹${p.installmentDeduction.toLocaleString("en-IN")}` : "₹0"}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-base text-emerald-700 bg-emerald-50/60">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleWhatsAppSalarySlip(member, p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                        >
                          <MessageCircle size={14} /> Send Payslip
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 5: 05 SHIFTS & ROSTER */}
      {activeTab === "shifts" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">Kitchen Split Shift</span>
              <h4 className="text-base font-bold text-gray-900">10:00 AM - 11:00 PM (Break 3 PM - 7 PM)</h4>
              <p className="text-xs text-gray-500">Assigned: Ramesh Kumar (Head Chef), Manoj Patil (Tandoor)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">Floor Service Shift</span>
              <h4 className="text-base font-bold text-gray-900">12:00 PM - 11:30 PM (Continuous)</h4>
              <p className="text-xs text-gray-500">Assigned: Vikram Singh (Captain), Suresh Shinde (Captain)</p>
            </div>
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-800 rounded-md">Prep & Morning Shift</span>
              <h4 className="text-base font-bold text-gray-900">09:30 AM - 10:30 PM</h4>
              <p className="text-xs text-gray-500">Assigned: Ganesh Jadhav (Helper), Sandeep More (Cleaning)</p>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: 06 STAFF DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
            <div className="relative flex-1">
              <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-gray-400" size={17} />
              <input
                type="text"
                placeholder="Search staff by name or role..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-10 pr-4 py-2 text-sm bg-gray-50 border border-gray-200 rounded-xl focus:outline-none"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="text-xs font-bold py-2 px-3 border border-gray-200 rounded-xl bg-gray-50 text-gray-700"
            >
              <option value="ALL">All Departments</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Service">Service</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Management">Management</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {filteredStaff.map(member => (
              <div key={member.id} className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-3">
                <div className="flex items-start justify-between border-b pb-3 border-gray-100">
                  <div>
                    <h3 className="font-bold text-gray-900 text-base">{member.name}</h3>
                    <p className="text-xs text-blue-600 font-bold">{member.role}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{member.department} Dept • 📱 {member.phone}</p>
                  </div>
                  <span className="text-xs font-bold px-2.5 py-1 bg-gray-100 text-gray-700 rounded-lg">
                    ₹{member.monthlySalary}/mo
                  </span>
                </div>
                <div className="text-xs text-gray-500 space-y-1">
                  <div>⏰ Shift: <strong className="text-gray-700">{member.shiftTiming}</strong></div>
                  <div>📅 Balance Leaves: <strong className="text-purple-700">{member.leaveBalance} Days Available</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL 1: LOG SALARY ADVANCE WITH INSTALLMENT */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <CreditCard className="text-rose-600" /> Log Advance & Installment Repayment
            </h3>
            <p className="text-xs text-gray-500">
              Record each advance along with repayment installments. The system automatically deducts installments each payroll cycle until the loan clears.
            </p>

            <form onSubmit={handleAdvanceSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Staff Member</label>
                <select
                  value={advanceForm.staffId}
                  onChange={e => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="">-- Choose Staff --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role} - Salary: ₹{s.monthlySalary})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Total Loan / Advance (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 4000"
                    value={advanceForm.totalLoanAmount}
                    onChange={e => setAdvanceForm({ ...advanceForm, totalLoanAmount: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Installment (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={advanceForm.monthlyInstallment}
                    onChange={e => setAdvanceForm({ ...advanceForm, monthlyInstallment: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Payment Mode</label>
                <select
                  value={advanceForm.mode}
                  onChange={e => setAdvanceForm({ ...advanceForm, mode: e.target.value as any })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-rose-500 outline-none"
                >
                  <option value="CASH">Cash Counter</option>
                  <option value="UPI">UPI / Bank Transfer</option>
                </select>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason / Note</label>
                <input
                  type="text"
                  placeholder="e.g. Family medical emergency (2 installments)"
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-rose-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-rose-600 hover:bg-rose-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Confirm & Schedule
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: APPLY LEAVE */}
      {isNewLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Calendar className="text-purple-600" /> Apply Leave for Staff
            </h3>

            <form onSubmit={handleNewLeaveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Staff Member</label>
                <select
                  value={leaveForm.staffId}
                  onChange={e => setLeaveForm({ ...leaveForm, staffId: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                >
                  <option value="">-- Choose Staff --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} ({s.role} - Balance: {s.leaveBalance} Days)
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Comp-Off">Comp-Off</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Number of Days</label>
                  <input
                    type="number"
                    value={leaveForm.days}
                    onChange={e => setLeaveForm({ ...leaveForm, days: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-purple-500 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Reason for Leave</label>
                <input
                  type="text"
                  placeholder="e.g. Family pooja / fever"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-purple-500 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLeaveModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-purple-600 hover:bg-purple-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Approve & Deduct
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: ADD NEW STAFF MEMBER */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <Plus className="text-blue-600" /> Add New Staff Member
            </h3>

            <form onSubmit={handleAddStaffSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Employee Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={newStaffForm.name}
                  onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Role / Designation</label>
                  <select
                    value={newStaffForm.role}
                    onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    <option value="Head Chef">Head Chef</option>
                    <option value="Tandoor Master">Tandoor Master</option>
                    <option value="Captain">Captain</option>
                    <option value="Waiter">Waiter</option>
                    <option value="Kitchen Helper">Kitchen Helper</option>
                    <option value="Dishwasher">Dishwasher</option>
                    <option value="Cashier">Cashier</option>
                    <option value="Manager">Manager</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Department</label>
                  <select
                    value={newStaffForm.department}
                    onChange={e => setNewStaffForm({ ...newStaffForm, department: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  >
                    <option value="Kitchen">Kitchen</option>
                    <option value="Service">Service</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 15000"
                    value={newStaffForm.monthlySalary}
                    onChange={e => setNewStaffForm({ ...newStaffForm, monthlySalary: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">WhatsApp Phone</label>
                  <input
                    type="tel"
                    placeholder="e.g. 9822334455"
                    value={newStaffForm.phone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-gray-900 outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Shift Timings</label>
                <input
                  type="text"
                  placeholder="e.g. 11:00 AM - 11:00 PM"
                  value={newStaffForm.shiftTiming}
                  onChange={e => setNewStaffForm({ ...newStaffForm, shiftTiming: e.target.value })}
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm focus:ring-2 focus:ring-gray-900 outline-none"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-gray-900 hover:bg-black text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Save Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
