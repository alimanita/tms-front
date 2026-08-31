import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';

interface SettingsCard {
  icon: string;
  title: string;
  description: string;
  route: string;
  color: string;
  available: boolean;
}

@Component({
  selector: 'app-settings-hub',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './settings-hub.component.html',
  styleUrls: ['./settings-hub.component.scss'],
})
export class SettingsHubComponent {

  constructor(private router: Router) {}

  readonly cards: SettingsCard[] = [
    {
      icon: 'badge',
      title: 'Paramètres Chauffeurs',
      description: 'Configurez les informations visibles par les chauffeurs : tarif, coût, carburant.',
      route: '/fleet/settings/chauffeur',
      color: '#3b82f6',
      available: true,
    },
    {
      icon: 'directions_car',
      title: 'Paramètres Véhicules',
      description: 'Configurez les alertes, les seuils de kilométrage et les rappels d\'entretien.',
      route: '/fleet/settings/vehicule',
      color: '#8b5cf6',
      available: false,
    },
    {
      icon: 'local_gas_station',
      title: 'Paramètres Carburant',
      description: 'Définissez les types de carburant, les prix par défaut et les seuils de consommation.',
      route: '/fleet/settings/carburant',
      color: '#f59e0b',
      available: false,
    },
    {
      icon: 'build',
      title: 'Paramètres Entretien',
      description: 'Configurez les intervalles de maintenance, les alertes et les fournisseurs.',
      route: '/fleet/settings/entretien',
      color: '#10b981',
      available: false,
    },
    {
      icon: 'notifications',
      title: 'Paramètres Notifications',
      description: 'Gérez les alertes automatiques, les rappels et les destinataires.',
      route: '/fleet/settings/notifications',
      color: '#ef4444',
      available: false,
    },
    {
      icon: 'account_balance_wallet',
      title: 'Paramètres Financiers',
      description: 'Configurez les taux de TVA, les devises et les paramètres comptables.',
      route: '/fleet/settings/finance',
      color: '#06b6d4',
      available: false,
    },
  ];

  navigate(card: SettingsCard): void {
    if (card.available) {
      this.router.navigate([card.route]);
    }
  }
}
