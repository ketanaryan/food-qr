"use client";

import React, { useState, useEffect } from "react";
import { 
  Users, UserCheck, Calendar, Clock, DollarSign, Plus, 
  Search, Download, MessageSquare, AlertCircle, CheckCircle2, 
  Trash2, Edit3, ArrowUpRight, ArrowDownRight, CreditCard, ChevronRight, Check,
  X, ShieldAlert, Award, FileText, CheckCircle, XCircle,
  Lock, Unlock, Shield, Activity, FileSpreadsheet, TrendingUp,
  Percent, Briefcase, Building2, Sparkles,
  ArrowRight, ArrowLeft, MoreHorizontal, User, Filter, Zap, RotateCcw, Minus
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
  heldArrears: number;
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
    heldArrears: 4000,
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
    reason: "Medical emergency (2 installments)"
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
    reason: "Vehicle maintenance"
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
    reason: "Family advance"
  }
];

const INITIAL_LEAVES: LeaveRequest[] = [
  {
    id: "lv-1",
    staffId: "st-3",
    staffName: "Vikram Singh",
    leaveType: "Sick Leave",
    startDate: "14 Oct 2026",
    endDate: "15 Oct 2026",
    days: 2,
    reason: "Viral fever; medical rest advised",
    status: "PENDING"
  },
  {
    id: "lv-2",
    staffId: "st-5",
    staffName: "Ganesh Jadhav",
    leaveType: "Casual Leave",
    startDate: "18 Oct 2026",
    endDate: "18 Oct 2026",
    days: 1,
    reason: "Family festival attendance",
    status: "PENDING"
  },
  {
    id: "lv-3",
    staffId: "st-2",
    staffName: "Manoj Patil",
    leaveType: "Casual Leave",
    startDate: "05 Oct 2026",
    endDate: "06 Oct 2026",
    days: 2,
    reason: "Family wedding event",
    status: "APPROVED"
  }
];

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
    actor: "System Scheduler",
    action: "Attendance Opened",
    details: "Standard daily attendance roster initialized for 7 employees",
    type: "ATTENDANCE"
  },
  {
    id: "log-4",
    timestamp: "11 Oct 2026, 11:30 PM",
    actor: "Manager",
    action: "Shift Closed",
    details: "Floor shift closed; 2 overtime hours logged for Head Chef",
    type: "SYSTEM"
  }
];

