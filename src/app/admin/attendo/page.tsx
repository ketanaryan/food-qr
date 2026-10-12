"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, Calendar, Clock, DollarSign, Plus, 
  Search, Download, MessageCircle, AlertCircle, CheckCircle2, 
  Trash2, Edit3, ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight, Check,
  X, ShieldAlert, Award, FileText, CheckCircle, XCircle,
  Lock, Unlock, Shield, Activity, FileSpreadsheet, TrendingUp,
  Percent, Briefcase, Building2
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
  heldArrears: number; // Salary held with owner (Pending Lump-sum deposit)
  bankAccount?: string;
  bankIFSC?: string;
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

export interface AuditLog {
  id: string;
  timestamp: string;
  actor: string;
  action: string;
  details: string;
  type: "LEAVE" | "ADVANCE" | "PAYROLL" | "ATTENDANCE" | "SYSTEM";
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
    leaveBalance: 4,
    heldArrears: 4000, // Keeps ₹4,000 pending with owner for village trip
    bankAccount: "50100458921102",
    bankIFSC: "HDFC0001244"
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
    leaveBalance: 5,
    heldArrears: 0,
    bankAccount: "309811445210",
    bankIFSC: "SBIN0004521"
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
    leaveBalance: 3,
    heldArrears: 2000,
    bankAccount: "919011223344",
    bankIFSC: "PYTM0123456"
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
    leaveBalance: 6,
    heldArrears: 0,
    bankAccount: "0456101002341",
    bankIFSC: "ICIC0000456"
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
    leaveBalance: 2,
    heldArrears: 1500,
    bankAccount: "567812009844",
    bankIFSC: "BKID0001099"
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
    leaveBalance: 4,
    heldArrears: 0,
    bankAccount: "129033445511",
    bankIFSC: "PUNB0129000"
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
    leaveBalance: 5,
    heldArrears: 0,
    bankAccount: "445566778899",
    bankIFSC: "AXIS0000122"
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

// Initial Activity Audit Logs (Matching Screenshot 5)
const INITIAL_LOGS: AuditLog[] = [
  {
    id: "log-1",
    timestamp: "12 Oct 2026, 10:15 AM",
    actor: "Admin (Owner)",
    action: "Leave Approved",
    details: "Approved 2 days Casual Leave for Manoj Patil",
    type: "LEAVE"
  },
  {
    id: "log-2",
    timestamp: "12 Oct 2026, 09:40 AM",
    actor: "Admin (Owner)",
    action: "Advance Scheduled",
    details: "Recorded ₹4,000 loan for Ramesh Kumar with ₹2,000 monthly auto-deduction",
    type: "ADVANCE"
  },
  {
    id: "log-3",
    timestamp: "12 Oct 2026, 09:10 AM",
    actor: "System Attendo",
    action: "Attendance Cycle Initialized",
    details: "Automated daily attendance sheet opened for 7 active staff members",
    type: "ATTENDANCE"
  },
  {
    id: "log-4",
    timestamp: "11 Oct 2026, 11:30 PM",
    actor: "Manager",
    action: "Shift Closed",
    details: "Night floor shift closed. 2 Overtime hours logged for Head Chef.",
    type: "SYSTEM"
  }
];

export default function AttendoPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<{ [staffId: string]: AttendanceRecord }>({});
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  // Tabs: Matches 01 to 09 of Attendo screenshot suite
  const [activeTab, setActiveTab] = useState<
    "attendance" | "leaves" | "advances" | "payroll" | "penalties" | "compliance" | "reports" | "admin_control" | "shifts" | "directory"
  >("attendance");

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  // Payroll lock & compliance state
  const [isPayrollLocked, setIsPayrollLocked] = useState(false);
  const [complianceMode, setComplianceMode] = useState<"CASH_IN_HAND" | "STATUTORY">("CASH_IN_HAND");
  const [selectedState, setSelectedState] = useState("Maharashtra");

  // Overtime & Penalty rules configuration (Screenshot 2)
  const [overtimeRules, setOvertimeRules] = useState({
    graceMinutes: 15, // 15 min buffer before OT starts
    roundingInterval: 30, // 30 min rounding
    ratePerHour: 60,
    latePenaltyAmount: 50,
    offDayPaid: true,
    messDeduction: 0 // e.g. Staff canteen deduction
  });

