import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { FleetService } from '../../fleet.service';
import { ChauffeurResponse, ChauffeurConfigRequest } from '../../chauffeurs/chauffeur.model';

@Component({
  selector: 'app-chauffeur-settings',
  standalone: true,
  imports: [CommonModule, FormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './chauffeur-settings.component.html',
  styleUrls: ['./chauffeur-settings.component.scss'],
})
export class ChauffeurSettingsComponent implements OnInit {

  chauffeurs: ChauffeurResponse[] = [];
  loading = false;
  saving = false;

  // Mode d'application
  isGlobal = true;
  selectedIds: Set<number> = new Set();

  // Toggles globaux (affichés quand isGlobal=true)
  globalShowTarif = true;
  globalShowCout = true;
  globalShowCarburant = true;

  // Recherche dans la liste des chauffeurs
  searchText = '';

  get filteredChauffeurs(): ChauffeurResponse[] {
    const term = this.searchText.trim().toLowerCase();
    return term
      ? this.chauffeurs.filter(c =>
          `${c.prenom} ${c.nom}`.toLowerCase().includes(term)
        )
      : this.chauffeurs;
  }

  constructor(
    private fleetService: FleetService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    this.loadChauffeurs();
  }

  loadChauffeurs(): void {
    this.loading = true;
    this.fleetService.getChauffeurs({ size: 1000 }).subscribe({
      next: (page: any) => {
        this.chauffeurs = page.content ?? page;
        // Initialiser les toggles globaux depuis le premier chauffeur (ou true par défaut)
        if (this.chauffeurs.length > 0) {
          this.globalShowTarif    = this.chauffeurs[0].showTarif    ?? true;
          this.globalShowCout     = this.chauffeurs[0].showCout     ?? true;
          this.globalShowCarburant= this.chauffeurs[0].showCarburant ?? true;
        }
        this.loading = false;
      },
      error: () => {
        this.snackBar.open('Erreur lors du chargement des chauffeurs', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  toggleChauffeur(id: number): void {
    this.selectedIds.has(id) ? this.selectedIds.delete(id) : this.selectedIds.add(id);
  }

  isSelected(id: number): boolean {
    return this.selectedIds.has(id);
  }

  selectAll(): void {
    this.chauffeurs.forEach(c => this.selectedIds.add(c.id));
  }

  clearSelection(): void {
    this.selectedIds.clear();
  }

  // Retourne les infos d'un chauffeur sélectionné (pour edition personnalisée)
  getChauffeurSetting(chauffeur: ChauffeurResponse): { showTarif: boolean; showCout: boolean; showCarburant: boolean } {
    return {
      showTarif:     chauffeur.showTarif     ?? true,
      showCout:      chauffeur.showCout      ?? true,
      showCarburant: chauffeur.showCarburant ?? true,
    };
  }

  // Sauvegarde
  save(): void {
    if (!this.isGlobal && this.selectedIds.size === 0) {
      this.snackBar.open('Veuillez sélectionner au moins un chauffeur.', 'Fermer', { duration: 3000 });
      return;
    }

    let request: ChauffeurConfigRequest;

    if (this.isGlobal) {
      request = {
        isGlobal: true,
        showTarif: this.globalShowTarif,
        showCout: this.globalShowCout,
        showCarburant: this.globalShowCarburant,
      };
    } else {
      // En mode personnalisé, on construit le payload à partir des valeurs individuelles
      // On applique les mêmes réglages globaux (les toggles sont partagés pour la selection)
      request = {
        isGlobal: false,
        chauffeurIds: Array.from(this.selectedIds),
        showTarif: this.globalShowTarif,
        showCout: this.globalShowCout,
        showCarburant: this.globalShowCarburant,
      };
    }

    this.saving = true;
    this.fleetService.updateChauffeurSettings(request).subscribe({
      next: (updated) => {
        // Mettre à jour la liste locale
        updated.forEach(u => {
          const idx = this.chauffeurs.findIndex(c => c.id === u.id);
          if (idx >= 0) this.chauffeurs[idx] = u;
        });
        this.snackBar.open('Paramètres sauvegardés avec succès !', 'Fermer', { duration: 3000 });
        this.saving = false;
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.saving = false;
      }
    });
  }
}
