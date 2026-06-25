export interface User {
  id: number;
  username: string;
  fullName: string;
  roles: string[];
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  expiresInMs: number;
  user: User;
}

export interface LoginRequest {
  username: string;
  password: string;
}

export interface ApiProblem {
  title?: string;
  detail?: string;
  status?: number;
  code?: string;
}