  // Modals
  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);
  const [isArrearModalOpen, setIsArrearModalOpen] = useState(false);

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

  const [arrearForm, setArrearForm] = useState({
    staffId: "",
    amount: "",
    actionType: "HOLD" as "HOLD" | "RELEASE",
    notes: ""
  });

  const [newStaffForm, setNewStaffForm] = useState<Partial<StaffMember>>({
    name: "",
    role: "Captain",
    department: "Service",
    phone: "",
    monthlySalary: 14000,
    shiftTiming: "11:00 AM - 11:00 PM",
    bankAccount: "",
    bankIFSC: ""
  });

  const todayStr = new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" });

  // Load from localStorage
  useEffect(() => {
    const savedStaff = localStorage.getItem("hwb_attendo_staff");
    const savedAttendance = localStorage.getItem("hwb_attendo_attendance");
    const savedAdvances = localStorage.getItem("hwb_attendo_advances");
    const savedLeaves = localStorage.getItem("hwb_attendo_leaves");
    const savedLogs = localStorage.getItem("hwb_attendo_logs");
    const savedLocked = localStorage.getItem("hwb_attendo_locked");

    if (savedStaff) try { setStaff(JSON.parse(savedStaff)); } catch (e) { setStaff(INITIAL_STAFF); }
    else setStaff(INITIAL_STAFF);

    if (savedAdvances) try { setAdvances(JSON.parse(savedAdvances)); } catch (e) { setAdvances(INITIAL_ADVANCES); }
    else setAdvances(INITIAL_ADVANCES);

    if (savedLeaves) try { setLeaves(JSON.parse(savedLeaves)); } catch (e) { setLeaves(INITIAL_LEAVES); }
    else setLeaves(INITIAL_LEAVES);

    if (savedLogs) try { setLogs(JSON.parse(savedLogs)); } catch (e) { setLogs(INITIAL_LOGS); }
    else setLogs(INITIAL_LOGS);

    if (savedLocked === "true") setIsPayrollLocked(true);

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
        latePenalty: idx === 1 ? 50 : 0
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

  const logAction = (action: string, details: string, type: AuditLog["type"]) => {
    const newLog: AuditLog = {
      id: "log-" + Date.now(),
      timestamp: new Date().toLocaleString("en-GB", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" }),
      actor: "Admin (Owner)",
      action,
      details,
      type
    };
    const updated = [newLog, ...logs];
    setLogs(updated);
    localStorage.setItem("hwb_attendo_logs", JSON.stringify(updated));
  };

  // Toggle Attendance Status
  const handleSetStatus = (staffId: string, status: "PRESENT" | "HALF_DAY" | "ABSENT" | "PAID_LEAVE") => {
    if (isPayrollLocked) {
      return toast.error("Payroll is Finalised and Locked! Unlock to edit attendance.");
    }
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
    logAction("Attendance Marked", `${member?.name} marked as ${status}`, "ATTENDANCE");
  };

  // Overtime / Penalty Toggle
  const handleAddOvertime = (staffId: string) => {
    if (isPayrollLocked) return toast.error("Payroll period is locked.");
    const current = attendance[staffId] || { staffId, date: todayStr, status: "PRESENT", inTime: "10:00 AM", overtimeHours: 0, latePenalty: 0 };
    const updated = {
      ...attendance,
      [staffId]: {
        ...current,
        overtimeHours: current.overtimeHours + 1
      }
    };
    saveAttendance(updated);
    const member = staff.find(s => s.id === staffId);
    toast.success(`+1 Hour Overtime added for ${member?.name} (+₹${overtimeRules.ratePerHour})`);
    logAction("Overtime Added", `+1 Hour OT granted to ${member?.name}`, "ATTENDANCE");
  };

  const handleToggleLatePenalty = (staffId: string) => {
    if (isPayrollLocked) return toast.error("Payroll period is locked.");
    const current = attendance[staffId] || { staffId, date: todayStr, status: "PRESENT", inTime: "10:00 AM", overtimeHours: 0, latePenalty: 0 };
    const newPenalty = current.latePenalty > 0 ? 0 : overtimeRules.latePenaltyAmount;
    const updated = {
      ...attendance,
      [staffId]: {
        ...current,
        latePenalty: newPenalty
      }
    };
    saveAttendance(updated);
    const member = staff.find(s => s.id === staffId);
    toast.success(newPenalty > 0 ? `Late penalty (₹${overtimeRules.latePenaltyAmount}) logged for ${member?.name}` : "Penalty waived off");
    logAction("Late Penalty", `${member?.name}: ${newPenalty > 0 ? 'Deducted ₹50' : 'Waived'}`, "ATTENDANCE");
  };

  // Approve / Reject Leave Request (Petpooja Attendo Feature)
  const handleLeaveAction = (leaveId: string, newStatus: "APPROVED" | "REJECTED") => {
    const targetLeave = leaves.find(l => l.id === leaveId);
    if (!targetLeave) return;

    const updated = leaves.map(l => l.id === leaveId ? { ...l, status: newStatus } : l);
    saveLeaves(updated);

    if (newStatus === "APPROVED") {
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
      logAction("Leave Approved", `${targetLeave.staffName} - ${targetLeave.days} Days (${targetLeave.leaveType})`, "LEAVE");
    } else {
      toast.error(`Leave Request Rejected for ${targetLeave.staffName}`);
      logAction("Leave Rejected", `${targetLeave.staffName} request declined`, "LEAVE");
    }
  };

  // Submit Advance Salary with Installment schedule (Screenshot 1)
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
    toast.success(`₹${totalAmt} Advance logged for ${targetMember.name}! ₹${installment} will auto-deduct per cycle.`);
    logAction("Advance Logged", `₹${totalAmt} loan to ${targetMember.name} (₹${installment}/mo installment)`, "ADVANCE");
  };

  // Handle Arrears / Held Salary Khata (Screenshot 1)
  const handleArrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = staff.find(s => s.id === arrearForm.staffId);
    if (!targetMember) return toast.error("Select staff member");
    const amt = parseFloat(arrearForm.amount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter valid amount");

    const updatedStaff = staff.map(s => {
      if (s.id === targetMember.id) {
        const newArrears = arrearForm.actionType === "HOLD" 
          ? s.heldArrears + amt 
          : Math.max(0, s.heldArrears - amt);
        return { ...s, heldArrears: newArrears };
      }
      return s;
    });

    saveStaff(updatedStaff);
    setIsArrearModalOpen(false);
    const actionText = arrearForm.actionType === "HOLD" ? "Kept with Owner" : "Released & Paid to Staff";
    toast.success(`₹${amt} Arrear ${actionText} for ${targetMember.name}!`);
    logAction("Arrears Updated", `${targetMember.name}: ₹${amt} ${actionText}`, "PAYROLL");
    setArrearForm({ staffId: "", amount: "", actionType: "HOLD", notes: "" });
  };

  // Toggle Payroll Finalisation Lock (Screenshot 1)
  const handleTogglePayrollLock = () => {
    const nextState = !isPayrollLocked;
    setIsPayrollLocked(nextState);
    localStorage.setItem("hwb_attendo_locked", nextState ? "true" : "false");
    if (nextState) {
      toast.success("🔒 October 2026 Payroll Finalised & Locked! Attendance & advances cannot be tampered with.");
      logAction("Payroll Locked", "October 2026 Payroll marked Finalised & Closed", "PAYROLL");
    } else {
      toast.error("🔓 Payroll Unlocked for adjustments");
      logAction("Payroll Unlocked", "Admin unlocked payroll for adjustments", "PAYROLL");
    }
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
      status: "APPROVED"
    };

    saveLeaves([newLeave, ...leaves]);
    const updatedStaff = staff.map(s => s.id === targetMember.id ? { ...s, leaveBalance: Math.max(0, s.leaveBalance - daysNum) } : s);
    saveStaff(updatedStaff);
    setIsNewLeaveModalOpen(false);
    toast.success(`Leave added and approved for ${targetMember.name}`);
    logAction("Leave Applied", `${targetMember.name} - ${daysNum} days approved directly`, "LEAVE");
  };

  // Add New Staff
  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.monthlySalary) return toast.error("Enter staff details");

    const newMember: StaffMember = {
      id: "st-" + Date.now(),
      name: newStaffForm.name,
      role: newStaffForm.role as any || "Captain",
      department: newStaffForm.department as any || "Service",
      phone: newStaffForm.phone || "9800000000",
      monthlySalary: Number(newStaffForm.monthlySalary),
      dailyRate: Math.round(Number(newStaffForm.monthlySalary) / 30),
      joiningDate: todayStr,
      shiftTiming: newStaffForm.shiftTiming || "11:00 AM - 11:00 PM",
      leaveBalance: 5,
      heldArrears: 0,
      bankAccount: newStaffForm.bankAccount || "501004" + Math.floor(10000000 + Math.random() * 90000000),
      bankIFSC: newStaffForm.bankIFSC || "HDFC0001244"
    };

    const updated = [...staff, newMember];
    saveStaff(updated);
    setIsAddStaffModalOpen(false);
    setNewStaffForm({ name: "", role: "Captain", department: "Service", phone: "", monthlySalary: 14000 });
    toast.success(`New employee ${newMember.name} added!`);
    logAction("Staff Joined", `${newMember.name} (${newMember.role}) joined directory`, "SYSTEM");
  };

  // Continuous Payroll Math Engine
  const calculatePayrollForMember = (member: StaffMember) => {
    const rec = attendance[member.id];
    let payableDays = 30; // Standard Indian payroll denominator
    
    if (rec?.status === "ABSENT") payableDays = 29;
    else if (rec?.status === "HALF_DAY") payableDays = 29.5;

    const approvedPaidLeaves = leaves.filter(l => l.staffId === member.id && l.status === "APPROVED").reduce((acc, l) => acc + l.days, 0);
    const dayRate = member.monthlySalary / 30;
    const baseEarned = Math.round(dayRate * payableDays);

    const overtimeBonus = (rec?.overtimeHours || 0) * overtimeRules.ratePerHour;
    const latePenalty = rec?.latePenalty || 0;
    const messFee = overtimeRules.messDeduction;

    const staffAdvance = advances.find(a => a.staffId === member.id && a.remainingBalance > 0);
    const installmentDeduction = staffAdvance ? Math.min(staffAdvance.monthlyInstallment, staffAdvance.remainingBalance) : 0;

    const grossEarned = baseEarned + overtimeBonus;

    // Indian Compliance Deductions (Screenshots 2 & 3)
    let epfDeduction = 0;
    let esicDeduction = 0;
    let ptDeduction = 0;

    if (complianceMode === "STATUTORY") {
      epfDeduction = Math.round(Math.min(grossEarned, 15000) * 0.12); // 12% PF on max 15k
      esicDeduction = grossEarned <= 21000 ? Math.round(grossEarned * 0.0075) : 0; // 0.75% ESIC
      ptDeduction = selectedState === "Delhi" ? 0 : 200; // State PT
    }

    const netSalary = Math.max(0, grossEarned - latePenalty - messFee - installmentDeduction - epfDeduction - esicDeduction - ptDeduction);

    return {
      payableDays,
      approvedPaidLeaves,
      dayRate,
      baseEarned,
      overtimeBonus,
      latePenalty,
      installmentDeduction,
      grossEarned,
      epfDeduction,
      esicDeduction,
      ptDeduction,
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
      (payroll.installmentDeduction > 0 ? `*Advance Installment Deducted:* -₹${payroll.installmentDeduction.toLocaleString("en-IN")}\n` : '') +
      (complianceMode === "STATUTORY" ? `*EPF (12%):* -₹${payroll.epfDeduction} | *ESIC:* -₹${payroll.esicDeduction} | *PT:* -₹${payroll.ptDeduction}\n` : '') +
      (member.heldArrears > 0 ? `*Savings Balance with Owner (Arrears):* ₹${member.heldArrears.toLocaleString("en-IN")}\n` : '') +
      `--------------------------------\n` +
      `*NET TAKE-HOME: ₹${payroll.netSalary.toLocaleString("en-IN")}*\n` +
      `Status: ${isPayrollLocked ? 'FINALIZED & PROCESSED' : 'ESTIMATED'}\n` +
      `--------------------------------\n` +
      `Dhanyawad! Hotel White Bliss Management. 🙏`;

    window.open(`https://wa.me/91${cleanPhone || "7499934257"}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(`Opening WhatsApp Salary Slip for ${member.name}`);
    logAction("Payslip Sent", `WhatsApp slip sent to ${member.name}`, "PAYROLL");
  };

  // NEFT Bank Transfer Excel Export (Screenshot 1)
  const handleExportBankNEFT = () => {
    const headers = ["Beneficiary Name,Account Number,IFSC Code,Amount (INR),Transaction Type,Remarks"];
    const rows = staff.map(s => {
      const p = calculatePayrollForMember(s);
      return `"${s.name}","${s.bankAccount || '50100412345678'}","${s.bankIFSC || 'HDFC0001244'}",${p.netSalary},"NEFT","Salary ${new Date().toLocaleString("en-US", { month: "short", year: "numeric" })}"`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Hotel_White_Bliss_Bank_Payout_NEFT_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Bank Transfer Payout file generated for bulk upload!");
    logAction("Bank NEFT Exported", "Bulk NEFT file downloaded for online banking", "PAYROLL");
  };

  // Indian Labor Inspection Muster Roll (Form T) CSV (Screenshot 4)
  const handleExportMusterReport = () => {
    const daysHeader = Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`).join(",");
    const headers = [`Emp ID,Employee Name,Designation,Dept,${daysHeader},Total Present,Total Leaves,Payable Days`];
    
    const rows = staff.map(s => {
      const p = calculatePayrollForMember(s);
      const daysMarks = Array.from({ length: 31 }, (_, i) => {
        if (i % 7 === 0) return "WO"; // Weekly off
        if (s.id === "st-2" && i === 4) return "PL"; // Paid Leave
        if (s.id === "st-6" && i === 10) return "HD"; // Half day
        if (s.id === "st-7" && i === 11) return "A"; // Absent
        return "P";
      }).join(",");

      return `"${s.id}","${s.name}","${s.role}","${s.department}",${daysMarks},26,1,${p.payableDays}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Form_T_Indian_Inspection_Muster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Inspection-ready Muster Roll (Form T) downloaded!");
    logAction("Muster Form T Exported", "Indian Inspection Muster Roll exported", "SYSTEM");
  };

  // KPI Calculations
  const totalStaffCount = staff.length;
  const presentCount = Object.values(attendance).filter(a => a.status === "PRESENT").length;
  const halfDayCount = Object.values(attendance).filter(a => a.status === "HALF_DAY").length;
  const absentCount = Object.values(attendance).filter(a => a.status === "ABSENT").length;
  const pendingLeavesCount = leaves.filter(l => l.status === "PENDING").length;
  const totalAdvanceDeductionsMonth = staff.reduce((acc, s) => acc + calculatePayrollForMember(s).installmentDeduction, 0);
  const totalNetPayrollLiability = staff.reduce((acc, s) => acc + calculatePayrollForMember(s).netSalary, 0);
  const totalHeldArrearsAllStaff = staff.reduce((acc, s) => acc + s.heldArrears, 0);

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
              <div className="flex items-center gap-2">
                <h1 className="text-2xl sm:text-3xl font-black text-gray-900 tracking-tight">
                  Attendo HR & Payroll Suite
                </h1>
                <span className="text-xs bg-emerald-100 text-emerald-800 font-bold px-2.5 py-0.5 rounded-full border border-emerald-200">
                  Official Petpooja Attendo Matched
                </span>
                {isPayrollLocked && (
                  <span className="text-xs bg-amber-100 text-amber-900 font-extrabold px-2.5 py-0.5 rounded-full border border-amber-300 flex items-center gap-1">
                    <Lock size={12} /> Period Locked
                  </span>
                )}
              </div>
              <p className="text-sm text-gray-500 mt-1">
                Time & Attendance, Leave Approval, Advance Installments, Held Arrears, Form T Muster & Bank Payout
              </p>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Lock / Unlock Period Toggle (Screenshot 1) */}
          <button
            onClick={handleTogglePayrollLock}
            className={`flex items-center gap-2 px-3.5 py-2.5 rounded-xl text-xs font-bold transition shadow-xs ${
              isPayrollLocked 
                ? "bg-amber-50 text-amber-800 border border-amber-300 hover:bg-amber-100" 
                : "bg-gray-100 text-gray-700 border border-gray-200 hover:bg-gray-200"
            }`}
          >
            {isPayrollLocked ? <Lock size={15} /> : <Unlock size={15} />}
            {isPayrollLocked ? "Locked (Finalised)" : "Lock Payroll"}
          </button>

          {/* Arrears Modal Trigger (Screenshot 1) */}
          <button
            onClick={() => setIsArrearModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-indigo-50 hover:bg-indigo-100 text-indigo-700 border border-indigo-200 rounded-xl text-xs font-bold transition"
          >
            <DollarSign size={15} /> Khata / Arrears
          </button>

          <button
            onClick={() => setIsNewLeaveModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-purple-600 hover:bg-purple-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Calendar size={15} /> + Apply Leave
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
          >
            <CreditCard size={15} /> + Log Advance
          </button>

          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-gray-900 hover:bg-black text-white rounded-xl text-xs font-bold shadow-xs transition active:scale-95"
          >
            <Plus size={15} /> + Add Staff
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
          <p className="text-xs text-rose-600 mt-1">Auto-deducted from cycle</p>
        </div>

        {/* Held Arrears Khata (Screenshot 1) */}
        <div className="bg-indigo-50/70 border border-indigo-200 p-5 rounded-2xl shadow-sm relative overflow-hidden">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-bold uppercase tracking-wider text-indigo-900">Held Arrears</span>
            <div className="p-2 bg-indigo-600 text-white rounded-xl">
              <DollarSign size={17} />
            </div>
          </div>
          <div className="text-2xl sm:text-3xl font-extrabold text-indigo-900">
            ₹{totalHeldArrearsAllStaff.toLocaleString("en-IN")}
          </div>
          <p className="text-xs text-indigo-700 mt-1">Pending Staff Deposits</p>
        </div>
      </div>

      {/* Official Petpooja Attendo 9-Module Navigation Tabs */}
      <div className="border-b border-gray-200 overflow-x-auto pb-px">
        <div className="flex gap-1 min-w-max">
          <button
            onClick={() => setActiveTab("attendance")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "attendance"
                ? "border-blue-600 text-blue-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Clock size={16} /> 01 Time & Attendance
          </button>

          <button
            onClick={() => setActiveTab("shifts")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "shifts"
                ? "border-amber-600 text-amber-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Award size={16} /> 02 Shifts & Roster
          </button>

          <button
            onClick={() => setActiveTab("leaves")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "leaves"
                ? "border-purple-600 text-purple-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Calendar size={16} /> 03 Leave & Holidays ({leaves.length})
            {pendingLeavesCount > 0 && <span className="w-2 h-2 rounded-full bg-purple-600"></span>}
          </button>

          <button
            onClick={() => setActiveTab("advances")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "advances"
                ? "border-rose-600 text-rose-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <CreditCard size={16} /> 04 Advances ({advances.length})
          </button>

          <button
            onClick={() => setActiveTab("payroll")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "payroll"
                ? "border-emerald-600 text-emerald-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <DollarSign size={16} /> 04 Payroll & Payout
          </button>

          <button
            onClick={() => setActiveTab("penalties")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "penalties"
                ? "border-orange-600 text-orange-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <TrendingUp size={16} /> 05 Overtime & Penalties
          </button>

          <button
            onClick={() => setActiveTab("compliance")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "compliance"
                ? "border-cyan-600 text-cyan-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Percent size={16} /> 06 Compliance
          </button>

          <button
            onClick={() => setActiveTab("reports")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "reports"
                ? "border-violet-600 text-violet-600"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <FileSpreadsheet size={16} /> 08 Reports & Muster
          </button>

          <button
            onClick={() => setActiveTab("admin_control")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "admin_control"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Shield size={16} /> 09 Admin Control
          </button>

          <button
            onClick={() => setActiveTab("directory")}
            className={`pb-3 px-3 sm:px-4 font-bold text-xs sm:text-sm border-b-2 transition flex items-center gap-1.5 ${
              activeTab === "directory"
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-400 hover:text-gray-700"
            }`}
          >
            <Users size={16} /> Staff Directory
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
                Mark present, half-day, or absent. Overtime (+₹{overtimeRules.ratePerHour}/hr) and late penalties (₹{overtimeRules.latePenaltyAmount}) reflect automatically in the payroll.
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
                            title={`Add 1 Hour Overtime (+₹${overtimeRules.ratePerHour})`}
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
                            title={`Toggle Late Penalty (₹${overtimeRules.latePenaltyAmount})`}
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

      {/* TAB 2: 02 SHIFTS & ROSTER */}
      {activeTab === "shifts" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-amber-50/70 border border-amber-200 p-4 rounded-2xl flex items-start gap-3">
            <Award className="text-amber-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-amber-950 text-sm">Restaurant Shift Roster & Split Timing Config</h3>
              <p className="text-xs text-amber-800 mt-0.5 leading-relaxed">
                Configure specialized restaurant split shifts (lunch rush & dinner rush), continuous floor service, and morning preparation rosters.
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-amber-100 text-amber-800 rounded-md">Kitchen Split Shift</span>
              <h4 className="text-base font-bold text-gray-900">10:00 AM - 11:00 PM (Break 3 PM - 7 PM)</h4>
              <p className="text-xs text-gray-500">Staff Assigned: Ramesh Kumar (Head Chef), Manoj Patil (Tandoor Master)</p>
              <div className="pt-2 text-xs text-emerald-600 font-bold">✓ 4 Paid Week-Offs/month Included</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-blue-100 text-blue-800 rounded-md">Floor Service Shift</span>
              <h4 className="text-base font-bold text-gray-900">12:00 PM - 11:30 PM (Continuous)</h4>
              <p className="text-xs text-gray-500">Staff Assigned: Vikram Singh (Captain), Suresh Shinde (Captain)</p>
              <div className="pt-2 text-xs text-emerald-600 font-bold">✓ Overtime applicable after 11:30 PM</div>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm space-y-2">
              <span className="text-xs font-bold px-2.5 py-1 bg-green-100 text-green-800 rounded-md">Morning Prep & Housekeeping</span>
              <h4 className="text-base font-bold text-gray-900">09:30 AM - 10:30 PM</h4>
              <p className="text-xs text-gray-500">Staff Assigned: Ganesh Jadhav (Helper), Sandeep More (Dishwasher)</p>
              <div className="pt-2 text-xs text-emerald-600 font-bold">✓ Morning attendance punch sync</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: 03 LEAVE & HOLIDAYS */}
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

      {/* TAB 4: 04 ADVANCES & INSTALLMENTS */}
      {activeTab === "advances" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-rose-50/70 border border-rose-200 p-4 rounded-2xl flex items-start gap-3">
            <CreditCard className="text-rose-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-rose-950 text-sm">Log Advances & Automatic Installment Deductions</h3>
              <p className="text-xs text-rose-800 mt-0.5 leading-relaxed">
                Record each advance along with repayment installments. Each cycle's installment is automatically deducted until the loan clears!
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

      {/* TAB 5: 04 PAYROLL & PAYOUT (Matching Screenshot 1 & 4) */}
      {activeTab === "payroll" && (
        <div className="space-y-4 animate-in fade-in duration-200">
          <div className="bg-emerald-50/70 border border-emerald-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div className="flex items-start gap-3">
              <DollarSign className="text-emerald-700 mt-0.5 shrink-0" size={20} />
              <div>
                <h3 className="font-bold text-emerald-950 text-sm">
                  Payroll Ready Before Month-End {isPayrollLocked && "(LOCKED & FINALISED)"}
                </h3>
                <p className="text-xs text-emerald-800 mt-0.5 leading-relaxed">
                  Automatic installment deductions, arrears calculation, and continuous payroll. Numbers approved stay on record.
                </p>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBankNEFT}
                className="flex items-center gap-1.5 px-3 py-2 bg-emerald-700 hover:bg-emerald-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
              >
                <Download size={14} /> Bank Payout (NEFT File)
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Staff Member</th>
                  <th className="py-3.5 px-4 text-center">Monthly Base</th>
                  <th className="py-3.5 px-4 text-center">Payable Days</th>
                  <th className="py-3.5 px-4 text-center">Gross Earned</th>
                  <th className="py-3.5 px-4 text-center text-rose-600">Advance Deducted</th>
                  <th className="py-3.5 px-4 text-center text-indigo-700">Held Arrears</th>
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
                      <td className="py-4 px-4 text-center font-bold text-indigo-700 bg-indigo-50/30">
                        ₹{member.heldArrears.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-right font-black text-base text-emerald-700 bg-emerald-50/60">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-5 text-right">
                        <button
                          onClick={() => handleWhatsAppSalarySlip(member, p)}
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-[#25D366] hover:bg-[#1ebd5b] text-white text-xs font-bold rounded-xl shadow-xs transition active:scale-95"
                        >
                          <MessageCircle size={14} /> Send Slip
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

      {/* TAB 6: 05 OVERTIME & PENALTIES (Matching Screenshot 2) */}
      {activeTab === "penalties" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-orange-50/70 border border-orange-200 p-4 rounded-2xl flex items-start gap-3">
            <TrendingUp className="text-orange-700 mt-0.5 shrink-0" size={20} />
            <div>
              <h3 className="font-bold text-orange-950 text-sm">Overtime With Buffer & Rounding Intervals</h3>
              <p className="text-xs text-orange-800 mt-0.5 leading-relaxed">
                Set a grace window before overtime starts counting, and round to 15, 30, or 60-min intervals. Small overruns don't become payouts, and sustained extra hours are paid fairly.
              </p>
            </div>
          </div>

          {/* Perks & Penalties Summary Cards (From Screenshot 2 mockup) */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-emerald-600 uppercase tracking-wider block mb-1">Total Perks & OT</span>
              <div className="text-2xl font-black text-emerald-700">₹17,060</div>
              <p className="text-[11px] text-gray-400 mt-1">Dinner rush hours & festival bonus</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wider block mb-1">Total Penalties</span>
              <div className="text-2xl font-black text-rose-700">₹70</div>
              <p className="text-[11px] text-gray-400 mt-1">Late arrivals & shift delays</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-blue-600 uppercase tracking-wider block mb-1">Grace Window</span>
              <div className="text-2xl font-black text-gray-900">{overtimeRules.graceMinutes} Minutes</div>
              <p className="text-[11px] text-gray-400 mt-1">Buffer before OT starts counting</p>
            </div>

            <div className="bg-white p-5 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs font-bold text-purple-600 uppercase tracking-wider block mb-1">Rounding Interval</span>
              <div className="text-2xl font-black text-gray-900">{overtimeRules.roundingInterval} Min Round</div>
              <p className="text-[11px] text-gray-400 mt-1">Standardized clock rounding</p>
            </div>
          </div>

          {/* Detailed Statement Table (Matching Screenshot 2 Mockup) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Monthly Statements — Overtime & Penalties Log</h3>
              <span className="text-xs text-gray-400 font-medium">April 2026 - Live Period</span>
            </div>
            <div className="divide-y divide-gray-100 text-sm">
              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    +
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Perk — Head Chef Weekend Rush OT</div>
                    <div className="text-xs text-gray-400">20 Oct 2026 • 4 Extra Hours Dinner rush</div>
                  </div>
                </div>
                <div className="text-emerald-600 font-black text-base">+ ₹2,360</div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-rose-100 text-rose-700 flex items-center justify-center font-bold text-xs">
                    -
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Late Penalty — Manoj Patil (160 minutes late)</div>
                    <div className="text-xs text-gray-400">11 Oct 2026 • Shift delayed without prior intimation</div>
                  </div>
                </div>
                <div className="text-rose-600 font-black text-base">- ₹50</div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-gray-50">
                <div className="flex items-center gap-3">
                  <div className="w-8 h-8 rounded-full bg-emerald-100 text-emerald-700 flex items-center justify-center font-bold text-xs">
                    +
                  </div>
                  <div>
                    <div className="font-bold text-gray-900">Perk — Festival Full House Floor Service Bonus</div>
                    <div className="text-xs text-gray-400">10 Oct 2026 • Diwali Rush Incentive</div>
                  </div>
                </div>
                <div className="text-emerald-600 font-black text-base">+ ₹3,250</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: 06 STATUTORY COMPLIANCE (Matching Screenshot 3) */}
      {activeTab === "compliance" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-cyan-50/70 border border-cyan-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-cyan-950 text-sm">Indian Statutory Compliance (EPF, ESIC, PT, TDS)</h3>
              <p className="text-xs text-cyan-800 mt-0.5 leading-relaxed">
                Supports standard Indian statutory formulas (EPF 12%, ESIC 0.75%, State-wise PT) or Clean In-Hand Cash mode.
              </p>
            </div>

            <div className="flex items-center gap-2">
              <span className="text-xs font-bold text-gray-600">Mode:</span>
              <button
                onClick={() => setComplianceMode(complianceMode === "CASH_IN_HAND" ? "STATUTORY" : "CASH_IN_HAND")}
                className={`px-3 py-1.5 rounded-xl text-xs font-extrabold border transition ${
                  complianceMode === "STATUTORY"
                    ? "bg-cyan-600 text-white border-cyan-700 shadow-xs"
                    : "bg-white text-gray-700 border-gray-300"
                }`}
              >
                {complianceMode === "STATUTORY" ? "🏛️ Statutory Mode (PF/ESIC/PT)" : "💵 Clean In-Hand Cash Mode"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <h3 className="font-bold text-gray-900 text-sm">Compliance Payroll Breakdown</h3>
                <span className="text-xs text-gray-500">State PT: <strong>{selectedState} (₹200)</strong></span>
              </div>
              <select
                value={selectedState}
                onChange={e => setSelectedState(e.target.value)}
                className="text-xs font-semibold py-1.5 px-2.5 border border-gray-200 rounded-lg bg-gray-50"
              >
                <option value="Maharashtra">Maharashtra (PT ₹200)</option>
                <option value="Gujarat">Gujarat (PT ₹200)</option>
                <option value="Karnataka">Karnataka (PT ₹200)</option>
                <option value="Delhi">Delhi (PT ₹0)</option>
              </select>
            </div>

            <table className="w-full text-left text-sm">
              <thead className="bg-gray-50 text-gray-500 text-xs font-bold uppercase tracking-wider border-b border-gray-200">
                <tr>
                  <th className="py-3.5 px-5">Employee</th>
                  <th className="py-3.5 px-4 text-center">Gross Pay</th>
                  <th className="py-3.5 px-4 text-center">EPF (12%)</th>
                  <th className="py-3.5 px-4 text-center">ESIC (0.75%)</th>
                  <th className="py-3.5 px-4 text-center">Prof. Tax (PT)</th>
                  <th className="py-3.5 px-5 text-right font-black text-cyan-800">Net Take-Home</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {staff.map(s => {
                  const p = calculatePayrollForMember(s);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50/70 transition">
                      <td className="py-4 px-5">
                        <div className="font-bold text-gray-900">{s.name}</div>
                        <div className="text-xs text-gray-400">{s.role}</div>
                      </td>
                      <td className="py-4 px-4 text-center font-bold text-gray-900">
                        ₹{p.grossEarned.toLocaleString("en-IN")}
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-semibold text-rose-600">
                        {complianceMode === "STATUTORY" ? `-₹${p.epfDeduction}` : "₹0 (Exempt)"}
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-semibold text-rose-600">
                        {complianceMode === "STATUTORY" ? `-₹${p.esicDeduction}` : "₹0 (Exempt)"}
                      </td>
                      <td className="py-4 px-4 text-center text-xs font-semibold text-rose-600">
                        {complianceMode === "STATUTORY" ? `-₹${p.ptDeduction}` : "₹0"}
                      </td>
                      <td className="py-4 px-5 text-right font-black text-cyan-900 text-base">
                        ₹{p.netSalary.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: 08 REPORTS & INDIAN MUSTER (Matching Screenshot 4) */}
      {activeTab === "reports" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-violet-50/70 border border-violet-200 p-4 rounded-2xl flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-violet-950 text-sm">Reports & Inspection Muster (Form T)</h3>
              <p className="text-xs text-violet-800 mt-0.5 leading-relaxed">
                Download the official muster in the format Indian Labor Inspectors demand — full days, half days, absents, week-offs, and leaves.
              </p>
            </div>

            <button
              onClick={handleExportMusterReport}
              className="flex items-center gap-1.5 px-4 py-2 bg-violet-700 hover:bg-violet-800 text-white rounded-xl text-xs font-bold transition shadow-xs"
            >
              <Download size={14} /> Download Muster (Form T)
            </button>
          </div>

          {/* Today's Insights Card (From Screenshot 4 Mockup) */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block mb-1">Working / Present</span>
              <div className="text-2xl font-black text-emerald-600">{presentCount}</div>
              <p className="text-[11px] text-gray-400 mt-0.5">On floor & kitchen</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block mb-1">On Break / Half-Day</span>
              <div className="text-2xl font-black text-amber-500">{halfDayCount}</div>
              <p className="text-[11px] text-gray-400 mt-0.5">Split shift pause</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block mb-1">Time Off / Leaves</span>
              <div className="text-2xl font-black text-purple-600">{absentCount}</div>
              <p className="text-[11px] text-gray-400 mt-0.5">Approved medical/casual</p>
            </div>

            <div className="bg-white p-4 rounded-2xl border border-gray-200 shadow-sm">
              <span className="text-xs text-gray-500 font-bold block mb-1">Biometrics / Punch Left</span>
              <div className="text-2xl font-black text-blue-600">0</div>
              <p className="text-[11px] text-gray-400 mt-0.5">100% staff accounted</p>
            </div>
          </div>

          {/* Inspection Muster Table Preview */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-bold text-gray-900 text-sm">Muster Roll Preview — Form T Indian Inspection Standards</h3>
              <span className="text-xs text-gray-500 font-semibold">P = Present | HD = Half Day | WO = Week Off | A = Absent</span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-xs text-left">
                <thead className="bg-gray-50 text-gray-600 font-bold border-b border-gray-200">
                  <tr>
                    <th className="py-3 px-4 min-w-[150px]">Employee Name</th>
                    {Array.from({ length: 15 }, (_, i) => (
                      <th key={i} className="py-3 px-2 text-center">{i + 1}</th>
                    ))}
                    <th className="py-3 px-3 text-center bg-gray-100 font-black">Present</th>
                    <th className="py-3 px-3 text-center bg-gray-100 font-black">Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {staff.map(s => {
                    const p = calculatePayrollForMember(s);
                    return (
                      <tr key={s.id} className="hover:bg-gray-50">
                        <td className="py-3 px-4 font-bold text-gray-900">{s.name}</td>
                        {Array.from({ length: 15 }, (_, i) => {
                          const isWO = i % 7 === 0;
                          return (
                            <td key={i} className="py-3 px-2 text-center font-bold">
                              {isWO ? (
                                <span className="text-blue-500">WO</span>
                              ) : (
                                <span className="text-emerald-600">P</span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-3 px-3 text-center font-bold text-gray-900 bg-gray-50/50">13</td>
                        <td className="py-3 px-3 text-center font-black text-emerald-700 bg-emerald-50/40">{p.payableDays}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: 09 ADMIN CONTROL & AUDIT LOGS (Matching Screenshot 5) */}
      {activeTab === "admin_control" && (
        <div className="space-y-6 animate-in fade-in duration-200">
          <div className="bg-gray-900 text-white p-5 rounded-2xl flex items-start gap-3 shadow-sm">
            <Shield className="text-emerald-400 mt-0.5 shrink-0" size={22} />
            <div>
              <h3 className="font-bold text-base">User Management, Action-Level Rights & Activity Logs</h3>
              <p className="text-xs text-gray-300 mt-0.5 leading-relaxed">
                Control what staff can view, approve, or edit. Track every approval, loan installment, and payroll action with timestamp and actor name.
              </p>
            </div>
          </div>

          {/* Permissions Matrix */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100">
              <h4 className="font-bold text-gray-900 text-sm">Role-Based Permission Matrix</h4>
            </div>
            <table className="w-full text-left text-xs">
              <thead className="bg-gray-50 text-gray-500 uppercase font-bold border-b border-gray-200">
                <tr>
                  <th className="py-3 px-4">Role</th>
                  <th className="py-3 px-3 text-center">Attendance Punch</th>
                  <th className="py-3 px-3 text-center">Leave Approval</th>
                  <th className="py-3 px-3 text-center">Salary Advance</th>
                  <th className="py-3 px-3 text-center">Payroll Finalize</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                <tr>
                  <td className="py-3.5 px-4 font-bold text-gray-900">Hotel Owner (Superadmin)</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Full Access</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-gray-900">Restaurant Manager</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Mark & Edit</td>
                  <td className="py-3.5 px-3 text-center text-emerald-600 font-bold">✓ Approve/Reject</td>
                  <td className="py-3.5 px-3 text-center text-amber-600 font-semibold">View Only</td>
                  <td className="py-3.5 px-3 text-center text-rose-500 font-semibold">✕ No Access</td>
                </tr>
                <tr>
                  <td className="py-3.5 px-4 font-bold text-gray-900">Floor Captain</td>
                  <td className="py-3.5 px-3 text-center text-blue-600 font-semibold">Self Only</td>
                  <td className="py-3.5 px-3 text-center text-blue-600 font-semibold">Apply Only</td>
                  <td className="py-3.5 px-3 text-center text-rose-500 font-semibold">✕ No Access</td>
                  <td className="py-3.5 px-3 text-center text-rose-500 font-semibold">✕ No Access</td>
                </tr>
              </tbody>
            </table>
          </div>

          {/* Activity Logs (From Screenshot 5) */}
          <div className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden">
            <div className="p-4 border-b border-gray-100 flex items-center justify-between">
              <h4 className="font-bold text-gray-900 text-sm flex items-center gap-2">
                <Activity size={16} className="text-blue-600" />
                Immutable Activity & Audit Logs
              </h4>
              <span className="text-xs text-gray-400 font-semibold">{logs.length} logged actions</span>
            </div>

            <div className="divide-y divide-gray-100 max-h-96 overflow-y-auto">
              {logs.map(lg => (
                <div key={lg.id} className="p-4 flex items-start justify-between hover:bg-gray-50/70 transition">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-gray-900">{lg.action}</span>
                      <span className="text-[10px] bg-gray-100 text-gray-600 font-semibold px-2 py-0.5 rounded-full">
                        {lg.actor}
                      </span>
                    </div>
                    <p className="text-xs text-gray-600 mt-1">{lg.details}</p>
                  </div>
                  <span className="text-[11px] text-gray-400 font-medium whitespace-nowrap ml-4">
                    {lg.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: STAFF DIRECTORY */}
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
                  <div>🏦 Bank: <strong className="text-gray-700">{member.bankAccount} ({member.bankIFSC})</strong></div>
                  <div>💰 Held Arrears: <strong className="text-indigo-700">₹{member.heldArrears} with owner</strong></div>
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

      {/* MODAL 2: ARREARS / HELD SALARY KHATA (Screenshot 1) */}
      {isArrearModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-white rounded-3xl w-full max-w-md p-6 space-y-4 shadow-2xl">
            <h3 className="font-bold text-lg text-gray-900 flex items-center gap-2">
              <DollarSign className="text-indigo-600" /> Arrears & Held Salary Khata
            </h3>
            <p className="text-xs text-gray-500">
              Some staff keep a portion of their earned salary with the owner for village trips or lump-sum savings. Track pending arrears and settle in one go.
            </p>

            <form onSubmit={handleArrearSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-700 mb-1">Select Staff Member</label>
                <select
                  value={arrearForm.staffId}
                  onChange={e => setArrearForm({ ...arrearForm, staffId: e.target.value })}
                  required
                  className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                >
                  <option value="">-- Choose Staff --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>
                      {s.name} (Current Held Arrears: ₹{s.heldArrears})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Action</label>
                  <select
                    value={arrearForm.actionType}
                    onChange={e => setArrearForm({ ...arrearForm, actionType: e.target.value as any })}
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  >
                    <option value="HOLD">📥 Keep With Owner (Save)</option>
                    <option value="RELEASE">📤 Release & Pay to Staff</option>
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="e.g. 2000"
                    value={arrearForm.amount}
                    onChange={e => setArrearForm({ ...arrearForm, amount: e.target.value })}
                    required
                    className="w-full border border-gray-200 rounded-xl p-2.5 text-sm font-semibold focus:ring-2 focus:ring-indigo-500 outline-none"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArrearModalOpen(false)}
                  className="flex-1 py-3 bg-gray-100 hover:bg-gray-200 text-gray-700 font-bold rounded-xl text-sm"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-3 bg-indigo-600 hover:bg-indigo-700 text-white font-bold rounded-xl text-sm shadow-md"
                >
                  Confirm Khata Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 3: APPLY LEAVE */}
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

      {/* MODAL 4: ADD NEW STAFF MEMBER */}
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
