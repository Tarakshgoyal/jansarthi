import * as SecureStore from 'expo-secure-store';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_URL || 'http://localhost:8000';
// const API_BASE_URL = "https://api.surakshit.world";

// Token management
export const TOKEN_KEYS = {
  ACCESS_TOKEN: 'access_token',
  REFRESH_TOKEN: 'refresh_token',
  USER_DATA: 'user_data',
};

export const getAccessToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
};

export const getRefreshToken = async (): Promise<string | null> => {
  return await SecureStore.getItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
};

export const setTokens = async (accessToken: string, refreshToken: string) => {
  await SecureStore.setItemAsync(TOKEN_KEYS.ACCESS_TOKEN, accessToken);
  await SecureStore.setItemAsync(TOKEN_KEYS.REFRESH_TOKEN, refreshToken);
};

export const clearTokens = async () => {
  await SecureStore.deleteItemAsync(TOKEN_KEYS.ACCESS_TOKEN);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.REFRESH_TOKEN);
  await SecureStore.deleteItemAsync(TOKEN_KEYS.USER_DATA);
};

export const getUserData = async () => {
  const data = await SecureStore.getItemAsync(TOKEN_KEYS.USER_DATA);
  return data ? JSON.parse(data) : null;
};

export const setUserData = async (userData: any) => {
  await SecureStore.setItemAsync(TOKEN_KEYS.USER_DATA, JSON.stringify(userData));
};

// User Roles
export type UserRole = 'user' | 'representative' | 'pwd_worker' | 'admin';

// Locality Types
export type LocalityType = 'ward' | 'village';

// Issue Statuses - New Flow
export type IssueStatus = 
  | 'reported'
  | 'assigned'
  | 'representative_acknowledged'
  | 'pwd_working'
  | 'pwd_completed'
  | 'representative_reviewed';

// Locality Types
export interface Locality {
  id: number;
  name: string;
  type: LocalityType;
  is_active: boolean;
  created_at?: string;
  updated_at?: string;
}

export interface RepresentativeInfo {
  id: number;
  name: string;
}

export interface LocalityPublicResponse {
  id: number;
  name: string;
  type: LocalityType;
  representatives: RepresentativeInfo[];
}

export interface LocalityListPublicResponse {
  items: LocalityPublicResponse[];
  total: number;
}

// API Types
export interface User {
  id: number;
  name: string;
  mobile_number: string;
  role: UserRole;
  is_active: boolean;
  is_verified: boolean;
  locality_id?: number;
  locality_name?: string;
  locality_type?: LocalityType;
  created_at: string;
  updated_at: string;
}

export interface LoginRequest {
  mobile_number: string;
}

export interface SignupRequest {
  name: string;
  mobile_number: string;
}

export interface VerifyOTPRequest {
  mobile_number: string;
  otp_code: string;
}

export interface OTPResponse {
  message: string;
  mobile_number: string;
  expires_in_minutes: number;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
  expires_in: number;
  user: User;
}

export interface Issue {
  id: number;
  issue_type: string;
  description: string;
  latitude: number;
  longitude: number;
  locality_id?: number;
  locality_name?: string;
  locality_type?: LocalityType;
  status: string;
  user_id: number;
  assigned_representative_id?: number;
  assignment_message?: string;
  // Completion data (when PWD completes work)
  completion_description?: string;
  completion_photo_url?: string;
  completed_at?: string;
  completed_by_id?: number;
  created_at: string;
  updated_at: string;
  photos: IssuePhoto[];
}

export interface IssuePhoto {
  id: number;
  issue_id: number;
  photo_url: string;
  filename: string;
  file_size: number;
  content_type: string;
  created_at: string;
}

