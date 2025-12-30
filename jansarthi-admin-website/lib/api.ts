// API Service for PWD Admin Dashboard

const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8000";

// Types
export type IssueType = "water" | "electricity" | "road" | "garbage" | "sewerage";
export type IssueStatus = "reported" | "assigned" | "parshad_check" | "started_working" | "finished_work";
export type UserRole = "user" | "parshad" | "pwd_worker";

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
  assigned_issues_count?: number;
}

export interface Issue {
  id: number;
  issue_type: IssueType;
  description?: string;
  address?: string;
  latitude?: number;
  longitude?: number;
  ward_number?: number;
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

// Dashboard
export const getPWDDashboard = async (): Promise<PWDDashboardStats> => {
  const response = await fetch(`${API_BASE_URL}/api/pwd/dashboard`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

// Issues
export const getIssues = async (params?: {
  skip?: number;
  limit?: number;
  issue_type?: string;
  status?: string;
  ward_number?: number;
}): Promise<IssuesResponse> => {
  const queryParams = new URLSearchParams();
  if (params?.skip) queryParams.append("skip", params.skip.toString());
  if (params?.limit) queryParams.append("limit", params.limit.toString());
  if (params?.issue_type) queryParams.append("issue_type", params.issue_type);
  if (params?.status) queryParams.append("status", params.status);
  if (params?.ward_number) queryParams.append("ward_number", params.ward_number.toString());

  const response = await fetch(`${API_BASE_URL}/api/pwd/issues?${queryParams.toString()}`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
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

// Parshads
export const getParshads = async (): Promise<ParshadInfo[]> => {
  const response = await fetch(`${API_BASE_URL}/api/pwd/parshads`, {
    headers: getHeaders(),
  });
  return handleResponse(response);
};

export const createParshad = async (data: {
  name: string;
  phone: string;
  ward_number: number;
}): Promise<ParshadInfo> => {
  const response = await fetch(`${API_BASE_URL}/api/pwd/parshads`, {
    method: "POST",
    headers: getHeaders(),
    body: JSON.stringify({
      name: data.name,
      mobile_number: data.phone, // API expects mobile_number
      ward_number: data.ward_number,
      ward_id: data.ward_number, // Also send ward_id for backend compatibility
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
    parshad_check: "Acknowledged",
    started_working: "In Progress",
    finished_work: "Completed",
  };
  return labels[status];
};

export const getStatusColor = (status: IssueStatus): string => {
  const colors: Record<IssueStatus, string> = {
    reported: "bg-red-100 text-red-800",
    assigned: "bg-yellow-100 text-yellow-800",
    parshad_check: "bg-orange-100 text-orange-800",
    started_working: "bg-blue-100 text-blue-800",
    finished_work: "bg-green-100 text-green-800",
  };
  return colors[status];
};
