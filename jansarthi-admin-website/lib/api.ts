// API Service for PWD Admin Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export type IssueType = "water" | "electricity" | "road" | "garbage" | "sewerage";
export type IssueStatus = "reported" | "assigned" | "representative_acknowledged" | "pwd_working" | "pwd_completed" | "representative_reviewed";
export type UserRole = "user" | "representative" | "pwd_worker" | "admin";

export interface UserInfo {
  id: number;
  name: string;
  mobile_number: string;
}

export interface ParshadInfo {
  id: number;
  name: string;
  phone?: string;
  mobile_number?: string;
  ward_number?: number;
  ward_id?: number; // Added for backend compatibility
  locality_id?: number;
  locality_name?: string;
  locality_type?: LocalityType;
  assigned_issues_count?: number;
}

export type LocalityType = "ward" | "village";

export interface Locality {
  id: number;
  name: string;
  type: LocalityType;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
  representative_count?: number;
  issue_count?: number;
}

export interface LocalitiesResponse {
  items: Locality[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface Issue {
  id: number;
  issue_type: IssueType;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ward_number?: number;
  locality_id?: number;
  status: IssueStatus;
  user_id?: number;
  reporter?: UserInfo;
  assigned_parshad_id?: number;
  assigned_parshad?: ParshadInfo;
  assignment_notes?: string;
  assignment_message?: string; // Auto-assignment status message
  progress_notes?: string;
  created_at: string;
  updated_at?: string;
  images?: string[];
  photo_count?: number;
}

export interface IssuesResponse {
  issues: Issue[];
  total: number;
}

export interface IssueCountByType {
  water?: number;
  electricity?: number;
  road?: number;
  garbage?: number;
  sewerage?: number;
}

export interface PWDDashboardStats {
  total_issues: number;
  pending_issues?: number;
  in_progress_issues?: number;
  completed_issues?: number;
  total_parshads?: number;
  total_users?: number;
  issues_by_type?: IssueCountByType;
}

export interface Parshad {
  id: number;
  name: string;
  phone?: string;
  mobile_number?: string;
  role?: UserRole;
  ward_number?: number;
  assigned_issues_count?: number;
}

// Token management
let accessToken: string | null = null;

export const setAccessToken = (token: string) => {
  accessToken = token;
  if (typeof window !== "undefined") {
    localStorage.setItem("pwd_access_token", token);
  }
};

export const getAccessToken = (): string | null => {
  if (accessToken) return accessToken;
  if (typeof window !== "undefined") {
    accessToken = localStorage.getItem("pwd_access_token");
  }
  return accessToken;
};

export const clearAccessToken = () => {
  accessToken = null;
  if (typeof window !== "undefined") {
    localStorage.removeItem("pwd_access_token");
    localStorage.removeItem("pwd_refresh_token");
  }
};

// API functions
const getHeaders = () => {
  const token = getAccessToken();
  return {
    "Content-Type": "application/json",
    ...(token ? { Authorization: `Bearer ${token}` } : {}),
  };
};

const handleResponse = async <T>(response: Response): Promise<T> => {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "An error occurred" }));
    throw new Error(error.detail || "An error occurred");
  }
  return response.json();
};

// Auth
export const loginPWD = async (mobile_number: string): Promise<{ message: string; mobile_number: string; expires_in_minutes: number }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number }),
  });
  return handleResponse(response);
};

export const verifyOTP = async (mobile_number: string, otp_code: string): Promise<{ access_token: string; refresh_token: string; user: { id: number; name: string; role: UserRole } }> => {
  const response = await fetch(`${API_BASE_URL}/api/auth/verify-otp`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ mobile_number, otp_code }),
  });
  const result = await handleResponse<{ access_token: string; refresh_token: string; user: { id: number; name: string; role: UserRole } }>(response);
  setAccessToken(result.access_token);
  if (typeof window !== "undefined") {
    localStorage.setItem("pwd_refresh_token", result.refresh_token);
  }
  return result;
};

