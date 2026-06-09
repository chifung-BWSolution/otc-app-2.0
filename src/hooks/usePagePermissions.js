import { useState, useEffect, useCallback } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useAuth } from "@/lib/AuthContext";
import { menuGroups } from "@/components/navigation/menuConfig";

/**
 * Normalize dynamic routes to their parent/base path for permission checks.
 * e.g. /admin/staff/123 -> /admin/staff
 * e.g. /course/abc-123 -> /course/center
 */
function normalizePath(path) {
  // /admin/staff/:id
  if (/^\/admin\/staff\//.test(path)) return "/admin/staff";
  // /course/:courseId (but not /course/center, /course/exam etc)
  if (/^\/course\/[^/]+$/.test(path) && !["/course/center", "/course/exam", "/course/schedule", "/course/weekly", "/course/my-knowledge"].includes(path)) {
    return "/course/center";
  }
  // /app/store sub-paths
  if (path.startsWith("/app/store/")) return "/app/store";
  // Default: strip last segment if it looks like an ID
  const parts = path.split("/");
  if (parts.length > 3) {
    return parts.slice(0, 3).join("/");
  }
  return path;
}

/**
 * Hook to check which pages/paths the current user can access.
 * Priority: user_page_overrides > page_permissions (role-based) > default (all allowed for admin, limited for user)
 */
export function usePagePermissions() {
  const { user } = useAuth();
  const [rolePermissions, setRolePermissions] = useState([]);
  const [userOverrides, setUserOverrides] = useState([]);
  const [loading, setLoading] = useState(true);

  const userRole = user?.role || "user";
  const userId = user?.id;

  const fetchPermissions = useCallback(async () => {
    if (!user) { setLoading(false); return; }
    setLoading(true);
    try {
      // Fetch role-based permissions
      const { data: rolePerm } = await supabase
        .from("page_permissions")
        .select("*")
        .eq("role", userRole);
      setRolePermissions(rolePerm || []);

      // Fetch user-specific overrides (match by user table id)
      // We need to get the user table row id from email
      const { data: userRow } = await supabase
        .from("user")
        .select("id")
        .eq("email", user.email)
        .maybeSingle();

      if (userRow?.id) {
        const { data: overrides } = await supabase
          .from("user_page_overrides")
          .select("*")
          .eq("user_id", userRow.id);
        setUserOverrides(overrides || []);
      } else {
        setUserOverrides([]);
      }
    } catch (e) {
      console.warn("Failed to fetch page permissions:", e);
    }
    setLoading(false);
  }, [user, userRole]);

  useEffect(() => {
    fetchPermissions();
  }, [fetchPermissions]);

  /**
   * Check if a specific path is allowed.
   * Logic:
   *  1. If user has a user_page_overrides entry for this path -> use that
   *  2. Else if role has a page_permissions entry for this path -> use that
   *  3. Else -> default: admin/management see all, user only sees "/" and work paths
   */
  const isPathAllowed = useCallback((path) => {
    if (!path) return false;
    // "/" is always allowed
    if (path === "/") return true;

    // If user exists but role is still null (DB role loading), allow all to prevent flash
    if (user && !user.role) return true;

    // Admin/management always have full access (ignore page_permissions & overrides)
    if (userRole === "admin" || userRole === "management") {
      return true;
    }

    // Dynamic routes: check parent path (e.g. /admin/staff/123 -> check /admin/staff)
    // Also /course/xxx -> check /course/center
    const normalizedPath = normalizePath(path);

    // 1. Check user override (exact first, then normalized)
    const override = userOverrides.find(o => o.page_path === path) ||
                     userOverrides.find(o => o.page_path === normalizedPath);
    if (override) return override.allowed;

    // 2. Check role permission (exact first, then normalized)
    const rolePerm = rolePermissions.find(p => p.page_path === path) ||
                     rolePermissions.find(p => p.page_path === normalizedPath);
    if (rolePerm) return rolePerm.allowed;

    // Default allowed paths for non-admin (if no permissions configured at all)
    // If we have ANY role permissions configured, then non-listed pages are blocked
    if (rolePermissions.length > 0) {
      // Role permissions exist but this path is not in them -> blocked
      return false;
    }

    // No permissions configured at all -> old hardcode fallback
    const defaultAllowed = [
      "/work/daily", "/work/weekly", "/work/kpi", "/work/projects",
      "/work/special-approval", "/work/annual-review", "/work/peer-review",
      "/company/news", "/company/calendar", "/company/forms", "/company/contact",
      "/company/faq", "/company/resources", "/company/expense", "/company/admin-help",
      "/attendance/records", "/attendance/checkin", "/attendance/leave", "/attendance/overtime",
      "/course/center", "/course/schedule", "/course/weekly", "/course/my-knowledge", "/course/exam",
      "/app/tech-news", "/app/store", "/app/suggest",
      "/events/join",
      "/business/tender",
    ];
    return defaultAllowed.includes(path) || defaultAllowed.includes(normalizedPath);
  }, [rolePermissions, userOverrides, userRole, user]);

  /**
   * Check if a menu group should be visible (at least one item allowed)
   */
  const isGroupAllowed = useCallback((groupKey) => {
    const group = menuGroups.find(g => g.key === groupKey);
    if (!group) return false;
    return group.items.some(item => isPathAllowed(item.path));
  }, [isPathAllowed]);

  /**
   * Filter menu items to only allowed ones
   */
  const filterAllowedItems = useCallback((items) => {
    return items.filter(item => isPathAllowed(item.path));
  }, [isPathAllowed]);

  return {
    isPathAllowed,
    isGroupAllowed,
    filterAllowedItems,
    loading,
    refresh: fetchPermissions,
    rolePermissions,
    userOverrides,
  };
}
