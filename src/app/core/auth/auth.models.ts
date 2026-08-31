export interface User {
  id: number;
  username: string;
  fullName: string;
  entrepriseId: number;
  roles: string[];
  // Paramètres visibilité chauffeur
  showTarif?: boolean;
  showCout?: boolean;
  showCarburant?: boolean;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  tokenType: string;
  utilisateur: User;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface ApiProblem {
  title?: string;
  detail?: string;
  status?: number;
  code?: string;
}