export default function AttendoPage() {
  const [staff, setStaff] = useState<StaffMember[]>([]);
  const [attendance, setAttendance] = useState<{ [staffId: string]: AttendanceRecord }>({});
  const [advances, setAdvances] = useState<SalaryAdvance[]>([]);
  const [leaves, setLeaves] = useState<LeaveRequest[]>([]);
  const [logs, setLogs] = useState<AuditLog[]>([]);
  
  const [activeTab, setActiveTab] = useState<
    "attendance" | "leaves" | "advances" | "payroll" | "penalties" | "compliance" | "reports" | "admin_control" | "shifts" | "directory"
  >("attendance");

  const [searchQuery, setSearchQuery] = useState("");
  const [departmentFilter, setDepartmentFilter] = useState("ALL");

  const [isPayrollLocked, setIsPayrollLocked] = useState(false);
  const [complianceMode, setComplianceMode] = useState<"CASH_IN_HAND" | "STATUTORY">("CASH_IN_HAND");
  const [selectedState, setSelectedState] = useState("Maharashtra");

  const [overtimeRules, setOvertimeRules] = useState({
    graceMinutes: 15,
    roundingInterval: 30,
    ratePerHour: 60,
    latePenaltyAmount: 50,
    offDayPaid: true,
    messDeduction: 0
  });

  const [isAdvanceModalOpen, setIsAdvanceModalOpen] = useState(false);
  const [isAddStaffModalOpen, setIsAddStaffModalOpen] = useState(false);
  const [isNewLeaveModalOpen, setIsNewLeaveModalOpen] = useState(false);
  const [isArrearModalOpen, setIsArrearModalOpen] = useState(false);

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

  const handleSetStatus = (staffId: string, status: "PRESENT" | "HALF_DAY" | "ABSENT" | "PAID_LEAVE") => {
    if (isPayrollLocked) {
      return toast.error("Payroll period is finalised and locked.");
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
    toast.success(`${member?.name} marked ${status.replace("_", " ")}.`);
    logAction("Attendance Updated", `${member?.name} marked as ${status}`, "ATTENDANCE");
  };

  const handleMarkAllPresent = () => {
    if (isPayrollLocked) {
      return toast.error("Payroll period is finalised and locked.");
    }
    const updated = { ...attendance };
    staff.forEach(s => {
      updated[s.id] = {
        staffId: s.id,
        date: todayStr,
        status: "PRESENT",
        inTime: attendance[s.id]?.inTime && attendance[s.id]?.inTime !== "--" ? attendance[s.id].inTime : "10:00 AM",
        overtimeHours: attendance[s.id]?.overtimeHours || 0,
        latePenalty: attendance[s.id]?.latePenalty || 0
      };
    });
    saveAttendance(updated);
    toast.success(`Marked all ${staff.length} staff members as PRESENT.`);
    logAction("Bulk Attendance", `Owner marked all ${staff.length} staff as Present for ${todayStr}`, "ATTENDANCE");
  };

  const handleMarkAllAbsent = () => {
    if (isPayrollLocked) {
      return toast.error("Payroll period is finalised and locked.");
    }
    const updated = { ...attendance };
    staff.forEach(s => {
      updated[s.id] = {
        staffId: s.id,
        date: todayStr,
        status: "ABSENT",
        inTime: "--",
        overtimeHours: 0,
        latePenalty: 0
      };
    });
    saveAttendance(updated);
    toast.success("Attendance register reset for today.");
    logAction("Attendance Reset", "Owner cleared daily register", "ATTENDANCE");
  };

  const handleUpdateInTime = (staffId: string, time: string) => {
    if (isPayrollLocked) return toast.error("Payroll period is locked.");
    const current = attendance[staffId] || { staffId, date: todayStr, status: "PRESENT", inTime: "10:00 AM", overtimeHours: 0, latePenalty: 0 };
    const updated = {
      ...attendance,
      [staffId]: {
        ...current,
        inTime: time
      }
    };
    saveAttendance(updated);
  };

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
    toast.success(`+1 Hour Overtime logged for ${member?.name}.`);
    logAction("Overtime Logged", `+1 Hour OT granted to ${member?.name}`, "ATTENDANCE");
  };

  const handleSubtractOvertime = (staffId: string) => {
    if (isPayrollLocked) return toast.error("Payroll period is locked.");
    const current = attendance[staffId] || { staffId, date: todayStr, status: "PRESENT", inTime: "10:00 AM", overtimeHours: 0, latePenalty: 0 };
    if (current.overtimeHours <= 0) return;
    const updated = {
      ...attendance,
      [staffId]: {
        ...current,
        overtimeHours: current.overtimeHours - 1
      }
    };
    saveAttendance(updated);
    const member = staff.find(s => s.id === staffId);
    toast.success(`Overtime adjusted for ${member?.name}.`);
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
    toast.success(newPenalty > 0 ? `Late penalty (₹${overtimeRules.latePenaltyAmount}) applied to ${member?.name}.` : `Penalty waived for ${member?.name}.`);
    logAction("Late Penalty", `${member?.name}: ${newPenalty > 0 ? 'Deducted ₹50' : 'Waived'}`, "ATTENDANCE");
  };

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
      toast.success(`Leave approved for ${targetLeave.staffName} (${targetLeave.days} days).`);
      logAction("Leave Approved", `${targetLeave.staffName} - ${targetLeave.days} Days (${targetLeave.leaveType})`, "LEAVE");
    } else {
      toast.error(`Leave request rejected for ${targetLeave.staffName}.`);
      logAction("Leave Rejected", `${targetLeave.staffName} request declined`, "LEAVE");
    }
  };

  const handleAdvanceSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = staff.find(s => s.id === advanceForm.staffId);
    if (!targetMember) return toast.error("Select an employee.");
    const totalAmt = parseFloat(advanceForm.totalLoanAmount);
    if (isNaN(totalAmt) || totalAmt <= 0) return toast.error("Enter a valid advance amount.");
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
      reason: advanceForm.reason || "Staff Advance"
    };

    saveAdvances([newAdvance, ...advances]);
    setIsAdvanceModalOpen(false);
    setAdvanceForm({ staffId: "", totalLoanAmount: "", monthlyInstallment: "", mode: "CASH", reason: "" });
    toast.success(`₹${totalAmt} advance scheduled for ${targetMember.name}.`);
    logAction("Advance Scheduled", `₹${totalAmt} advance to ${targetMember.name}`, "ADVANCE");
  };

  const handleArrearSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = staff.find(s => s.id === arrearForm.staffId);
    if (!targetMember) return toast.error("Select an employee.");
    const amt = parseFloat(arrearForm.amount);
    if (isNaN(amt) || amt <= 0) return toast.error("Enter a valid amount.");

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
    const actionLabel = arrearForm.actionType === "HOLD" ? "Held in Khata" : "Released to Employee";
    toast.success(`₹${amt} ${actionLabel} for ${targetMember.name}.`);
    logAction("Arrears Updated", `${targetMember.name}: ₹${amt} ${actionLabel}`, "PAYROLL");
    setArrearForm({ staffId: "", amount: "", actionType: "HOLD", notes: "" });
  };

  const handleTogglePayrollLock = () => {
    const nextState = !isPayrollLocked;
    setIsPayrollLocked(nextState);
    localStorage.setItem("hwb_attendo_locked", nextState ? "true" : "false");
    if (nextState) {
      toast.success("Payroll period locked. Record finalized.");
      logAction("Payroll Locked", "October 2026 Payroll finalized & locked", "PAYROLL");
    } else {
      toast.error("Payroll period unlocked for adjustments.");
      logAction("Payroll Unlocked", "Admin unlocked payroll for adjustments", "PAYROLL");
    }
  };

  const handleNewLeaveSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const targetMember = staff.find(s => s.id === leaveForm.staffId);
    if (!targetMember) return toast.error("Select an employee.");
    const daysNum = parseInt(leaveForm.days) || 1;

    const newLeave: LeaveRequest = {
      id: "lv-" + Date.now(),
      staffId: targetMember.id,
      staffName: targetMember.name,
      leaveType: leaveForm.leaveType,
      startDate: leaveForm.startDate || todayStr,
      endDate: leaveForm.endDate || todayStr,
      days: daysNum,
      reason: leaveForm.reason || "Personal Leave",
      status: "APPROVED"
    };

    saveLeaves([newLeave, ...leaves]);
    const updatedStaff = staff.map(s => s.id === targetMember.id ? { ...s, leaveBalance: Math.max(0, s.leaveBalance - daysNum) } : s);
    saveStaff(updatedStaff);
    setIsNewLeaveModalOpen(false);
    toast.success(`Leave logged and approved for ${targetMember.name}.`);
    logAction("Leave Applied", `${targetMember.name}: ${daysNum} days recorded`, "LEAVE");
  };

  const handleAddStaffSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStaffForm.name || !newStaffForm.monthlySalary) return toast.error("Provide employee details.");

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
    toast.success(`Employee ${newMember.name} added to directory.`);
    logAction("Staff Joined", `${newMember.name} (${newMember.role}) added to directory`, "SYSTEM");
  };

  const calculatePayrollForMember = (member: StaffMember) => {
    const rec = attendance[member.id];
    let payableDays = 30;
    
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

    let epfDeduction = 0;
    let esicDeduction = 0;
    let ptDeduction = 0;

    if (complianceMode === "STATUTORY") {
      epfDeduction = Math.round(Math.min(grossEarned, 15000) * 0.12);
      esicDeduction = grossEarned <= 21000 ? Math.round(grossEarned * 0.0075) : 0;
      ptDeduction = selectedState === "Delhi" ? 0 : 200;
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

  const handleWhatsAppSalarySlip = (member: StaffMember, payroll: any) => {
    const cleanPhone = member.phone.replace(/\D/g, "");
    const msg = `*HOTEL WHITE BLISS — SALARY SLIP*\n` +
      `--------------------------------\n` +
      `*Employee:* ${member.name} (${member.role})\n` +
      `*Period:* ${new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}\n` +
      `--------------------------------\n` +
      `*Base Salary:* ₹${member.monthlySalary.toLocaleString("en-IN")}\n` +
      `*Payable Days:* ${payroll.payableDays} / 30 Days\n` +
      `*Gross Earned:* ₹${payroll.grossEarned.toLocaleString("en-IN")}\n` +
      (payroll.overtimeBonus > 0 ? `*Overtime Bonus (+):* ₹${payroll.overtimeBonus}\n` : '') +
      (payroll.latePenalty > 0 ? `*Late Penalty (-):* ₹${payroll.latePenalty}\n` : '') +
      (payroll.installmentDeduction > 0 ? `*Advance Installment:* -₹${payroll.installmentDeduction.toLocaleString("en-IN")}\n` : '') +
      (complianceMode === "STATUTORY" ? `*Statutory Deductions (EPF/ESIC/PT):* -₹${payroll.epfDeduction + payroll.esicDeduction + payroll.ptDeduction}\n` : '') +
      (member.heldArrears > 0 ? `*Held Balance (Khata):* ₹${member.heldArrears.toLocaleString("en-IN")}\n` : '') +
      `--------------------------------\n` +
      `*NET PAYABLE: ₹${payroll.netSalary.toLocaleString("en-IN")}*\n` +
      `*Status:* ${isPayrollLocked ? 'APPROVED & PROCESSED' : 'CALCULATED'}\n` +
      `--------------------------------\n` +
      `Hotel White Bliss Management.`;

    window.open(`https://wa.me/91${cleanPhone || "7499934257"}?text=${encodeURIComponent(msg)}`, "_blank");
    toast.success(`Salary slip opened for ${member.name}.`);
    logAction("Payslip Generated", `WhatsApp slip sent to ${member.name}`, "PAYROLL");
  };

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
    link.setAttribute("download", `Bank_Payout_NEFT_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Bank NEFT file downloaded.");
    logAction("Bank NEFT Exported", "Bulk NEFT file downloaded", "PAYROLL");
  };

  const handleExportMusterReport = () => {
    const daysHeader = Array.from({ length: 31 }, (_, i) => `Day ${i + 1}`).join(",");
    const headers = [`Emp ID,Employee Name,Designation,Dept,${daysHeader},Total Present,Total Leaves,Payable Days`];
    
    const rows = staff.map(s => {
      const p = calculatePayrollForMember(s);
      const daysMarks = Array.from({ length: 31 }, (_, i) => {
        if (i % 7 === 0) return "WO";
        if (s.id === "st-2" && i === 4) return "PL";
        if (s.id === "st-6" && i === 10) return "HD";
        if (s.id === "st-7" && i === 11) return "A";
        return "P";
      }).join(",");

      return `"${s.id}","${s.name}","${s.role}","${s.department}",${daysMarks},26,1,${p.payableDays}`;
    });

    const csvContent = "data:text/csv;charset=utf-8," + [headers, ...rows].join("\n");
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `Form_T_Inspection_Muster_${new Date().toISOString().split("T")[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    toast.success("Muster Roll (Form T) downloaded.");
    logAction("Muster Form T Exported", "Form T Muster Roll exported", "SYSTEM");
  };

  const totalStaffCount = staff.length;
  const presentCount = Object.values(attendance).filter(a => a.status === "PRESENT").length;
  const halfDayCount = Object.values(attendance).filter(a => a.status === "HALF_DAY").length;
  const absentCount = Object.values(attendance).filter(a => a.status === "ABSENT").length;
  const paidLeaveCount = Object.values(attendance).filter(a => a.status === "PAID_LEAVE").length;
  const pendingLeavesCount = leaves.filter(l => l.status === "PENDING").length;
  const totalAdvanceDeductionsMonth = staff.reduce((acc, s) => acc + calculatePayrollForMember(s).installmentDeduction, 0);
  const totalNetPayrollLiability = staff.reduce((acc, s) => acc + calculatePayrollForMember(s).netSalary, 0);
  const totalHeldArrearsAllStaff = staff.reduce((acc, s) => acc + s.heldArrears, 0);

  // Daily floor wage calculation for today
  const todayEstimatedWages = staff.reduce((acc, s) => {
    const rec = attendance[s.id];
    const multiplier = rec?.status === "PRESENT" ? 1 : rec?.status === "HALF_DAY" ? 0.5 : rec?.status === "PAID_LEAVE" ? 1 : 0;
    const dayPay = Math.round(s.dailyRate * multiplier);
    const otPay = (rec?.overtimeHours || 0) * overtimeRules.ratePerHour;
    const penalty = rec?.latePenalty || 0;
    return acc + Math.max(0, dayPay + otPay - penalty);
  }, 0);

  const totalTodayOvertimeHours = Object.values(attendance).reduce((acc, a) => acc + (a.overtimeHours || 0), 0);
  const totalTodayLatePenalties = Object.values(attendance).reduce((acc, a) => acc + (a.latePenalty || 0), 0);

  const filteredStaff = staff.filter(s => {
    const matchesDept = departmentFilter === "ALL" || s.department === departmentFilter;
    const matchesSearch = s.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
                          s.role.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesDept && matchesSearch;
  });

  return (
    <div className="p-4 sm:p-8 max-w-7xl mx-auto space-y-6 font-sans antialiased text-zinc-900">
      
      {/* Executive Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200">
        <div>
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-zinc-900 text-white flex items-center justify-center shadow-xs">
              <UserCheck size={20} strokeWidth={2} />
            </div>
            <div>
              <div className="flex items-center gap-2.5">
                <h1 className="text-xl sm:text-2xl font-semibold tracking-tight text-zinc-900">
                  Staff & Payroll Engine
                </h1>
                <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-zinc-100 text-zinc-600 border border-zinc-200">
                  Attendo Enterprise
                </span>
                {isPayrollLocked && (
                  <span className="text-[11px] font-semibold tracking-wide uppercase px-2 py-0.5 rounded-md bg-amber-50 text-amber-800 border border-amber-200/80 flex items-center gap-1">
                    <Lock size={11} strokeWidth={2} /> Finalized
                  </span>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5 font-normal">
                Fast owner manual register, advance schedules, continuous payroll & statutory ledger
              </p>
            </div>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex flex-wrap items-center gap-2">
          <button
            onClick={handleMarkAllPresent}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-medium transition shadow-xs"
            title="Mark all staff members present in 1 click"
          >
            <Zap size={14} strokeWidth={2} />
            <span>Mark All Present</span>
          </button>

          <button
            onClick={handleTogglePayrollLock}
            className={`inline-flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition border shadow-2xs ${
              isPayrollLocked 
                ? "bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100" 
                : "bg-white text-zinc-700 border-zinc-200 hover:bg-zinc-50"
            }`}
          >
            {isPayrollLocked ? <Lock size={14} strokeWidth={1.75} /> : <Unlock size={14} strokeWidth={1.75} />}
            <span>{isPayrollLocked ? "Period Locked" : "Lock Period"}</span>
          </button>

          <button
            onClick={() => setIsArrearModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-medium transition shadow-2xs"
          >
            <DollarSign size={14} strokeWidth={1.75} className="text-zinc-500" />
            <span>Held Arrears</span>
          </button>

          <button
            onClick={() => setIsNewLeaveModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-medium transition shadow-2xs"
          >
            <Calendar size={14} strokeWidth={1.75} className="text-zinc-500" />
            <span>Apply Leave</span>
          </button>

          <button
            onClick={() => setIsAdvanceModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-zinc-50 text-zinc-700 border border-zinc-200 rounded-lg text-xs font-medium transition shadow-2xs"
          >
            <CreditCard size={14} strokeWidth={1.75} className="text-zinc-500" />
            <span>Schedule Advance</span>
          </button>

          <button
            onClick={() => setIsAddStaffModalOpen(true)}
            className="inline-flex items-center gap-1.5 px-3.5 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-medium transition shadow-xs"
          >
            <Plus size={14} strokeWidth={2} />
            <span>Add Member</span>
          </button>
        </div>
      </div>

      {/* KPI Metric Strip */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-3">
        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Total Staff</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Users size={14} strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums">
              {totalStaffCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Active directory roster</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Present Today</span>
            <div className="w-7 h-7 rounded-lg bg-emerald-50 text-emerald-700 flex items-center justify-center border border-emerald-100">
              <CheckCircle2 size={14} strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums flex items-baseline gap-1">
              <span>{presentCount}</span>
              <span className="text-xs text-zinc-400 font-normal">/ {totalStaffCount}</span>
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {halfDayCount > 0 ? `${halfDayCount} half-day · ` : ""}{absentCount} absent
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Pending Leaves</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <Calendar size={14} strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums">
              {pendingLeavesCount}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">
              {pendingLeavesCount > 0 ? "Awaiting review" : "All records clear"}
            </p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Advance Deducted</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <CreditCard size={14} strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums">
              ₹{totalAdvanceDeductionsMonth.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Auto-deducted this cycle</p>
          </div>
        </div>

        <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400">Held Arrears</span>
            <div className="w-7 h-7 rounded-lg bg-zinc-100 text-zinc-600 flex items-center justify-center">
              <DollarSign size={14} strokeWidth={1.75} />
            </div>
          </div>
          <div>
            <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums">
              ₹{totalHeldArrearsAllStaff.toLocaleString("en-IN")}
            </div>
            <p className="text-[11px] text-zinc-500 mt-0.5">Retained staff deposit</p>
          </div>
        </div>
      </div>

      {/* Enterprise Tab Navigation */}
      <div className="border-b border-zinc-200">
        <div className="flex items-center gap-1 overflow-x-auto pb-px">
          {[
            { id: "attendance", label: "Time & Attendance", icon: Clock },
            { id: "shifts", label: "Shifts & Roster", icon: Award },
            { id: "leaves", label: "Leave & Holidays", icon: Calendar, badge: pendingLeavesCount },
            { id: "advances", label: "Advances & Khata", icon: CreditCard, badge: advances.length },
            { id: "payroll", label: "Payroll & Payout", icon: DollarSign },
            { id: "penalties", label: "Overtime & Penalties", icon: TrendingUp },
            { id: "compliance", label: "Compliance & Taxes", icon: Percent },
            { id: "reports", label: "Muster & Reports", icon: FileSpreadsheet },
            { id: "admin_control", label: "Admin Control", icon: Shield },
            { id: "directory", label: "Directory", icon: Users }
          ].map(tab => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`py-3 px-3.5 text-xs font-medium border-b-2 transition flex items-center gap-2 whitespace-nowrap ${
                  isActive
                    ? "border-zinc-900 text-zinc-900 font-semibold"
                    : "border-transparent text-zinc-500 hover:text-zinc-800"
                }`}
              >
                <Icon size={14} strokeWidth={isActive ? 2 : 1.75} className={isActive ? "text-zinc-900" : "text-zinc-400"} />
                <span>{tab.label}</span>
                {typeof tab.badge === "number" && tab.badge > 0 && (
                  <span className={`text-[10px] font-semibold px-1.5 py-0.2 rounded-full ${
                    isActive ? "bg-zinc-900 text-white" : "bg-zinc-100 text-zinc-600"
                  }`}>
                    {tab.badge}
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>

      {/* TAB 1: TIME & ATTENDANCE */}
      {activeTab === "attendance" && (
        <div className="space-y-6">
          
          {/* Executive Floor Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            
            {/* Card 1: Fast Owner Register */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                    <Zap size={14} className="text-emerald-600" /> Owner Fast Register
                  </span>
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200/60">
                    Manual Mode
                  </span>
                </div>
                <h4 className="font-semibold text-zinc-900 text-sm">One-Tap Floor Attendance</h4>
                <p className="text-xs text-zinc-500 mt-1 leading-relaxed">
                  Mark entire floor present in 1 tap. No employee punching or biometric friction needed.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center gap-2">
                <button
                  onClick={handleMarkAllPresent}
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
                >
                  <Zap size={13} strokeWidth={2.5} />
                  <span>Mark All Present ({staff.length})</span>
                </button>
                <button
                  onClick={handleMarkAllAbsent}
                  className="px-2.5 py-2 bg-zinc-100 hover:bg-zinc-200 text-zinc-600 rounded-lg text-xs font-medium transition"
                  title="Reset daily register to absent"
                >
                  <RotateCcw size={13} />
                </button>
              </div>
            </div>

            {/* Card 2: Daily Floor Wage Liability */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                    <DollarSign size={14} className="text-zinc-600" /> Today's Floor Wages
                  </span>
                  <span className="text-[11px] font-mono text-zinc-400">{todayStr}</span>
                </div>
                <div className="text-2xl font-semibold tracking-tight text-zinc-900 font-mono tabular-nums">
                  ₹{todayEstimatedWages.toLocaleString("en-IN")}
                </div>
                <p className="text-xs text-zinc-500 mt-1">
                  Estimated floor salary liability for active duty staff today.
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 flex items-center justify-between text-[11px] text-zinc-500">
                <span>OT Bonus: <strong className="text-zinc-800 font-mono">+₹{totalTodayOvertimeHours * overtimeRules.ratePerHour}</strong></span>
                <span>Late Penalty: <strong className="text-rose-700 font-mono">-₹{totalTodayLatePenalties}</strong></span>
              </div>
            </div>

            {/* Card 3: Floor Attendance Tally */}
            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col justify-between">
              <div>
                <div className="flex items-center justify-between mb-2.5">
                  <span className="text-[11px] uppercase tracking-wider text-zinc-500 font-semibold flex items-center gap-1.5">
                    <UserCheck size={14} className="text-zinc-600" /> Floor Tally
                  </span>
                  <span className="text-xs font-mono font-semibold text-zinc-700">
                    {presentCount + halfDayCount} / {staff.length} on duty
                  </span>
                </div>

                <div className="grid grid-cols-4 gap-2 pt-1 text-center">
                  <div className="bg-emerald-50/60 border border-emerald-100 p-2 rounded-lg">
                    <div className="text-base font-semibold text-emerald-800 font-mono">{presentCount}</div>
                    <div className="text-[10px] text-emerald-700 font-medium">Present</div>
                  </div>
                  <div className="bg-amber-50/60 border border-amber-100 p-2 rounded-lg">
                    <div className="text-base font-semibold text-amber-800 font-mono">{halfDayCount}</div>
                    <div className="text-[10px] text-amber-700 font-medium">Half Day</div>
                  </div>
                  <div className="bg-rose-50/60 border border-rose-100 p-2 rounded-lg">
                    <div className="text-base font-semibold text-rose-800 font-mono">{absentCount}</div>
                    <div className="text-[10px] text-rose-700 font-medium">Absent</div>
                  </div>
                  <div className="bg-blue-50/60 border border-blue-100 p-2 rounded-lg">
                    <div className="text-base font-semibold text-blue-800 font-mono">{paidLeaveCount}</div>
                    <div className="text-[10px] text-blue-700 font-medium">Leave</div>
                  </div>
                </div>
              </div>

              <div className="mt-4 pt-3 border-t border-zinc-100 text-[11px] text-zinc-400">
                100% Floor staff accounted for in register
              </div>
            </div>

          </div>

          {/* Roster Controls Header */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">
                Daily Attendance Register · <span className="text-zinc-600 font-mono">{todayStr}</span>
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Toggle status, adjust reporting in-time, add overtime (+₹60/h) or apply late penalty (-₹50).
              </p>
            </div>
            <div className="flex items-center gap-2">
              <button
                onClick={handleMarkAllPresent}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-700 text-white rounded-lg text-xs font-semibold transition shadow-2xs"
              >
                <Zap size={13} strokeWidth={2.5} />
                <span>Mark All Present</span>
              </button>
              <div className="text-xs text-zinc-600 font-medium bg-zinc-50 px-3 py-1.5 rounded-lg border border-zinc-200">
                <span className="font-semibold text-zinc-900 font-mono">{presentCount}</span> of {staff.length} Present
              </div>
            </div>
          </div>

          {/* Table */}
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-zinc-50/75 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider border-b border-zinc-200/80">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Role & Shift</th>
                    <th className="py-3 px-3">In-Time</th>
                    <th className="py-3 px-3 text-center">Overtime (+₹60/h)</th>
                    <th className="py-3 px-3 text-center">Late Penalty (-₹50)</th>
                    <th className="py-3 px-3 text-right">Today's Wage</th>
                    <th className="py-3 px-4 text-right">Attendance Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {staff.map(member => {
                    const rec = attendance[member.id] || {
                      status: "PRESENT",
                      inTime: "10:00 AM",
                      overtimeHours: 0,
                      latePenalty: 0
                    };

                    const multiplier = rec.status === "PRESENT" ? 1 : rec.status === "HALF_DAY" ? 0.5 : rec.status === "PAID_LEAVE" ? 1 : 0;
                    const dayPay = Math.round(member.dailyRate * multiplier);
                    const otPay = rec.overtimeHours * overtimeRules.ratePerHour;
                    const penalty = rec.latePenalty;
                    const todayEarned = Math.max(0, dayPay + otPay - penalty);

                    return (
                      <tr key={member.id} className="hover:bg-zinc-50/50 transition-colors">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-900">{member.name}</div>
                          <div className="text-[11px] text-zinc-400 font-mono mt-0.5">{member.phone}</div>
                        </td>
                        <td className="py-3.5 px-3">
                          <span className="font-medium text-zinc-800">{member.role}</span>
                          <span className="text-[11px] text-zinc-400 block mt-0.5">{member.shiftTiming}</span>
                        </td>
                        <td className="py-3.5 px-3">
                          <input
                            type="text"
                            value={rec.inTime}
                            onChange={e => handleUpdateInTime(member.id, e.target.value)}
                            className="w-24 text-center font-mono py-1 px-2 bg-zinc-50 hover:bg-white border border-zinc-200 rounded text-xs text-zinc-800 focus:outline-none focus:ring-1 focus:ring-zinc-900 transition"
                          />
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <div className="inline-flex items-center gap-1 bg-zinc-50 border border-zinc-200 rounded-lg p-0.5">
                            {rec.overtimeHours > 0 && (
                              <button
                                onClick={() => handleSubtractOvertime(member.id)}
                                className="w-6 h-6 flex items-center justify-center text-zinc-500 hover:text-zinc-800 hover:bg-zinc-200 rounded transition"
                                title="Decrease OT"
                              >
                                <Minus size={11} strokeWidth={2} />
                              </button>
                            )}
                            <span className="px-2 py-0.5 font-mono text-xs font-semibold text-zinc-800 min-w-[36px] text-center">
                              +{rec.overtimeHours}h
                            </span>
                            <button
                              onClick={() => handleAddOvertime(member.id)}
                              className="w-6 h-6 flex items-center justify-center text-zinc-700 hover:text-zinc-900 hover:bg-zinc-200 rounded transition text-xs font-semibold"
                              title="Add 1 Hour Overtime (+₹60)"
                            >
                              +
                            </button>
                          </div>
                        </td>
                        <td className="py-3.5 px-3 text-center">
                          <button
                            onClick={() => handleToggleLatePenalty(member.id)}
                            className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition border ${
                              rec.latePenalty > 0
                                ? "bg-rose-50 text-rose-700 border-rose-200 font-semibold"
                                : "bg-zinc-50 text-zinc-600 border-zinc-200 hover:bg-zinc-100"
                            }`}
                            title="Toggle Late Penalty (₹50)"
                          >
                            {rec.latePenalty > 0 ? "Late (-₹50)" : "On Time"}
                          </button>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <div className="font-mono font-semibold text-zinc-900">
                            ₹{todayEarned.toLocaleString("en-IN")}
                          </div>
                          <div className="text-[10px] text-zinc-400 font-mono">
                            rate: ₹{member.dailyRate}/d
                          </div>
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <div className="inline-flex p-0.5 bg-zinc-100 rounded-lg border border-zinc-200/60">
                            <button
                              onClick={() => handleSetStatus(member.id, "PRESENT")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                rec.status === "PRESENT"
                                  ? "bg-white text-emerald-800 shadow-2xs font-semibold"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Present
                            </button>
                            <button
                              onClick={() => handleSetStatus(member.id, "HALF_DAY")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                rec.status === "HALF_DAY"
                                  ? "bg-white text-amber-800 shadow-2xs font-semibold"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Half
                            </button>
                            <button
                              onClick={() => handleSetStatus(member.id, "ABSENT")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                rec.status === "ABSENT"
                                  ? "bg-white text-rose-800 shadow-2xs font-semibold"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Absent
                            </button>
                            <button
                              onClick={() => handleSetStatus(member.id, "PAID_LEAVE")}
                              className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition ${
                                rec.status === "PAID_LEAVE"
                                  ? "bg-white text-blue-800 shadow-2xs font-semibold"
                                  : "text-zinc-500 hover:text-zinc-900"
                              }`}
                            >
                              Leave
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
      )}

      {/* TAB 2: SHIFTS & ROSTER */}
      {activeTab === "shifts" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">Kitchen Split Shift</span>
              <h4 className="text-sm font-semibold text-zinc-900 font-mono">10:00 AM – 11:00 PM (Break 3 PM – 7 PM)</h4>
              <p className="text-xs text-zinc-500">Staff Assigned: Ramesh Kumar, Manoj Patil</p>
              <div className="pt-2 text-[11px] text-zinc-600 font-medium">Standard 4 Paid Week-Offs included</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">Floor Service Shift</span>
              <h4 className="text-sm font-semibold text-zinc-900 font-mono">12:00 PM – 11:30 PM (Continuous)</h4>
              <p className="text-xs text-zinc-500">Staff Assigned: Vikram Singh, Suresh Shinde</p>
              <div className="pt-2 text-[11px] text-zinc-600 font-medium">Overtime applicable post-shift</div>
            </div>

            <div className="bg-white p-5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-2">
              <span className="text-[11px] font-semibold uppercase tracking-wider text-zinc-500 block">Prep & Sanitation</span>
              <h4 className="text-sm font-semibold text-zinc-900 font-mono">09:30 AM – 10:30 PM</h4>
              <p className="text-xs text-zinc-500">Staff Assigned: Ganesh Jadhav, Sandeep More</p>
              <div className="pt-2 text-[11px] text-zinc-600 font-medium">Morning check-in sync enabled</div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 3: LEAVE & HOLIDAYS */}
      {activeTab === "leaves" && (
        <div className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {leaves.map(req => {
              const isPending = req.status === "PENDING";
              const isApproved = req.status === "APPROVED";

              return (
                <div key={req.id} className="bg-white rounded-xl border border-zinc-200/80 p-5 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
                  <div className="flex items-start justify-between border-b pb-3 border-zinc-100">
                    <div>
                      <h4 className="font-semibold text-zinc-900 text-sm">{req.staffName}</h4>
                      <span className="text-[11px] font-medium text-zinc-500 mt-0.5 block">{req.leaveType}</span>
                    </div>
                    {isPending ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-amber-50 text-amber-800 px-2 py-0.5 rounded border border-amber-200">
                        Pending
                      </span>
                    ) : isApproved ? (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-emerald-50 text-emerald-800 px-2 py-0.5 rounded border border-emerald-200">
                        Approved
                      </span>
                    ) : (
                      <span className="text-[10px] font-semibold uppercase tracking-wider bg-rose-50 text-rose-800 px-2 py-0.5 rounded border border-rose-200">
                        Declined
                      </span>
                    )}
                  </div>

                  <div className="bg-zinc-50 p-3 rounded-lg text-xs space-y-1">
                    <div className="flex justify-between text-zinc-600">
                      <span>Duration:</span>
                      <strong className="text-zinc-900 font-mono">{req.days} Day(s) ({req.startDate} to {req.endDate})</strong>
                    </div>
                    <div className="text-zinc-500 pt-1">
                      Reason: <span className="text-zinc-800 font-medium">"{req.reason}"</span>
                    </div>
                  </div>

                  {isPending && (
                    <div className="flex gap-2 pt-1">
                      <button
                        onClick={() => handleLeaveAction(req.id, "REJECTED")}
                        className="flex-1 py-1.5 bg-white hover:bg-zinc-50 text-zinc-700 text-xs font-medium rounded-lg border border-zinc-200 transition"
                      >
                        Decline
                      </button>
                      <button
                        onClick={() => handleLeaveAction(req.id, "APPROVED")}
                        className="flex-1 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-lg transition"
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

      {/* TAB 4: ADVANCES & INSTALLMENTS */}
      {activeTab === "advances" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <div>
                <h3 className="font-semibold text-zinc-900 text-sm">Staff Loan & Advance Schedule</h3>
                <p className="text-xs text-zinc-500">Installments are automatically subtracted from each payroll run.</p>
              </div>
              <button
                onClick={() => setIsAdvanceModalOpen(true)}
                className="px-3 py-1.5 bg-zinc-900 hover:bg-black text-white text-xs font-medium rounded-lg shadow-xs transition"
              >
                + Schedule Advance
              </button>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-zinc-50/75 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider border-b border-zinc-200/80">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3">Date & Mode</th>
                    <th className="py-3 px-3">Reason</th>
                    <th className="py-3 px-3 text-right">Total Loan</th>
                    <th className="py-3 px-3 text-right">Monthly Installment</th>
                    <th className="py-3 px-4 text-right">Remaining Balance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {advances.map(adv => (
                    <tr key={adv.id} className="hover:bg-zinc-50/50 transition">
                      <td className="py-3.5 px-4 font-semibold text-zinc-900">
                        {adv.staffName}
                      </td>
                      <td className="py-3.5 px-3 text-zinc-500 font-mono">
                        {adv.date} <span className="text-[10px] text-zinc-400 font-sans">({adv.mode})</span>
                      </td>
                      <td className="py-3.5 px-3 text-zinc-700">
                        {adv.reason}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-medium text-zinc-900">
                        ₹{adv.totalLoanAmount.toLocaleString("en-IN")}
                      </td>
                      <td className="py-3.5 px-3 text-right font-mono font-semibold text-rose-700">
                        -₹{adv.monthlyInstallment.toLocaleString("en-IN")} / mo
                      </td>
                      <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-900">
                        ₹{adv.remainingBalance.toLocaleString("en-IN")}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 5: PAYROLL & PAYOUT */}
      {activeTab === "payroll" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">
                Active Payroll Register · {new Date().toLocaleString("en-US", { month: "long", year: "numeric" })}
              </h3>
              <p className="text-xs text-zinc-500 mt-0.5">
                Calculated automatically from attendance, advances, held arrears, and overtime.
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                onClick={handleExportBankNEFT}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-medium transition shadow-xs"
              >
                <Download size={13} />
                <span>Export NEFT File</span>
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[720px]">
                <thead className="bg-zinc-50/75 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider border-b border-zinc-200/80">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3 text-right">Base Salary</th>
                    <th className="py-3 px-3 text-center">Payable Days</th>
                    <th className="py-3 px-3 text-right">Gross Earned</th>
                    <th className="py-3 px-3 text-right">Advance Cut</th>
                    <th className="py-3 px-3 text-right">Held Balance</th>
                    <th className="py-3 px-3 text-right font-semibold text-zinc-900">Net Take-Home</th>
                    <th className="py-3 px-4 text-right">Payslip</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {staff.map(member => {
                    const p = calculatePayrollForMember(member);

                    return (
                      <tr key={member.id} className="hover:bg-zinc-50/50 transition">
                        <td className="py-3.5 px-4">
                          <div className="font-semibold text-zinc-900">{member.name}</div>
                          <div className="text-[11px] text-zinc-400">{member.role}</div>
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-700">
                          ₹{member.monthlySalary.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-center font-mono font-medium text-zinc-900">
                          {p.payableDays} / 30
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-medium text-zinc-900">
                          ₹{p.grossEarned.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-rose-700">
                          {p.installmentDeduction > 0 ? `-₹${p.installmentDeduction.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-600">
                          ₹{member.heldArrears.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono font-semibold text-sm text-zinc-900">
                          ₹{p.netSalary.toLocaleString("en-IN")}
                        </td>
                        <td className="py-3.5 px-4 text-right">
                          <button
                            onClick={() => handleWhatsAppSalarySlip(member, p)}
                            className="inline-flex items-center gap-1.5 px-2.5 py-1 bg-white hover:bg-zinc-50 text-zinc-800 text-[11px] font-medium rounded-md border border-zinc-200 shadow-2xs transition"
                          >
                            <MessageSquare size={12} className="text-zinc-500" />
                            <span>Send Slip</span>
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 6: OVERTIME & PENALTIES */}
      {activeTab === "penalties" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">Total Overtime Perks</span>
              <div className="text-2xl font-semibold font-mono text-zinc-900">₹17,060</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Dinner rush extra hours</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">Total Penalties</span>
              <div className="text-2xl font-semibold font-mono text-zinc-900">₹70</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Late check-in deductions</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">Grace Window</span>
              <div className="text-2xl font-semibold font-mono text-zinc-900">{overtimeRules.graceMinutes}m</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Buffer before clocking</p>
            </div>

            <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
              <span className="text-[11px] font-medium uppercase tracking-wider text-zinc-400 block mb-1">Interval Rounding</span>
              <div className="text-2xl font-semibold font-mono text-zinc-900">{overtimeRules.roundingInterval}m</div>
              <p className="text-[11px] text-zinc-500 mt-0.5">Clock quantization</p>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h3 className="font-semibold text-zinc-900 text-sm">Monthly Overtime & Penalty Ledger</h3>
              <span className="text-xs text-zinc-500 font-mono">April 2026</span>
            </div>
            <div className="divide-y divide-zinc-100 text-xs">
              <div className="p-4 flex items-center justify-between hover:bg-zinc-50/50">
                <div>
                  <div className="font-semibold text-zinc-900">Overtime Perk — Head Chef Dinner Rush</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">20 Oct 2026 · 4 extra hours dinner shift</div>
                </div>
                <div className="font-mono font-semibold text-zinc-900 text-sm">+₹2,360</div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-zinc-50/50">
                <div>
                  <div className="font-semibold text-zinc-900">Late Penalty — Manoj Patil (160m late)</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">11 Oct 2026 · Unscheduled late entry</div>
                </div>
                <div className="font-mono font-semibold text-rose-700 text-sm">-₹50</div>
              </div>

              <div className="p-4 flex items-center justify-between hover:bg-zinc-50/50">
                <div>
                  <div className="font-semibold text-zinc-900">Perk — Weekend Housefull Floor Bonus</div>
                  <div className="text-[11px] text-zinc-500 font-mono mt-0.5">10 Oct 2026 · Festival banquet floor service</div>
                </div>
                <div className="font-mono font-semibold text-zinc-900 text-sm">+₹3,250</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* TAB 7: COMPLIANCE & TAXES */}
      {activeTab === "compliance" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">Statutory Tax & Compliance Mode</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Configure EPF, ESIC, and State Professional Tax.</p>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={() => setComplianceMode(complianceMode === "CASH_IN_HAND" ? "STATUTORY" : "CASH_IN_HAND")}
                className="px-3 py-1.5 rounded-lg text-xs font-medium border border-zinc-200 bg-white hover:bg-zinc-50 text-zinc-800 transition"
              >
                {complianceMode === "STATUTORY" ? "Mode: Statutory (EPF/ESIC/PT)" : "Mode: Net Take-Home (Cash In Hand)"}
              </button>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[650px]">
                <thead className="bg-zinc-50/75 text-zinc-500 font-semibold uppercase text-[11px] tracking-wider border-b border-zinc-200/80">
                  <tr>
                    <th className="py-3 px-4">Employee</th>
                    <th className="py-3 px-3 text-right">Gross Pay</th>
                    <th className="py-3 px-3 text-right">EPF (12%)</th>
                    <th className="py-3 px-3 text-right">ESIC (0.75%)</th>
                    <th className="py-3 px-3 text-right">Prof. Tax</th>
                    <th className="py-3 px-4 text-right">Net Take-Home</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  {staff.map(s => {
                    const p = calculatePayrollForMember(s);
                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/50 transition">
                        <td className="py-3.5 px-4 font-semibold text-zinc-900">{s.name}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-700">₹{p.grossEarned.toLocaleString("en-IN")}</td>
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-500">
                          {complianceMode === "STATUTORY" ? `-₹${p.epfDeduction}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-500">
                          {complianceMode === "STATUTORY" ? `-₹${p.esicDeduction}` : "—"}
                        </td>
                        <td className="py-3.5 px-3 text-right font-mono text-zinc-500">
                          {complianceMode === "STATUTORY" ? `-₹${p.ptDeduction}` : "—"}
                        </td>
                        <td className="py-3.5 px-4 text-right font-mono font-semibold text-zinc-900">
                          ₹{p.netSalary.toLocaleString("en-IN")}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 8: MUSTER & REPORTS */}
      {activeTab === "reports" && (
        <div className="space-y-4">
          <div className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] flex flex-col md:flex-row md:items-center justify-between gap-3">
            <div>
              <h3 className="font-semibold text-zinc-900 text-sm">Inspection Muster Roll (Form T)</h3>
              <p className="text-xs text-zinc-500 mt-0.5">Complies with Indian labor inspection standard format.</p>
            </div>

            <button
              onClick={handleExportMusterReport}
              className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-zinc-900 hover:bg-black text-white rounded-lg text-xs font-medium transition shadow-xs"
            >
              <Download size={13} />
              <span>Download Form T (CSV)</span>
            </button>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-[11px] text-left">
                <thead className="bg-zinc-50/75 text-zinc-500 font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-3 min-w-[140px]">Employee</th>
                    {Array.from({ length: 15 }, (_, i) => (
                      <th key={i} className="py-2.5 px-1.5 text-center font-mono">{i + 1}</th>
                    ))}
                    <th className="py-2.5 px-3 text-center bg-zinc-100 font-semibold text-zinc-900">Present</th>
                    <th className="py-2.5 px-3 text-center bg-zinc-100 font-semibold text-zinc-900">Payable</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100 font-mono">
                  {staff.map(s => {
                    const p = calculatePayrollForMember(s);
                    return (
                      <tr key={s.id} className="hover:bg-zinc-50/50">
                        <td className="py-2.5 px-3 font-sans font-semibold text-zinc-900">{s.name}</td>
                        {Array.from({ length: 15 }, (_, i) => {
                          const isWO = i % 7 === 0;
                          return (
                            <td key={i} className="py-2.5 px-1.5 text-center text-zinc-600">
                              {isWO ? "WO" : "P"}
                            </td>
                          );
                        })}
                        <td className="py-2.5 px-3 text-center font-semibold text-zinc-900 bg-zinc-50/40">13</td>
                        <td className="py-2.5 px-3 text-center font-semibold text-zinc-900 bg-zinc-50/40">{p.payableDays}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 9: ADMIN CONTROL & AUDIT LOGS */}
      {activeTab === "admin_control" && (
        <div className="space-y-4">
          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-zinc-100">
              <h4 className="font-semibold text-zinc-900 text-sm">Role-Based Access Rights</h4>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs min-w-[550px]">
                <thead className="bg-zinc-50/75 text-zinc-500 uppercase text-[11px] font-semibold border-b border-zinc-200">
                  <tr>
                    <th className="py-2.5 px-4">Role</th>
                    <th className="py-2.5 px-3 text-center">Attendance</th>
                    <th className="py-2.5 px-3 text-center">Leaves</th>
                    <th className="py-2.5 px-3 text-center">Advances</th>
                    <th className="py-2.5 px-3 text-center">Payroll</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-zinc-100">
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900">Owner (Superadmin)</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-medium">Full Access</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-medium">Full Access</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-medium">Full Access</td>
                    <td className="py-3 px-3 text-center text-emerald-700 font-medium">Full Access</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900">Restaurant Manager</td>
                    <td className="py-3 px-3 text-center text-zinc-700">Mark & Edit</td>
                    <td className="py-3 px-3 text-center text-zinc-700">Approve/Reject</td>
                    <td className="py-3 px-3 text-center text-zinc-500">View Only</td>
                    <td className="py-3 px-3 text-center text-zinc-400">—</td>
                  </tr>
                  <tr>
                    <td className="py-3 px-4 font-semibold text-zinc-900">Floor Captain</td>
                    <td className="py-3 px-3 text-center text-zinc-500">Self Only</td>
                    <td className="py-3 px-3 text-center text-zinc-500">Apply Only</td>
                    <td className="py-3 px-3 text-center text-zinc-400">—</td>
                    <td className="py-3 px-3 text-center text-zinc-400">—</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bg-white rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] overflow-hidden">
            <div className="p-4 border-b border-zinc-100 flex items-center justify-between">
              <h4 className="font-semibold text-zinc-900 text-sm">System Audit Activity Trail</h4>
              <span className="text-xs text-zinc-400 font-mono">{logs.length} events</span>
            </div>
            <div className="divide-y divide-zinc-100 max-h-80 overflow-y-auto">
              {logs.map(lg => (
                <div key={lg.id} className="p-3.5 flex items-start justify-between hover:bg-zinc-50/50">
                  <div>
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-semibold text-zinc-900">{lg.action}</span>
                      <span className="text-[10px] bg-zinc-100 text-zinc-600 px-1.5 py-0.5 rounded font-mono">
                        {lg.actor}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-500 mt-0.5">{lg.details}</p>
                  </div>
                  <span className="text-[11px] text-zinc-400 font-mono whitespace-nowrap ml-4">
                    {lg.timestamp}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* TAB 10: DIRECTORY */}
      {activeTab === "directory" && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-3.5 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)]">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-zinc-400" size={15} />
              <input
                type="text"
                placeholder="Search staff by name or designation..."
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-4 py-1.5 text-xs bg-zinc-50 border border-zinc-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-zinc-900"
              />
            </div>
            <select
              value={departmentFilter}
              onChange={e => setDepartmentFilter(e.target.value)}
              className="text-xs font-medium py-1.5 px-2.5 border border-zinc-200 rounded-lg bg-zinc-50 text-zinc-700"
            >
              <option value="ALL">All Departments</option>
              <option value="Kitchen">Kitchen</option>
              <option value="Service">Service</option>
              <option value="Housekeeping">Housekeeping</option>
              <option value="Management">Management</option>
            </select>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            {filteredStaff.map(member => (
              <div key={member.id} className="bg-white p-4 rounded-xl border border-zinc-200/80 shadow-[0_1px_2px_rgba(0,0,0,0.03)] space-y-3">
                <div className="flex items-start justify-between border-b pb-3 border-zinc-100">
                  <div>
                    <h3 className="font-semibold text-zinc-900 text-sm">{member.name}</h3>
                    <p className="text-xs text-zinc-500 font-medium">{member.role} · {member.department}</p>
                    <p className="text-[11px] text-zinc-400 font-mono mt-0.5">{member.phone}</p>
                  </div>
                  <span className="text-xs font-mono font-semibold px-2 py-0.5 bg-zinc-100 text-zinc-800 rounded">
                    ₹{member.monthlySalary}/mo
                  </span>
                </div>
                <div className="text-xs text-zinc-500 space-y-1">
                  <div>Shift: <strong className="text-zinc-800">{member.shiftTiming}</strong></div>
                  <div>Leave Balance: <strong className="text-zinc-800">{member.leaveBalance} Days</strong></div>
                  <div>Bank: <strong className="text-zinc-700 font-mono">{member.bankAccount}</strong></div>
                  <div>Held Arrears: <strong className="text-zinc-900 font-mono">₹{member.heldArrears}</strong></div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* MODAL: ADVANCE FORM */}
      {isAdvanceModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl border border-zinc-200">
            <h3 className="font-semibold text-sm text-zinc-900">Schedule Salary Advance</h3>
            <form onSubmit={handleAdvanceSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Employee</label>
                <select
                  value={advanceForm.staffId}
                  onChange={e => setAdvanceForm({ ...advanceForm, staffId: e.target.value })}
                  required
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="">-- Choose Employee --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} ({s.role})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Advance Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="4000"
                    value={advanceForm.totalLoanAmount}
                    onChange={e => setAdvanceForm({ ...advanceForm, totalLoanAmount: e.target.value })}
                    required
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Monthly Deduction (₹)</label>
                  <input
                    type="number"
                    placeholder="2000"
                    value={advanceForm.monthlyInstallment}
                    onChange={e => setAdvanceForm({ ...advanceForm, monthlyInstallment: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Payment Method</label>
                <select
                  value={advanceForm.mode}
                  onChange={e => setAdvanceForm({ ...advanceForm, mode: e.target.value as any })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="CASH">Cash Payment</option>
                  <option value="UPI">Bank / UPI Transfer</option>
                </select>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Medical expense"
                  value={advanceForm.reason}
                  onChange={e => setAdvanceForm({ ...advanceForm, reason: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAdvanceModalOpen(false)}
                  className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg font-medium"
                >
                  Confirm
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ARREARS KHATA */}
      {isArrearModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl border border-zinc-200">
            <h3 className="font-semibold text-sm text-zinc-900">Held Salary Khata (Arrears)</h3>
            <form onSubmit={handleArrearSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Employee</label>
                <select
                  value={arrearForm.staffId}
                  onChange={e => setArrearForm({ ...arrearForm, staffId: e.target.value })}
                  required
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="">-- Choose Employee --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Held: ₹{s.heldArrears})</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Action</label>
                  <select
                    value={arrearForm.actionType}
                    onChange={e => setArrearForm({ ...arrearForm, actionType: e.target.value as any })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="HOLD">Retain with Management</option>
                    <option value="RELEASE">Disburse to Employee</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Amount (₹)</label>
                  <input
                    type="number"
                    placeholder="2000"
                    value={arrearForm.amount}
                    onChange={e => setArrearForm({ ...arrearForm, amount: e.target.value })}
                    required
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsArrearModalOpen(false)}
                  className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg font-medium"
                >
                  Confirm Entry
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: APPLY LEAVE */}
      {isNewLeaveModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl border border-zinc-200">
            <h3 className="font-semibold text-sm text-zinc-900">Apply Leave Request</h3>
            <form onSubmit={handleNewLeaveSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Employee</label>
                <select
                  value={leaveForm.staffId}
                  onChange={e => setLeaveForm({ ...leaveForm, staffId: e.target.value })}
                  required
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                >
                  <option value="">-- Choose Employee --</option>
                  {staff.map(s => (
                    <option key={s.id} value={s.id}>{s.name} (Balance: {s.leaveBalance} Days)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Leave Type</label>
                  <select
                    value={leaveForm.leaveType}
                    onChange={e => setLeaveForm({ ...leaveForm, leaveType: e.target.value as any })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="Casual Leave">Casual Leave</option>
                    <option value="Sick Leave">Sick Leave</option>
                    <option value="Emergency">Emergency</option>
                    <option value="Comp-Off">Comp-Off</option>
                  </select>
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Days</label>
                  <input
                    type="number"
                    value={leaveForm.days}
                    onChange={e => setLeaveForm({ ...leaveForm, days: e.target.value })}
                    required
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Reason</label>
                <input
                  type="text"
                  placeholder="e.g. Family event"
                  value={leaveForm.reason}
                  onChange={e => setLeaveForm({ ...leaveForm, reason: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsNewLeaveModalOpen(false)}
                  className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg font-medium"
                >
                  Approve & Log
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: ADD STAFF */}
      {isAddStaffModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs animate-in fade-in duration-150">
          <div className="bg-white rounded-2xl w-full max-w-md p-5 space-y-4 shadow-xl border border-zinc-200">
            <h3 className="font-semibold text-sm text-zinc-900">Add Staff Member</h3>
            <form onSubmit={handleAddStaffSubmit} className="space-y-3 text-xs">
              <div>
                <label className="block font-medium text-zinc-700 mb-1">Full Name</label>
                <input
                  type="text"
                  placeholder="e.g. Rahul Verma"
                  value={newStaffForm.name}
                  onChange={e => setNewStaffForm({ ...newStaffForm, name: e.target.value })}
                  required
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Designation</label>
                  <select
                    value={newStaffForm.role}
                    onChange={e => setNewStaffForm({ ...newStaffForm, role: e.target.value as any })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
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
                  <label className="block font-medium text-zinc-700 mb-1">Department</label>
                  <select
                    value={newStaffForm.department}
                    onChange={e => setNewStaffForm({ ...newStaffForm, department: e.target.value as any })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-medium"
                  >
                    <option value="Kitchen">Kitchen</option>
                    <option value="Service">Service</option>
                    <option value="Housekeeping">Housekeeping</option>
                    <option value="Management">Management</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Monthly Salary (₹)</label>
                  <input
                    type="number"
                    placeholder="15000"
                    value={newStaffForm.monthlySalary}
                    onChange={e => setNewStaffForm({ ...newStaffForm, monthlySalary: parseFloat(e.target.value) || 0 })}
                    required
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
                <div>
                  <label className="block font-medium text-zinc-700 mb-1">Phone Number</label>
                  <input
                    type="tel"
                    placeholder="9822334455"
                    value={newStaffForm.phone}
                    onChange={e => setNewStaffForm({ ...newStaffForm, phone: e.target.value })}
                    className="w-full border border-zinc-200 rounded-lg p-2 text-xs font-mono"
                  />
                </div>
              </div>

              <div>
                <label className="block font-medium text-zinc-700 mb-1">Shift Timings</label>
                <input
                  type="text"
                  placeholder="11:00 AM – 11:00 PM"
                  value={newStaffForm.shiftTiming}
                  onChange={e => setNewStaffForm({ ...newStaffForm, shiftTiming: e.target.value })}
                  className="w-full border border-zinc-200 rounded-lg p-2 text-xs"
                />
              </div>

              <div className="flex gap-2 pt-2">
                <button
                  type="button"
                  onClick={() => setIsAddStaffModalOpen(false)}
                  className="flex-1 py-2 bg-white hover:bg-zinc-50 border border-zinc-200 text-zinc-700 rounded-lg font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="flex-1 py-2 bg-zinc-900 hover:bg-black text-white rounded-lg font-medium"
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