// Dashboard - Admin
// For admin users, we aggregate data from admin endpoints
export const getPWDDashboard = async (): Promise<PWDDashboardStats> => {
  // Try PWD dashboard first (for PWD workers), fall back to admin aggregation
  try {
    const response = await fetch(`${API_BASE_URL}/api/pwd/dashboard`, {
      headers: getHeaders(),
    });
    if (response.ok) {
      return handleResponse(response);
    }
  } catch {
    // Fall through to admin aggregation
  }
  
  // For admin users, aggregate from admin endpoints
  return getAdminDashboardStats();
};

// Admin Dashboard - aggregate data from admin endpoints
export const getAdminDashboardStats = async (): Promise<PWDDashboardStats> => {
  try {
    // Fetch users and localities in parallel
    const [usersResponse, localitiesResponse] = await Promise.all([
      fetch(`${API_BASE_URL}/api/admin/users?page_size=1000`, { headers: getHeaders() }),
      fetch(`${API_BASE_URL}/api/admin/localities?page_size=1000`, { headers: getHeaders() }),
    ]);
    
    const usersData = await usersResponse.json().catch(() => ({ items: [], total: 0 }));
    const localitiesData = await localitiesResponse.json().catch(() => ({ items: [], total: 0 }));
    
    const users = usersData.items || [];
    const localities = localitiesData.items || [];
    
    // Count by role
    const representatives = users.filter((u: { role: string }) => u.role === "representative");
    const pwdWorkers = users.filter((u: { role: string }) => u.role === "pwd_worker");
    const regularUsers = users.filter((u: { role: string }) => u.role === "user");
    
    // Calculate issue counts from localities
    const totalIssues = localities.reduce((sum: number, loc: Locality) => sum + (loc.issue_count || 0), 0);
    
    return {
      total_issues: totalIssues,
      pending_issues: 0, // Will be updated when we have issue access
      in_progress_issues: 0,
      completed_issues: 0,
      total_parshads: representatives.length,
      total_users: regularUsers.length,
      issues_by_type: {
        water: 0,
        electricity: 0,
        road: 0,
        garbage: 0,
      },
    };
  } catch (err) {
    console.error("Failed to get admin dashboard stats:", err);
    return {
      total_issues: 0,
      pending_issues: 0,
      in_progress_issues: 0,
      completed_issues: 0,
      total_parshads: 0,
      total_users: 0,
    };
  }
};

// Get all admin users with details
export const getAdminUsers = async (params?: {
  page?: number;
  page_size?: number;
  role?: UserRole;
  locality_id?: number;
  is_active?: boolean;
  search?: string;
}): Promise<{ items: AdminUser[]; total: number; page: number; page_size: number; total_pages: number }> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.page_size) queryParams.append("page_size", params.page_size.toString());
  if (params?.role) queryParams.append("role", params.role);
  if (params?.locality_id) queryParams.append("locality_id", params.locality_id.toString());
  if (params?.is_active !== undefined) queryParams.append("is_active", params.is_active.toString());
  if (params?.search) queryParams.append("search", params.search);

  const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export interface AdminUser {
  id: number;
  name: string;
  mobile_number: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  locality_id?: number;
  locality_name?: string;
  locality_type?: LocalityType;
  created_at?: string;
  updated_at?: string;
  total_reports?: number;
  assigned_issues?: number;
}

// Localities (Wards/Villages) - Admin API
export const getLocalities = async (params?: {
  page?: number;
  page_size?: number;
  type?: LocalityType;
  is_active?: boolean;
  search?: string;
}): Promise<LocalitiesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.page_size) queryParams.append("page_size", params.page_size.toString());
  if (params?.type) queryParams.append("type", params.type);
  if (params?.is_active !== undefined) queryParams.append("is_active", params.is_active.toString());
  if (params?.search) queryParams.append("search", params.search);

  const response = await fetch(`${API_BASE_URL}/api/admin/localities?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createLocality = async (data: {
  name: string;
  type: LocalityType;
}): Promise<Locality> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/localities`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const updateLocality = async (
  localityId: number,
  data: { name?: string; is_active?: boolean }
): Promise<Locality> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/localities/${localityId}`, {
    method: "PATCH",
    headers: getHeaders(),
    body: JSON.stringify(data),
  });
  return handleResponse(response);
};

export const deleteLocality = async (localityId: number): Promise<void> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/localities/${localityId}`, {
    method: "DELETE",
    headers: getHeaders(),
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ detail: "Failed to delete locality" }));
    throw new Error(error.detail || "Failed to delete locality");
  }
};