export interface IssueListResponse {
  items: Issue[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

// Representative Types
export interface RepresentativeInfoDetail {
  id: number;
  name: string;
  mobile_number: string;
  locality_id?: number;
  locality_name?: string;
}

export interface UserInfo {
  id: number;
  name: string;
  mobile_number: string;
}

export interface RepresentativeIssue {
  id: number;
  issue_type: string;
  description: string;
  latitude: number;
  longitude: number;
  locality_id?: number;
  locality_name?: string;
  status: string;
  user_id?: number;
  reporter?: UserInfo;
  assigned_representative_id?: number;
  assigned_representative?: RepresentativeInfoDetail;
  assignment_notes?: string;
  progress_notes?: string;
  // Completion data (when PWD completes work)
  completion_description?: string;
  completion_photo_url?: string;
  completed_at?: string;
  completed_by_id?: number;
  completed_by_name?: string;
  created_at: string;
  updated_at: string;
  photo_count: number;
  photos?: string[]; // Photo URLs
}

export interface RepresentativeIssueListResponse {
  items: RepresentativeIssue[];
  total: number;
  page: number;
  page_size: number;
  total_pages: number;
}

export interface RepresentativeDashboardStats {
  total_assigned: number;
  pending_acknowledgement: number;
  in_progress: number;
  pending_review: number;
  completed: number;
  issues_by_type: {
    water: number;
    electricity: number;
    road: number;
    garbage: number;
  };
}

// PWD Worker Types
export interface PWDWorkerDashboardStats {
  pending_work: number;
  in_progress: number;
  pending_review: number;
  completed: number;
  issues_by_type: {
    water: number;
    electricity: number;
    road: number;
    garbage: number;
  };
}

// API Service
class ApiService {
  private baseURL = API_BASE_URL;

  private async getAuthHeaders(): Promise<HeadersInit> {
    const token = await getAccessToken();
    return {
      'Authorization': token ? `Bearer ${token}` : '',
    };
  }

  private async handleResponse(response: Response) {
    if (response.status === 401) {
      // Token expired, try to refresh
      const refreshed = await this.refreshToken();
      if (!refreshed) {
        await clearTokens();
        throw new Error('Session expired. Please login again.');
      }
      throw new Error('RETRY_REQUEST');
    }

    if (!response.ok) {
      let errorMessage = 'Request failed';
      try {
        const error = await response.json();
        console.error('API Error Response:', JSON.stringify(error, null, 2));
        
        // Handle different error response formats
        if (typeof error === 'string') {
          errorMessage = error;
        } else if (error.detail) {
          // FastAPI validation error or standard error
          if (typeof error.detail === 'string') {
            errorMessage = error.detail;
          } else if (Array.isArray(error.detail)) {
            // Validation errors array - include field names
            errorMessage = error.detail.map((e: any) => {
              const field = e.loc ? e.loc.join('.') : 'unknown';
              const msg = e.msg || 'validation error';
              return `${field}: ${msg}`;
            }).join(', ');
          } else {
            errorMessage = JSON.stringify(error.detail);
          }
        } else if (error.message) {
          errorMessage = error.message;
        } else {
          errorMessage = JSON.stringify(error);
        }
      } catch (e) {
        errorMessage = `Request failed with status ${response.status}`;
      }
      throw new Error(errorMessage);
    }

    return response.json();
  }

  // Auth APIs
  async signup(data: SignupRequest): Promise<OTPResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/signup`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async login(data: LoginRequest): Promise<OTPResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    return this.handleResponse(response);
  }

  async verifyOTP(data: VerifyOTPRequest): Promise<TokenResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/verify-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(data),
    });
    const result = await this.handleResponse(response);
    
    // Store tokens and user data
    await setTokens(result.access_token, result.refresh_token);
    await setUserData(result.user);
    
    return result;
  }

  async refreshToken(): Promise<boolean> {
    try {
      const refreshToken = await getRefreshToken();
      if (!refreshToken) return false;

      const response = await fetch(`${this.baseURL}/api/auth/refresh`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ refresh_token: refreshToken }),
      });

      if (!response.ok) return false;

      const result = await response.json();
      await setTokens(result.access_token, result.refresh_token);
      await setUserData(result.user);
      
      return true;
    } catch {
      return false;
    }
  }

  async getCurrentUser(): Promise<User> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/auth/me`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async resendOTP(mobile_number: string): Promise<OTPResponse> {
    const response = await fetch(`${this.baseURL}/api/auth/resend-otp`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ mobile_number }),
    });
    return this.handleResponse(response);
  }

  // Issue APIs
  async createIssue(data: {
    issue_type: string;
    description: string;
    latitude: number;
    longitude: number;
    locality_id?: number;
    photos?: { uri: string; name: string; type: string }[];
  }): Promise<Issue> {
    const token = await getAccessToken();
    
    console.log('Creating issue with data:', {
      issue_type: data.issue_type,
      description: data.description,
      latitude: data.latitude,
      longitude: data.longitude,
      locality_id: data.locality_id,
      photos_count: data.photos?.length || 0,
      has_token: !!token,
      api_url: `${this.baseURL}/api/reports`,
    });

    // Create FormData for multipart request
    const formData = new FormData();
    formData.append('issue_type', data.issue_type);
    formData.append('description', data.description);
    formData.append('latitude', data.latitude.toString());
    formData.append('longitude', data.longitude.toString());
    
    // Add locality id if provided
    if (data.locality_id) {
      formData.append('locality_id', data.locality_id.toString());
    }

    // Add photos if provided (React Native format)
    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo, index) => {
        // React Native requires specific format for file upload
        const file: any = {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        };
        formData.append('photos', file);
        console.log(`Added photo ${index + 1}:`, { name: photo.name, type: photo.type });
      });
    }

    try {
      const response = await fetch(`${this.baseURL}/api/reports`, {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
          // Don't set Content-Type for FormData - it will be set automatically with boundary
        },
        body: formData,
      });

      console.log('Create issue response status:', response.status);
      
      if (!response.ok) {
        const responseText = await response.text();
        console.error('Create issue error response:', responseText);
        
        let errorMessage = `Request failed with status ${response.status}`;
        try {
          const error = JSON.parse(responseText);
          if (error.detail) {
            if (typeof error.detail === 'string') {
              errorMessage = error.detail;
            } else if (Array.isArray(error.detail)) {
              errorMessage = error.detail.map((e: any) => 
                `${e.loc ? e.loc.join('.') + ': ' : ''}${e.msg || JSON.stringify(e)}`
              ).join(', ');
            } else {
              errorMessage = JSON.stringify(error.detail);
            }
          } else {
            errorMessage = JSON.stringify(error);
          }
        } catch (e) {
          errorMessage = responseText || errorMessage;
        }
        
        throw new Error(errorMessage);
      }

      const result = await response.json();
      console.log('Issue created successfully:', result.id);
      return result;
    } catch (error) {
      console.error('Create issue error:', error);
      throw error;
    }
  }

  async getMyIssues(params?: {
    page?: number;
    page_size?: number;
    issue_type?: string;
    status?: string;
  }): Promise<IssueListResponse> {
    const headers = await this.getAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.issue_type) queryParams.append('issue_type', params.issue_type);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(
      `${this.baseURL}/api/reports?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    return this.handleResponse(response);
  }

  async getIssue(issueId: number): Promise<Issue> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/reports/${issueId}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async getMapIssues(params: {
    latitude: number;
    longitude: number;
    radius?: number;
    issue_type?: string;
    status?: string;
  }): Promise<Issue[]> {
    const headers = await this.getAuthHeaders();
    
    const radius = params.radius ?? 50; // Default 50km radius
    
    const queryParams = new URLSearchParams();
    queryParams.append('latitude', params.latitude.toString());
    queryParams.append('longitude', params.longitude.toString());
    queryParams.append('radius', radius.toString());
    if (params.issue_type) queryParams.append('issue_type', params.issue_type);
    if (params.status) queryParams.append('status', params.status);
    
    const response = await fetch(
      `${this.baseURL}/api/reports/map?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    return this.handleResponse(response);
  }

  // ==================== Representative (Parshad/Pradhan) APIs ====================

  async getRepresentativeDashboard(): Promise<RepresentativeDashboardStats> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/parshad/dashboard`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async getRepresentativeIssues(params?: {
    page?: number;
    page_size?: number;
    issue_type?: string;
    status?: string;
  }): Promise<RepresentativeIssueListResponse> {
    const headers = await this.getAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.issue_type) queryParams.append('issue_type', params.issue_type);
    if (params?.status) queryParams.append('status', params.status);

    const response = await fetch(
      `${this.baseURL}/api/parshad/issues?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    return this.handleResponse(response);
  }

  async getRepresentativePendingIssues(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RepresentativeIssueListResponse> {
    const headers = await this.getAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await fetch(
      `${this.baseURL}/api/parshad/issues/pending?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    return this.handleResponse(response);
  }

  async getRepresentativeInProgressIssues(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RepresentativeIssueListResponse> {
    const headers = await this.getAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await fetch(
      `${this.baseURL}/api/parshad/issues/in-progress?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    return this.handleResponse(response);
  }

  async getRepresentativeIssueDetail(issueId: number): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/parshad/issues/${issueId}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async acknowledgeIssue(issueId: number): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/parshad/issues/${issueId}/acknowledge`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse(response);
  }

  async startWorkOnIssue(issueId: number, notes?: string): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await fetch(`${this.baseURL}/api/parshad/issues/${issueId}/start-work${queryParams}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse(response);
  }

  async completeIssue(issueId: number, notes?: string): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await fetch(`${this.baseURL}/api/parshad/issues/${issueId}/complete${queryParams}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse(response);
  }

  async updateIssueWithPhotos(data: {
    issueId: number;
    new_status: string;
    progress_notes?: string;
    photos?: { uri: string; name: string; type: string }[];
  }): Promise<RepresentativeIssue> {
    const token = await getAccessToken();
    
    const formData = new FormData();
    formData.append('new_status', data.new_status);
    if (data.progress_notes) {
      formData.append('progress_notes', data.progress_notes);
    }

    if (data.photos && data.photos.length > 0) {
      data.photos.forEach((photo) => {
        const file: any = {
          uri: photo.uri,
          name: photo.name,
          type: photo.type,
        };
        formData.append('photos', file);
      });
    }

    const response = await fetch(
      `${this.baseURL}/api/parshad/issues/${data.issueId}/update-with-photos`,
      {
        method: 'POST',
        headers: {
          'Authorization': token ? `Bearer ${token}` : '',
        },
        body: formData,
      }
    );

    if (!response.ok) {
      const error = await response.json().catch(() => ({ detail: 'Request failed' }));
      throw new Error(error.detail || 'Failed to update issue');
    }

    return response.json();
  }

  // Representative Review Issue (new flow)
  async reviewIssue(issueId: number, notes?: string): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await fetch(`${this.baseURL}/api/parshad/issues/${issueId}/review${queryParams}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse(response);
  }

  async getRepresentativePendingReviewIssues(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RepresentativeIssueListResponse> {
    const headers = await this.getAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());

    const response = await fetch(
      `${this.baseURL}/api/parshad/issues/pending-review?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );
    return this.handleResponse(response);
  }

  // ==================== PWD Worker APIs ====================

  async getPWDWorkerDashboard(): Promise<PWDWorkerDashboardStats> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/pwd/dashboard/worker`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async getPWDWorkerIssues(params?: {
    page?: number;
    page_size?: number;
    issue_type?: string;
    filter_type?: 'pending' | 'in_progress' | 'completed';
  }): Promise<RepresentativeIssueListResponse> {
    const headers = await this.getAuthHeaders();
    
    const queryParams = new URLSearchParams();
    if (params?.page) queryParams.append('page', params.page.toString());
    if (params?.page_size) queryParams.append('page_size', params.page_size.toString());
    if (params?.issue_type) queryParams.append('issue_type', params.issue_type);
    if (params?.filter_type) queryParams.append('filter_type', params.filter_type);

    const response = await fetch(
      `${this.baseURL}/api/pwd/my-issues?${queryParams.toString()}`,
      {
        method: 'GET',
        headers,
      }
    );

    return this.handleResponse(response);
  }

  async getPWDIssueDetail(issueId: number): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const response = await fetch(`${this.baseURL}/api/pwd/issues/${issueId}`, {
      method: 'GET',
      headers,
    });
    return this.handleResponse(response);
  }

  async pwdStartWork(issueId: number, notes?: string): Promise<RepresentativeIssue> {
    const headers = await this.getAuthHeaders();
    const queryParams = notes ? `?notes=${encodeURIComponent(notes)}` : '';
    const response = await fetch(`${this.baseURL}/api/pwd/issues/${issueId}/start-work${queryParams}`, {
      method: 'POST',
      headers,
    });
    return this.handleResponse(response);
  }

  async pwdCompleteWork(data: {
    issueId: number;
    description: string;
    photo: { uri: string; type: string; name: string };
  }): Promise<RepresentativeIssue> {
    const token = await getAccessToken();
    const formData = new FormData();
    formData.append('description', data.description);
    formData.append('photo', {
      uri: data.photo.uri,
      type: data.photo.type,
      name: data.photo.name,
    } as unknown as Blob);

    const response = await fetch(`${this.baseURL}/api/pwd/issues/${data.issueId}/complete-work`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${token}`,
        // Note: Don't set Content-Type for FormData, browser/RN will set it with boundary
      },
      body: formData,
    });
    return this.handleResponse(response);
  }

  // ==================== Locality APIs (Public) ====================

  async getLocalities(params?: {
    type?: LocalityType;
    search?: string;
  }): Promise<LocalityListPublicResponse> {
    const queryParams = new URLSearchParams();
    if (params?.type) queryParams.append('type', params.type);
    if (params?.search) queryParams.append('search', params.search);

    const response = await fetch(
      `${this.baseURL}/api/reports/localities/all?${queryParams.toString()}`,
      {
        method: 'GET',
      }
    );
    return this.handleResponse(response);
  }

  async getLocality(localityId: number): Promise<LocalityPublicResponse> {
    const response = await fetch(
      `${this.baseURL}/api/reports/localities/${localityId}`,
      {
        method: 'GET',
      }
    );
    return this.handleResponse(response);
  }

  // Legacy method aliases for backward compatibility
  async getParshadDashboard(): Promise<RepresentativeDashboardStats> {
    return this.getRepresentativeDashboard();
  }

  async getParshadIssues(params?: {
    page?: number;
    page_size?: number;
    issue_type?: string;
    status?: string;
  }): Promise<RepresentativeIssueListResponse> {
    return this.getRepresentativeIssues(params);
  }

  async getParshadPendingIssues(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RepresentativeIssueListResponse> {
    return this.getRepresentativePendingIssues(params);
  }

  async getParshadInProgressIssues(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RepresentativeIssueListResponse> {
    return this.getRepresentativeInProgressIssues(params);
  }

  async getParshadIssueDetail(issueId: number): Promise<RepresentativeIssue> {
    return this.getRepresentativeIssueDetail(issueId);
  }

  async getParshadPendingReviewIssues(params?: {
    page?: number;
    page_size?: number;
  }): Promise<RepresentativeIssueListResponse> {
    return this.getRepresentativePendingReviewIssues(params);
  }
}

export const apiService = new ApiService();

// Type aliases for backward compatibility
export type ParshadDashboardStats = RepresentativeDashboardStats;
export type ParshadIssue = RepresentativeIssue;
export type ParshadIssueListResponse = RepresentativeIssueListResponse;
export type ParshadInfo = RepresentativeInfoDetail;
