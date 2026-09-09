import { Component, OnInit, ViewChild, ElementRef, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatTooltipModule } from '@angular/material/tooltip';
import { Router } from '@angular/router';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';

import { MissionService } from '../mission.service';
import { MissionResponse, StatutMission } from '../mission.model';
import { FleetService } from '../../fleet.service';
import { AuthService } from '@core';
import { isAdminRole } from 'app/core/authentication/helpers';



@Component({
  selector: 'app-mission-list',
  standalone: true,
  imports: [
    CommonModule, FormsModule, MatIconModule, MatMenuModule,
    MatDividerModule, MatProgressSpinnerModule, MatSnackBarModule,
    MatTooltipModule,
  ],
  templateUrl: './mission-list.component.html',
  styleUrls: ['./mission-list.component.scss'],
})
export class MissionListComponent implements OnInit {

  missions: MissionResponse[] = [];
  loading = false;

  isGestion = false;
  isChauffeurScope = false;
  monChauffeurId: number | null = null;

  // ── Paramètres de visibilité (pour chauffeurs) ──
  showTarif = true;
  showCout = true;
  showCarburant = true;

  // ── Filtres ────────────────────────────────────────────────────────────
  filterStatut: StatutMission | '' = '';
  filterDateDebut = '';
  filterDateFin = '';
  filterMode: 'ALL' | 'INTERNAL' | 'SUBCONTRACTED' = 'ALL';
  searchQuery = '';

  // ── Multi-select chauffeur ──────────────────────────────────────────
  chauffeurs: { id: number; nom: string }[] = [];
  selectedChauffeurIds: number[] = [];
  chauffeurSearch = '';
  showChauffeurDropdown = false;

  // ── Multi-select véhicule ───────────────────────────────────────────
  vehicules: { id: number; ref: string }[] = [];
  selectedVehiculeIds: number[] = [];
  vehiculeSearch = '';
  showVehiculeDropdown = false;

  get filteredChauffeurs(): { id: number; nom: string }[] {
    const term = this.chauffeurSearch.trim().toLowerCase();
    return term ? this.chauffeurs.filter(c => c.nom.toLowerCase().includes(term)) : this.chauffeurs;
  }

  get filteredVehicules(): { id: number; ref: string }[] {
    const term = this.vehiculeSearch.trim().toLowerCase();
    return term ? this.vehicules.filter(v => v.ref.toLowerCase().includes(term)) : this.vehicules;
  }

  isChauffeurSelected(id: number): boolean { return this.selectedChauffeurIds.includes(id); }
  isVehiculeSelected(id: number): boolean { return this.selectedVehiculeIds.includes(id); }

  toggleChauffeur(id: number): void {
    const idx = this.selectedChauffeurIds.indexOf(id);
    if (idx >= 0) this.selectedChauffeurIds.splice(idx, 1);
    else this.selectedChauffeurIds.push(id);
    this.onFilterChange();
  }

  toggleVehicule(id: number): void {
    const idx = this.selectedVehiculeIds.indexOf(id);
    if (idx >= 0) this.selectedVehiculeIds.splice(idx, 1);
    else this.selectedVehiculeIds.push(id);
    this.onFilterChange();
  }

  clearChauffeursFilter(): void {
    this.selectedChauffeurIds = [];
    this.chauffeurSearch = '';
    this.onFilterChange();
  }

  clearVehiculesFilter(): void {
    this.selectedVehiculeIds = [];
    this.vehiculeSearch = '';
    this.onFilterChange();
  }

  get chauffeurLabel(): string {
    if (!this.selectedChauffeurIds.length) return 'Tous les chauffeurs';
    return this.selectedChauffeurIds
      .map(id => this.chauffeurs.find(c => c.id === id)?.nom ?? '')
      .filter(Boolean)
      .join(', ');
  }

  get vehiculeLabel(): string {
    if (!this.selectedVehiculeIds.length) return 'Tous les véhicules';
    return this.selectedVehiculeIds
      .map(id => this.vehicules.find(v => v.id === id)?.ref ?? '')
      .filter(Boolean)
      .join(', ');
  }

  readonly statutOptions: { value: StatutMission | ''; label: string }[] = [
    { value: '', label: 'Tous les statuts' },
    { value: StatutMission.PLANNED, label: 'Planifiée' },
    { value: StatutMission.IN_PROGRESS, label: 'En cours' },
    { value: StatutMission.COMPLETED, label: 'Terminée' },
    { value: StatutMission.CANCELLED, label: 'Annulée' },
  ];

