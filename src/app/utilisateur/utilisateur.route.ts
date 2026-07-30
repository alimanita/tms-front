import { Routes } from '@angular/router';
import { ListeUtilisateurs } from './liste-utilisateur/liste-utilisateur';
import { AddUtilisateur } from './add-utilisateur/add-utilisateur';

export const routes: Routes = [
  {
    path: '',
    component: ListeUtilisateurs
  },
  {
    path: 'create',
    component: AddUtilisateur
  }
];