// Issues - Using Admin API (via PWD which admin has access to)
export const getIssues = async (params?: {
  page?: number;
  page_size?: number;
  skip?: number;
  limit?: number;
  issue_type?: string;
  status?: string;
  locality_id?: number;
  ward_number?: number;
  assigned?: boolean;
  search?: string;
}): Promise<IssuesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.page) queryParams.append("page", params.page.toString());
  if (params?.page_size) queryParams.append("page_size", params.page_size.toString());
  if (params?.issue_type) queryParams.append("issue_type", params.issue_type);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.locality_id) queryParams.append("locality_id", params.locality_id.toString());
  if (params?.assigned !== undefined) queryParams.append("assigned", params.assigned.toString());
  if (params?.search) queryParams.append("search", params.search);

  const response = await fetch(`${API_BASE_URL}/api/pwd/issues?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  const data = await handleResponse<{ items: Issue[]; total: number; page: number; page_size: number; total_pages: number }>(response);
  return { issues: data.items || [], total: data.total || 0 };
};

export const getIssueDetail = async (issueId: number): Promise<Issue> => {
  const response = await fetch(`${API_BASE_URL}/api/pwd/issues/${issueId}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const assignParshad = async (issueId: number, parshadId: number, assignmentNotes?: string): Promise<Issue> => {
  const response = await fetch(`${API_BASE_URL}/api/pwd/issues/${issueId}/assign`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({ parshad_id: parshadId, assignment_notes: assignmentNotes }),
  });
  return handleResponse(response);
};

// Users (Parshads/Representatives) - Admin API
export const getParshads = async (params?: {
  is_active?: boolean;
  search?: string;
}): Promise<{ items: ParshadInfo[]; total: number }> => {
  const queryParams = new URLSearchParams();
  queryParams.append("role", "representative");
  if (params?.is_active !== undefined) queryParams.append("is_active", params.is_active.toString());
  if (params?.search) queryParams.append("search", params.search);
  queryParams.append("page_size", "100"); // Get all for now

  const response = await fetch(`${API_BASE_URL}/api/admin/users?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createParshad = async (data: {
  name: string;
  phone: string;
  locality_id: number;
}): Promise<ParshadInfo> => {
  const response = await fetch(`${API_BASE_URL}/api/admin/users`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: data.name,
      mobile_number: data.phone,
      role: "representative",
      locality_id: data.locality_id,
    }),
  });
  return handleResponse(response);
};

// Utility functions
export const getIssueTypeLabel = (type: IssueType): string => {
  const labels: Record<IssueType, string> = {
    water: "Water Problem",
    electricity: "Electricity Problem",
    road: "Road Problem",
    garbage: "Garbage Problem",
    sewerage: "Sewerage Problem",
  };
  return labels[type];
};

export const getIssueTypeColor = (type: IssueType): string => {
  const colors: Record<IssueType, string> = {
    water: "bg-blue-100 text-blue-800",
    electricity: "bg-yellow-100 text-yellow-800",
    road: "bg-gray-100 text-gray-800",
    garbage: "bg-green-100 text-green-800",
    sewerage: "bg-purple-100 text-purple-800",
  };
  return colors[type];
};

export const getStatusLabel = (status: IssueStatus): string => {
  const labels: Record<IssueStatus, string> = {
    reported: "Reported",
    assigned: "Assigned",
    representative_acknowledged: "Acknowledged",
    pwd_working: "In Progress",
    pwd_completed: "Work Complete",
    representative_reviewed: "Reviewed",
  };
  return labels[status];
};

export const getStatusColor = (status: IssueStatus): string => {
  const colors: Record<IssueStatus, string> = {
    reported: "bg-red-100 text-red-800",
    assigned: "bg-yellow-100 text-yellow-800",
    representative_acknowledged: "bg-orange-100 text-orange-800",
    pwd_working: "bg-blue-100 text-blue-800",
    pwd_completed: "bg-teal-100 text-teal-800",
    representative_reviewed: "bg-green-100 text-green-800",
  };
  return colors[status];
};