  // ── Pagination ─────────────────────────────────────────────────────────
  pageIndex = 0;
  pageSize = 10;
  totalPages = 0;
  totalElements = 0;

  // ── Sélection ──────────────────────────────────────────────────────────
  selectedRows = new Set<number>();
  allSelected = false;
  isAdmin = isAdminRole();
  readonly statut = StatutMission;

  // ── Modal Lettre de mission ──────────────────────────────────
  letterModalOpen = false;
  letterLoading   = false;
  letterIsImage   = false;
  letterSafeUrl: SafeUrl | null = null;
  private letterBlobUrl: string | null = null;
  private currentLetterMission: MissionResponse | null = null;

  @ViewChild('letterFileInput') letterFileInput!: ElementRef<HTMLInputElement>;
  uploadModalOpen = false;
  isDragging = false;
  selectedUploadFile: File | null = null;
  private missionIdForUpload: number | null = null;

  triggerUploadLetter(missionId: number): void {
    this.missionIdForUpload = missionId;
    this.uploadModalOpen = true;
    this.selectedUploadFile = null;
    this.isDragging = false;
  }

  closeUploadModal(): void {
    this.uploadModalOpen = false;
    this.selectedUploadFile = null;
    this.missionIdForUpload = null;
  }

  onLetterFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.handleUploadFile(file);
  }

  onDragOver(event: DragEvent): void {
    if (!this.uploadModalOpen) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    if (!this.uploadModalOpen) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    if (!this.uploadModalOpen) return;
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleUploadFile(files[0]);
    }
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    if (!this.uploadModalOpen) return;
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const newFile = new File([file], `lettre_collee_${new Date().getTime()}.png`, { type: file.type });
          this.handleUploadFile(newFile);
          break;
        }
      }
    }
  }

  handleUploadFile(file: File): void {
    this.selectedUploadFile = file;
  }

  confirmUploadLetter(): void {
    if (!this.selectedUploadFile || !this.missionIdForUpload) return;
    
    this.loading = true;
    this.missionService.uploadLetter(this.missionIdForUpload, this.selectedUploadFile).subscribe({
      next: () => {
        this.snackBar.open('Lettre de mission jointe avec succès', 'Fermer', { duration: 3000 });
        this.closeUploadModal();
        this.load();
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du téléchargement de la lettre', 'Fermer', { duration: 3000 });
      },
    });
  }

  // ── Totaux calculés sur la page courante ─────────────────────
   get totalRevenue(): number {
    return this.missions.reduce((s, m: any) => {
      if (m.modeExecution === 'SUBCONTRACTED') {
        return s + (m.montantCommission ?? 0);
      }
      return s + (m.revenue ?? 0);
    }, 0);
  }
  get totalFuel():    number { return this.missions.reduce((s, m) => s + (m.fuelCost ?? 0), 0); }
  get totalToll():    number { return this.missions.reduce((s, m) => s + (m.tollCost ?? 0), 0); }
  get totalOtherExpenses(): number { return this.missions.reduce((s, m) => s + (m.otherExpenses ?? 0), 0); }
  get totalCost():    number { return this.missions.reduce((s, m) => s + (m.totalCost ?? 0), 0); }

  // ── Multi-sort ────────────────────────────────────────────────
  sortCriteria: { column: string; direction: 'asc' | 'desc' }[] = [
    { column: 'plannedDeparture', direction: 'desc' }
  ];

  getSortDirection(column: string): 'asc' | 'desc' | null {
    const found = this.sortCriteria.find(c => c.column === column);
    return found ? found.direction : null;
  }

  getSortRank(column: string): number | null {
    const idx = this.sortCriteria.findIndex(c => c.column === column);
    return idx >= 0 ? idx + 1 : null;
  }

  sortBy(column: string): void {
    const existingIdx = this.sortCriteria.findIndex(c => c.column === column);
    if (existingIdx >= 0) {
      if (this.sortCriteria[existingIdx].direction === 'desc') {
        this.sortCriteria[existingIdx] = { column, direction: 'asc' };
      } else {
        this.sortCriteria.splice(existingIdx, 1);
      }
    } else {
      this.sortCriteria.unshift({ column, direction: 'desc' });
    }
    this.applySort();
  }

  private applySort(): void {
    const dateColumns = ['plannedDeparture'];
    this.missions = [...this.missions].sort((a: any, b: any) => {
      for (const criterion of this.sortCriteria) {
        let valA = a[criterion.column];
        let valB = b[criterion.column];
        if (dateColumns.includes(criterion.column)) {
          valA = valA ? new Date(valA).getTime() : 0;
          valB = valB ? new Date(valB).getTime() : 0;
        }
        if (valA == null) valA = '';
        if (valB == null) valB = '';
        const cmp = valA > valB ? 1 : valA < valB ? -1 : 0;
        if (cmp !== 0) return criterion.direction === 'asc' ? cmp : -cmp;
      }
      return 0;
    });
  }

  constructor(
    private missionService: MissionService,
    private router: Router,
    private chauffeurService: FleetService,
    private snackBar: MatSnackBar,
    private authService: AuthService,
    private sanitizer: DomSanitizer,
  ) {}

  ngOnInit(): void {
     this.isAdmin = isAdminRole();
    const isAdminOuSuperAdmin = this.authService.hasRole('SUPERADMIN')
      || this.authService.hasRole('SUPER_ADMIN')
      || this.authService.hasRole('ADMIN');

    this.isGestion = isAdminOuSuperAdmin
      || this.authService.hasRole('MANAGER')
      || this.authService.hasRole('VENDEUR');

    this.isChauffeurScope = !this.isGestion;

    this.load();

    if (this.isGestion) {
      this.loadChauffeurs();
      this.loadVehicules();
    }

    if (this.isChauffeurScope) {
      // Charger l'utilisateur courant pour obtenir les paramètres de visibilité
      this.authService.loadCurrentUser().subscribe({
        next: (user) => {
          if (user) {
            this.showTarif = user.showTarif ?? true;
            this.showCout = user.showCout ?? true;
            this.showCarburant = user.showCarburant ?? true;
            console.log('Paramètres visibilité:', { showTarif: this.showTarif, showCout: this.showCout, showCarburant: this.showCarburant });
          }
        },
        error: (err) => {
          console.error('Erreur lors de la récupération du profil:', err);
        }
      });
    }
  }

  load(): void {
    this.loading = true;

    if (this.isGestion) {
      this.missionService.findAll(this.pageIndex, this.pageSize).subscribe({
        next: page => {
          this.missions = this.applyClientFilters(page.content);
          this.totalPages = page.totalPages;
          this.totalElements = page.totalElements;
          this.loading = false;
        },
        error: () => {
          this.loading = false;
          this.snackBar.open('Erreur lors du chargement des missions', 'Fermer', { duration: 3000 });
        }
      });
      return;
    }

    this.missionService.findMesMissions().subscribe({
      next: (list) => {
        this.missions = this.applyClientFilters(list);
        this.totalElements = this.missions.length;
        this.totalPages = 1;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur lors du chargement de vos missions', 'Fermer', { duration: 3000 });
      }
    });
  }

  private applyClientFilters(list: MissionResponse[]): MissionResponse[] {
    return list.filter(m => {
      // Recherche textuelle (référence, titre, chauffeur, lieu départ/arrivée)
      if (this.searchQuery.trim()) {
        const q = this.searchQuery.trim().toLowerCase();
        const ref = (m.reference ?? '').toLowerCase();
        const title = ((m as any).title ?? '').toLowerCase();
        const chauffeurs = (m.chauffeurs ?? []).map((c: any) => `${c.chauffeurNom ?? ''} ${c.chauffeurPrenom ?? ''}`.toLowerCase()).join(' ');
        const lieuDepart = ((m as any).departureLocation ?? '').toLowerCase();
        const lieuArrivee = ((m as any).arrivalLocation ?? '').toLowerCase();
        const client = ((m as any).clientName ?? '').toLowerCase();
        if (!ref.includes(q) && !title.includes(q) && !chauffeurs.includes(q) && !lieuDepart.includes(q) && !lieuArrivee.includes(q) && !client.includes(q)) {
          return false;
        }
      }
      if (this.filterStatut && m.statut !== this.filterStatut) return false;
      if (this.filterMode === 'INTERNAL' && (m as any).modeExecution === 'SUBCONTRACTED') return false;
      if (this.filterMode === 'SUBCONTRACTED' && (m as any).modeExecution !== 'SUBCONTRACTED') return false;
      if (this.selectedChauffeurIds.length) {
        if (!m.chauffeurs || !m.chauffeurs.some(c => this.selectedChauffeurIds.includes(c.chauffeurId))) {
          return false;
        }
      }
      if (this.selectedVehiculeIds.length && !this.selectedVehiculeIds.includes((m as any).vehiculeId)) return false;
      if (this.filterDateDebut && m.plannedDeparture < this.filterDateDebut) return false;
      if (this.filterDateFin && m.plannedDeparture > this.filterDateFin) return false;
      return true;
    });
  }

  private loadChauffeurs(): void {
    // getChauffeursDisponibles() retourne directement un tableau ChauffeurResponse[]
    this.chauffeurService.getChauffeursDisponibles().subscribe({
      next: (list: any[]) => {
        this.chauffeurs = list.map(c => ({
          id: c.id,
          nom: `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()
        }));
      },
      error: () => {
        // Fallback: essai avec getChauffeurs paginé
        this.chauffeurService.getChauffeurs({ size: 200 }).subscribe({
          next: (page: any) => {
            const items: any[] = page.content ?? page;
            this.chauffeurs = items.map(c => ({
              id: c.id,
              nom: `${c.prenom ?? ''} ${c.nom ?? ''}`.trim()
            }));
          },
          error: () => {}
        });
      }
    });
  }

  private loadVehicules(): void {
    // getVehicules() retourne une page paginée { content: [...] }
    this.chauffeurService.getVehicules({ size: 200 }).subscribe({
      next: (page: any) => {
        const items: any[] = page.content ?? (Array.isArray(page) ? page : []);
        this.vehicules = items.map(v => ({
          id: v.id,
          ref: [v.reference, v.immatriculation].filter(Boolean).join(' — ')
        }));
      },
      error: () => {}
    });
  }

  onPageChange(event: { pageIndex: number; pageSize: number }): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
    this.load();
  }

  get startIndex(): number { return this.pageIndex * this.pageSize; }
  get endIndex(): number { return Math.min(this.startIndex + this.pageSize, this.totalElements); }

  toggleRow(id: number): void {
    this.selectedRows.has(id) ? this.selectedRows.delete(id) : this.selectedRows.add(id);
  }

  toggleAll(event: Event): void {
    const checked = (event.target as HTMLInputElement).checked;
    this.allSelected = checked;
    this.selectedRows = checked ? new Set(this.missions.map(m => m.id)) : new Set();
  }

  openAdd(): void { this.router.navigate(['/fleet/missions/new']); }
  openDetail(m: MissionResponse): void { this.router.navigate(['/fleet/missions', m.id]); }
  editMission(m: MissionResponse): void { this.router.navigate(['/fleet/missions', m.id, 'edit']); }

 demarrer(m: MissionResponse): void {
  this.missionService.demarrer(m.id, undefined).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission démarrée', 'Fermer', { duration: 2500 });
    },
    error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors du démarrage', 'Fermer', { duration: 3000 }),
  });
}

cloturer(m: MissionResponse): void {
  this.missionService.cloturer(m.id, undefined).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission clôturée', 'Fermer', { duration: 2500 });
    },
    error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors de la clôture', 'Fermer', { duration: 3000 }),
  });
}

annuler(m: MissionResponse): void {
  const motif = window.prompt("Motif de l'annulation :");
  if (!motif) return;
  this.missionService.annuler(m.id, motif).subscribe({
    next: (updated) => {
      this.updateMissionInList(updated);
      this.snackBar.open('Mission annulée', 'Fermer', { duration: 2500 });
    },
    error: () => this.snackBar.open("Erreur lors de l'annulation", 'Fermer', { duration: 3000 }),
  });
}

supprimer(m: MissionResponse): void {
  const confirmation = window.confirm(`Supprimer définitivement la mission ${m.reference} ?`);
  if (!confirmation) return;
  this.missionService.delete(m.id).subscribe({
    next: () => {
      this.missions = this.missions.filter(x => x.id !== m.id);
      this.snackBar.open('Mission supprimée avec succès', 'Fermer', { duration: 2500 });
    },
    error: (err) => this.snackBar.open(err.error?.message ?? 'Erreur lors de la suppression', 'Fermer', { duration: 3000 }),
  });
}

private updateMissionInList(updated: MissionResponse): void {
  const index = this.missions.findIndex(m => m.id === updated.id);
  if (index !== -1) {
    this.missions[index] = updated;
    this.missions = [...this.missions]; // nouvelle référence pour déclencher le re-render
  }
}
  getStatusClass(s: StatutMission): string {
    const map: Record<StatutMission, string> = {
      [StatutMission.PLANNED]: 'status-validee',
      [StatutMission.IN_PROGRESS]: 'status-partiel',
      [StatutMission.COMPLETED]: 'status-livree',
      [StatutMission.CANCELLED]: 'status-annulee',
    };
    return map[s] ?? 'status-validee';
  }

  getStatusLabel(s: StatutMission): string {
    return this.statutOptions.find(o => o.value === s)?.label ?? s;
  }

  formatDate(d?: string): string {
    if (!d) return '—';
    return new Date(d).toLocaleDateString('fr-FR', { day: '2-digit', month: '2-digit', year: 'numeric' });
  }

  onFilterChange(): void {
    this.pageIndex = 0;
    this.load();
  }

  resetFilters(): void {
    this.filterStatut = '';
    this.filterDateDebut = '';
    this.filterDateFin = '';
    this.filterMode = 'ALL';
    this.searchQuery = '';
    this.selectedChauffeurIds = [];
    this.selectedVehiculeIds = [];
    this.chauffeurSearch = '';
    this.vehiculeSearch = '';
    this.showChauffeurDropdown = false;
    this.showVehiculeDropdown = false;
    this.onFilterChange();
  }

  viewLetter(m: MissionResponse): void {
    if (!m.letterMissionUrl) return;
    this.letterModalOpen = true;
    this.letterLoading = true;
    this.currentLetterMission = m;

    this.missionService.downloadLetterBlob(m.id).subscribe({
      next: (blob) => {
        const contentType = blob.type || 'application/octet-stream';
        this.letterIsImage = contentType.startsWith('image/');

        if (this.letterBlobUrl) {
          window.URL.revokeObjectURL(this.letterBlobUrl);
        }
        const url = window.URL.createObjectURL(new Blob([blob], { type: contentType }));
        this.letterBlobUrl = url;
        this.letterSafeUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
        this.letterLoading = false;
      },
      error: () => {
        this.letterLoading = false;
        this.letterModalOpen = false;
        this.snackBar.open('Impossible de charger la lettre de mission', 'Fermer', { duration: 3000 });
      }
    });
  }

  closeLetterModal(): void {
    this.letterModalOpen = false;
    if (this.letterBlobUrl) {
      window.URL.revokeObjectURL(this.letterBlobUrl);
      this.letterBlobUrl = null;
    }
    this.letterSafeUrl = null;
    this.currentLetterMission = null;
  }

  downloadCurrentLetter(): void {
    if (!this.currentLetterMission) return;
    this.downloadLetter(this.currentLetterMission);
  }

  downloadLetter(m: MissionResponse): void {
    if (!m.letterMissionUrl) return;
    this.missionService.downloadLetterBlob(m.id).subscribe({
      next: (blob) => {
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `Lettre_Mission_${m.reference || m.id}`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: () => this.snackBar.open('Erreur lors du téléchargement de la lettre', 'Fermer', { duration: 3000 })
    });
  }

  /** Affiche les noms des chauffeurs tronqus : "Ali Ben" ou "Ali Ben, Sara +1" */
  getChauffeursLabel(m: MissionResponse): string {
    const slots = m.chauffeurs || [];
    if (slots.length === 0) return '-';
    
    // Si c'est un créneau multi-chauffeurs, afficher nom + heure
    if (slots.length === 1) {
        let text = slots[0].nom || '-';
        if (slots[0].heureDebut) text += ` (dès ${this.formatTime(slots[0].heureDebut)})`;
        return text;
    }

    const visible = slots.slice(0, 2).map(s => s.nom).join(', ');
    return slots.length > 2 ? `${visible} +${slots.length - 2}` : visible;
  }

  private formatTime(dt: string): string {
      if (!dt) return '';
      const d = new Date(dt);
      return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  }

  /** Texte du tooltip : liste numrote de tous les chauffeurs (si >1) */
  getChauffeursTooltip(m: MissionResponse): string {
    const slots = m.chauffeurs || [];
    if (slots.length === 0) return '';
    return slots.map((s, i) => {
        let t = `${i + 1}. ${s.nom}`;
        if (s.heureDebut || s.heureFin) {
            t += ` (${s.heureDebut ? this.formatTime(s.heureDebut) : '?'} -> ${s.heureFin ? this.formatTime(s.heureFin) : '?'})`;
        }
        return t;
    }).join('\n');
  }
}