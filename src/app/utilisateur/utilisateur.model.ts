// src/app/routes/admin/utilisateur/utilisateur.model.ts

export interface Entreprise {
  id?: number;
  nom?: string;
  description?: string;
  codeFiscal?: string;
  photo?: string;
  email?: string;
  numTel?: string;
  steWeb?: string;
  matriculeFiscal?: string;
}

export interface Role {
  id?: number;
  roleName?: string;
}

export interface Utilisateur {
  id?: number;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  active?: boolean;
  driverId?: number;
  createdAt?: string;
  entreprise?: Entreprise;
  roles?: Role[];
}

export interface UtilisateurDto {
  id?: number;
  username?: string;
  fullName?: string;
  email?: string;
  phone?: string;
  password?: string;
  active?: boolean;
  driverId?: number;
  createdAt?: string;
  entreprise?: {
    id?: number;
    nom?: string;
  };
  roles?: Role[];
}

export interface ChangerMotDePasseDto {
  id: number;
  motDePasse: string;
  confirmMotDePasse: string;
}

export const ROLE_LABELS: { [key: string]: string } = {
  'ADMIN': 'Administrateur',
  'USER': 'Utilisateur',
  'MANAGER': 'Manager',
  'VENDEUR': 'Vendeur',
  'COMPTABLE': 'Comptable'
};