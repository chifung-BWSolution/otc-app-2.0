// Role-based permission helpers for Leave Management

export function getUserRole(user) {
  if (!user) return null;
  const r = user.role?.toLowerCase();
  if (r === "admin") return "admin";
  if (r === "management") return "management";
  if (r === "leader") return "leader";
  return "staff";
}

export function canViewAllCompany(role) {
  return role === "admin" || role === "management";
}

export function canViewDepartment(role) {
  return role === "leader";
}

export function canApproveReject(role, approverDept, requestDept) {
  if (role === "admin" || role === "management") return true;
  if (role === "leader" && approverDept && approverDept === requestDept) return true;
  return false;
}

export function canEditCancel(role) {
  return role === "admin";
}

export function filterRecordsByRole(records, role, userEmail, userDept) {
  if (canViewAllCompany(role)) return records;
  if (canViewDepartment(role)) {
    return records.filter(r => r.user_email === userEmail || r.dept === userDept);
  }
  return records.filter(r => r.user_email === userEmail);
}

export function filterBalancesByRole(balances, role, userEmail, userDept) {
  if (canViewAllCompany(role)) return balances;
  if (canViewDepartment(role)) {
    return balances.filter(b => b.user_email === userEmail || b.dept === userDept);
  }
  return balances.filter(b => b.user_email === userEmail);
}