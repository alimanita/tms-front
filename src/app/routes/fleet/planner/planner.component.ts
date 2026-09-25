import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { FleetService } from '../fleet.service';

@Component({
  selector: 'app-planner',
  standalone: true,
  imports: [CommonModule, FormsModule, HttpClientModule],
  templateUrl: './planner.component.html',
  styleUrls: ['./planner.component.scss']
})
export class PlannerComponent {
  dataSource: 'file' | 'db' = 'file';

  dbFilter = { statut: 'DISPONIBLE', startDate: '', endDate: '', minRevenue: null as number|null, departureCity: '', arrivalCity: '' };
  dbLoading = false;
  dbPage = 0;
  dbTotalElements = 0;
  importResult: { imported: number; skipped: number; total: number } | null = null;
  importLoading = false;

  constructor(private fleetService: FleetService) {}

  numTrucks: number = 1;
  maxEmptyPerTrip: number | null = null;
  maxEmptyTotal: number | null = null;
  maxTotalKm: number | null = null;
  maxWaitHours: number | null = null;
  minRevenue: number | null = null;
  startLocation: string = '';
  endLocation: string = '';
  // Vide par défaut = aucun filtre de date actif
  startDate: string = '';
  endDate: string = '';
  tripTypeFilter: 'ALL' | 'ONE_WAY' | 'ROUND_TRIP' = 'ALL';

  opportunities: any[] = [];
  trucks: any[] = [];
  totalFleetRevenue: number = 0;
  totalFleetEmpty: number = 0;
  totalFleetLoadedKm: number = 0;
  totalFleetKm: number = 0;
  totalJobs: number = 0;
  planGenerated: boolean = false;
  filteredCount: number = 0;
  totalOpportunities: number = 0;

  plans: any[] = [];
  selectedPlanIndex: number = 0;

  /** Panneau "courses proches" */
  nearbyPanel: {
    open: boolean;
    destinationCity: string;
    jobs: { job: any; emptyKm: number }[];
  } = { open: false, destinationCity: '', jobs: [] };

  /** Historique pour la navigation en chaîne (fil d'Ariane) */
  nearbyHistory: {
    city: string;
    panelState: { open: boolean; destinationCity: string; jobs: { job: any; emptyKm: number }[] };
  }[] = [];

  // ── Recherche De / À sur les résultats ───────────────────────────
  searchFrom: string = '';
  searchTo: string = '';
  searchMatchCount: number = 0;

  // ── Tri par tarif ────────────────────────────────────────────────
  tariffSort: 'none' | 'asc' | 'desc' = 'none';
  panelTariffSort: 'none' | 'asc' | 'desc' = 'none';

  // ── Filtre date dans le panneau courses proches ──────────────────
  panelDateFilter: string = '';

  // ── Modal Amazon Relay Paste ──────────────────────────────────────
  relayModalOpen: boolean = false;
  relayJsonText: string = '';
  relayParseError: string = '';
  relayPreviewCount: number = 0;
  relayImportLoading: boolean = false;
  relayImportResult: { imported: number; skipped: number; total: number } | null = null;


  async onFileChange(event: any) {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    let allOpportunities: any[] = [];

    const readFile = (file: File) => {
      return new Promise<any[]>((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = (e: any) => {
          try {
            const data = JSON.parse(e.target.result);
            resolve(data.workOpportunities || []);
          } catch (error) {
            reject(error);
          }
        };
        reader.onerror = (err) => reject(err);
        reader.readAsText(file);
      });
    };

    try {
      const filePromises = Array.from(files).map((file: any) => readFile(file));
      const results = await Promise.all(filePromises);
      const seenIds = new Set<string>();
      results.forEach(ops => {
        ops.forEach(op => {
          const key = op.id || `${op.startLocation?.city}_${op.endLocation?.city}_${op.firstPickupTime}_${op.payout?.value}`;
          if (!seenIds.has(key)) {
            seenIds.add(key);
            allOpportunities.push(op);
          }
        });
      });
      this.opportunities = allOpportunities;

      if (this.opportunities.length === 0) {
        alert('Aucune opportunité trouvée dans les fichiers JSON.');
        return;
      }
      this.generatePlan();
    } catch (error) {
      console.error('Erreur de parsing JSON:', error);
      alert("Erreur lors de la lecture d'un fichier JSON. Vérifiez le format.");
    }
  }

  // ── Calcul distance Haversine ─────────────────────────────────────

  getDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    if (!lat1 || !lon1 || !lat2 || !lon2) return 0;
    const R = 6371;
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a =
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
  }

  // ── Génération du planning ────────────────────────────────────────

  // ── Génération des plannings (Plan A, Plan B, Plan C) ─────────────

  generatePlan(): void {
    if (!this.opportunities || this.opportunities.length === 0) return;

    const parseNum = (val: any, defaultVal: number): number => {
      if (val === null || val === undefined || val === '') return defaultVal;
      const n = Number(val);
      return isNaN(n) ? defaultVal : n;
    };

    const startD: Date | null = this.startDate ? new Date(this.startDate) : null;
    const endD: Date | null = this.endDate ? new Date(this.endDate) : null;
    const minRev = parseNum(this.minRevenue, 0);
    const maxEmptyTrip = parseNum(this.maxEmptyPerTrip, Infinity);
    const maxEmptyTot = parseNum(this.maxEmptyTotal, Infinity);
    const maxTotKm = parseNum(this.maxTotalKm, Infinity);
    const maxWaitH = parseNum(this.maxWaitHours, Infinity);

    const validJobs = this.opportunities.filter(job => {
      const jobRevenue = job.payout ? Number(job.payout.value) : 0;
      if (jobRevenue < minRev) return false;

      if (!job.firstPickupTime || !job.lastDeliveryTime) return false;
      const jobStart = new Date(job.firstPickupTime);
      const jobEnd = new Date(job.lastDeliveryTime);
      if (isNaN(jobStart.getTime()) || isNaN(jobEnd.getTime())) return false;

      // Par défaut TOUTES les dates : filtre uniquement si spécifié par l'utilisateur
      if (startD && !isNaN(startD.getTime()) && jobStart < startD) return false;
      if (endD && !isNaN(endD.getTime()) && jobEnd > endD) return false;

      if (this.tripTypeFilter === 'ROUND_TRIP' && !this.isRoundTrip(job)) return false;
      if (this.tripTypeFilter === 'ONE_WAY' && this.isRoundTrip(job)) return false;

      return true;
    });

    this.filteredCount = validJobs.length;

    const numT = parseNum(this.numTrucks, 1);
    const constraints = { maxEmptyTrip, maxEmptyTot, maxTotKm, maxWaitH };

    // Génération des 3 variantes de plan (Plan A, Plan B, Plan C)
    const planA = this.buildPlanMaxRevenue([...validJobs], numT, constraints);
    planA.name = "Plan A";
    planA.tag = "💰 Max Revenu";
    planA.description = "Priorité aux courses générant le plus de chiffre d'affaires";

    const planB = this.buildPlanMinEmpty([...validJobs], numT, constraints);
    planB.name = "Plan B";
    planB.tag = "🍃 Min Km à Vide";
    planB.description = "Optimisation géographique pour minimiser les trajets à vide";

    const planC = this.buildPlanChronological([...validJobs], numT, constraints);
    planC.name = "Plan C";
    planC.tag = "⏱️ Chronologique";
    planC.description = "Enchaînement temporel fluide au fur et à mesure des départs";

    this.plans = [planA, planB, planC];
    this.planGenerated = true;
    this.selectPlan(0);
  }

  selectPlan(index: number): void {
    if (index < 0 || index >= this.plans.length) return;
    this.selectedPlanIndex = index;
    const plan = this.plans[index];
    this.trucks = plan.trucks;
    this.totalFleetRevenue = plan.totalFleetRevenue;
    this.totalFleetEmpty = plan.totalFleetEmpty;
    this.totalFleetLoadedKm = plan.totalFleetLoadedKm;
    this.totalFleetKm = plan.totalFleetKm;
    this.totalJobs = plan.totalJobs;
  }

  private createTruckList(numTrucks: number): any[] {
    const list: any[] = [];
    for (let i = 0; i < numTrucks; i++) {
      list.push({
        id: i + 1,
        currentLocation: (this.startLocation || '').trim() || null,
        currentLat: null as number | null,
        currentLng: null as number | null,
        currentTime: new Date(0),
        jobs: [] as any[],
        totalRevenue: 0,
        totalEmptyMileage: 0,
        totalLoadedMileage: 0,
        totalMileage: 0
      });
    }
    return list;
  }

  private calculateJobDistance(job: any): number {
    if (job.totalDistance && job.totalDistance.value) return Number(job.totalDistance.value);
    if (job.distanceKm) return Number(job.distanceKm);
    if (job.startLocation && job.endLocation && job.startLocation.latitude && job.endLocation.latitude) {
      return this.getDistance(
        job.startLocation.latitude, job.startLocation.longitude,
        job.endLocation.latitude, job.endLocation.longitude
      );
    }
    return 0;
  }

  private calculateEmptyDistance(truck: any, job: any): number {
    if (truck.currentLat !== null && truck.currentLng !== null && job.startLocation?.latitude) {
      return this.getDistance(
        truck.currentLat, truck.currentLng,
        job.startLocation.latitude, job.startLocation.longitude
      );
    }
    if (truck.currentLocation && job.startLocation?.city) {
      const truckCity = truck.currentLocation.toLowerCase().trim();
      const jobCity = (job.startLocation.city || '').toLowerCase().trim();
      if (truckCity && jobCity && truckCity !== jobCity) return 50;
    }
    return 0;
  }

  /** STRATÉGIE PLAN A : Maximiser le Revenu (Tri par tarif le plus élevé d'abord) */
  private buildPlanMaxRevenue(jobs: any[], numTrucks: number, c: any): any {
    const trucks = this.createTruckList(numTrucks);

    jobs.sort((a, b) => {
      const rA = a.payout ? Number(a.payout.value) : 0;
      const rB = b.payout ? Number(b.payout.value) : 0;
      return rB - rA;
    });

    jobs.forEach(job => {
      const jobStart = job.firstPickupTime ? new Date(job.firstPickupTime) : new Date(0);
      const jobEnd = job.lastDeliveryTime ? new Date(job.lastDeliveryTime) : new Date();
      const jobRev = job.payout ? Number(job.payout.value) : 0;
      const jobDist = this.calculateJobDistance(job);

      let bestTruck: any = null;
      let bestEmpty = Infinity;

      trucks.forEach(truck => {
        if (truck.currentTime <= jobStart) {
          if (truck.jobs.length > 0 && c.maxWaitH !== Infinity) {
            const waitH = (jobStart.getTime() - truck.currentTime.getTime()) / (1000 * 60 * 60);
            if (waitH > c.maxWaitH) return;
          }

          const emptyDist = this.calculateEmptyDistance(truck, job);
          const projectedTotalKm = truck.totalMileage + emptyDist + jobDist;

          if (
            emptyDist <= c.maxEmptyTrip &&
            (truck.totalEmptyMileage + emptyDist) <= c.maxEmptyTot &&
            projectedTotalKm <= c.maxTotKm &&
            emptyDist < bestEmpty
          ) {
            bestEmpty = emptyDist;
            bestTruck = truck;
          }
        }
      });

      if (bestTruck) {
        bestTruck.jobs.push({
          ...job,
          emptyMileageBefore: bestEmpty,
          loadedDistance: jobDist
        });
        bestTruck.totalRevenue += jobRev;
        bestTruck.totalEmptyMileage += bestEmpty;
        bestTruck.totalLoadedMileage += jobDist;
        bestTruck.totalMileage += (bestEmpty + jobDist);
        bestTruck.currentTime = jobEnd;
        bestTruck.currentLocation = job.endLocation?.city ?? 'Inconnu';
        bestTruck.currentLat = job.endLocation?.latitude ?? null;
        bestTruck.currentLng = job.endLocation?.longitude ?? null;
      }
    });

    return this.summarizePlanResult(trucks);
  }

  /** STRATÉGIE PLAN B : Minimiser le Km à Vide (Proximité géographique stricte) */
  private buildPlanMinEmpty(jobs: any[], numTrucks: number, c: any): any {
    const trucks = this.createTruckList(numTrucks);
    let remainingJobs = [...jobs];

    trucks.forEach(truck => {
      let candidateFound = true;
      while (candidateFound) {
        candidateFound = false;
        let bestJobIdx = -1;
        let bestEmpty = Infinity;
        let bestJobDist = 0;

        for (let i = 0; i < remainingJobs.length; i++) {
          const job = remainingJobs[i];
          const jobStart = job.firstPickupTime ? new Date(job.firstPickupTime) : new Date(0);
          if (truck.currentTime > jobStart) continue;

          if (truck.jobs.length > 0 && c.maxWaitH !== Infinity) {
            const waitH = (jobStart.getTime() - truck.currentTime.getTime()) / (1000 * 60 * 60);
            if (waitH > c.maxWaitH) continue;
          }

          const jobDist = this.calculateJobDistance(job);
          const emptyDist = this.calculateEmptyDistance(truck, job);
          const projectedTotalKm = truck.totalMileage + emptyDist + jobDist;

          if (
            emptyDist <= c.maxEmptyTrip &&
            (truck.totalEmptyMileage + emptyDist) <= c.maxEmptyTot &&
            projectedTotalKm <= c.maxTotKm &&
            emptyDist < bestEmpty
          ) {
            bestEmpty = emptyDist;
            bestJobIdx = i;
            bestJobDist = jobDist;
            candidateFound = true;
          }
        }

        if (bestJobIdx !== -1) {
          const selectedJob = remainingJobs.splice(bestJobIdx, 1)[0];
          const jobEnd = selectedJob.lastDeliveryTime ? new Date(selectedJob.lastDeliveryTime) : new Date();
          const jobRev = selectedJob.payout ? Number(selectedJob.payout.value) : 0;

          truck.jobs.push({
            ...selectedJob,
            emptyMileageBefore: bestEmpty,
            loadedDistance: bestJobDist
          });
          truck.totalRevenue += jobRev;
          truck.totalEmptyMileage += bestEmpty;
          truck.totalLoadedMileage += bestJobDist;
          truck.totalMileage += (bestEmpty + bestJobDist);
          truck.currentTime = jobEnd;
          truck.currentLocation = selectedJob.endLocation?.city ?? 'Inconnu';
          truck.currentLat = selectedJob.endLocation?.latitude ?? null;
          truck.currentLng = selectedJob.endLocation?.longitude ?? null;
        }
      }
    });

    trucks.forEach(t => {
      t.jobs.sort((a: any, b: any) => new Date(a.firstPickupTime).getTime() - new Date(b.firstPickupTime).getTime());
    });

    return this.summarizePlanResult(trucks);
  }

  /** STRATÉGIE PLAN C : Chronologique (Tri temporel strict) */
  private buildPlanChronological(jobs: any[], numTrucks: number, c: any): any {
    const trucks = this.createTruckList(numTrucks);

    jobs.sort((a, b) => {
      const tA = a.firstPickupTime ? new Date(a.firstPickupTime).getTime() : 0;
      const tB = b.firstPickupTime ? new Date(b.firstPickupTime).getTime() : 0;
      return tA - tB;
    });

    jobs.forEach(job => {
      const jobStart = job.firstPickupTime ? new Date(job.firstPickupTime) : new Date(0);
      const jobEnd = job.lastDeliveryTime ? new Date(job.lastDeliveryTime) : new Date();
      const jobRev = job.payout ? Number(job.payout.value) : 0;
      const jobDist = this.calculateJobDistance(job);

      let bestTruck: any = null;
      let bestEmpty = Infinity;

      trucks.forEach(truck => {
        if (truck.currentTime <= jobStart) {
          if (truck.jobs.length > 0 && c.maxWaitH !== Infinity) {
            const waitH = (jobStart.getTime() - truck.currentTime.getTime()) / (1000 * 60 * 60);
            if (waitH > c.maxWaitH) return;
          }

          const emptyDist = this.calculateEmptyDistance(truck, job);
          const projectedTotalKm = truck.totalMileage + emptyDist + jobDist;

          if (
            emptyDist <= c.maxEmptyTrip &&
            (truck.totalEmptyMileage + emptyDist) <= c.maxEmptyTot &&
            projectedTotalKm <= c.maxTotKm &&
            emptyDist < bestEmpty
          ) {
            bestEmpty = emptyDist;
            bestTruck = truck;
          }
        }
      });

      if (bestTruck) {
        bestTruck.jobs.push({
          ...job,
          emptyMileageBefore: bestEmpty,
          loadedDistance: jobDist
        });
        bestTruck.totalRevenue += jobRev;
        bestTruck.totalEmptyMileage += bestEmpty;
        bestTruck.totalLoadedMileage += jobDist;
        bestTruck.totalMileage += (bestEmpty + jobDist);
        bestTruck.currentTime = jobEnd;
        bestTruck.currentLocation = job.endLocation?.city ?? 'Inconnu';
        bestTruck.currentLat = job.endLocation?.latitude ?? null;
        bestTruck.currentLng = job.endLocation?.longitude ?? null;
      }
    });

    return this.summarizePlanResult(trucks);
  }

  private summarizePlanResult(trucks: any[]): any {
    const totalFleetRevenue = trucks.reduce((sum, t) => sum + t.totalRevenue, 0);
    const totalFleetEmpty = trucks.reduce((sum, t) => sum + t.totalEmptyMileage, 0);
    const totalFleetLoadedKm = trucks.reduce((sum, t) => sum + (t.totalLoadedMileage || 0), 0);
    const totalFleetKm = trucks.reduce((sum, t) => sum + (t.totalMileage || 0), 0);
    const totalJobs = trucks.reduce((sum, t) => sum + t.jobs.length, 0);

    return {
      name: '',
      tag: '',
      description: '',
      trucks,
      totalFleetRevenue,
      totalFleetEmpty,
      totalFleetLoadedKm,
      totalFleetKm,
      totalJobs
    };
  }

  // ── Panneau "courses proches" & Navigation en chaîne ──────────────

  /**
   * Ouvre le panneau initial pour une étape de camion
   */
  showNearbyJobs(job: any): void {
    this.nearbyHistory = [];
    const dest = job.endLocation;
    if (!dest) return;
    this.panelDateFilter = ''; // Par défaut TOUTES les dates
    this.performNearbySearch(dest);
  }

  /**
   * Enchaîne la recherche à partir de la destination d'une course du panneau
   */
  chainNearbySearch(nj: any): void {
    if (this.nearbyPanel.open && this.nearbyPanel.destinationCity) {
      // Sauvegarder l'état actuel dans l'historique
      this.nearbyHistory.push({
        city: this.nearbyPanel.destinationCity,
        panelState: {
          open: true,
          destinationCity: this.nearbyPanel.destinationCity,
          jobs: [...this.nearbyPanel.jobs]
        }
      });
    }

    const nextDest = nj.job.endLocation || nj.job.startLocation;
    if (!nextDest) return;
    this.panelDateFilter = ''; // Par défaut TOUTES les dates
    this.performNearbySearch(nextDest);
  }

  /**
   * Retourne à l'étape précédente du fil d'Ariane
   */
  goBackNearby(): void {
    if (this.nearbyHistory.length === 0) return;
    const prev = this.nearbyHistory.pop();
    if (prev) {
      this.nearbyPanel = prev.panelState;
    }
  }

  /**
   * Navigue directement vers un niveau du fil d'Ariane
   */
  goToHistoryStep(index: number): void {
    if (index < 0 || index >= this.nearbyHistory.length) return;
    const target = this.nearbyHistory[index];
    this.nearbyHistory = this.nearbyHistory.slice(0, index);
    this.nearbyPanel = target.panelState;
  }

  /**
   * Exécute la recherche de proximité selon le mode (file ou db)
   */
  private performNearbySearch(dest: any, afterDate?: string): void {
    if (this.dataSource === 'db') {
      this.showNearbyFromDb(dest, afterDate);
    } else {
      this.showNearbyFromFile(dest, afterDate);
    }
  }

  private showNearbyFromFile(dest: any, afterDate?: string): void {
    const destCity = (dest.city || '').toLowerCase().trim();
    const destLat: number | null = dest.latitude ?? null;
    const destLng: number | null = dest.longitude ?? null;

    // Calcule la distance du départ de chaque offre vers la destination du job (sans forcer de date si non demandée)
    const ranked = this.opportunities
      .filter(opp => {
        if (afterDate) {
          if (!opp.firstPickupTime) return false;
          const pTime = new Date(opp.firstPickupTime).getTime();
          const minPTime = new Date(afterDate).getTime();
          return !isNaN(pTime) && !isNaN(minPTime) && pTime >= minPTime;
        }
        return true;
      })
      .map(opp => {
        const depLat: number | null = opp.startLocation?.latitude ?? null;
        const depLng: number | null = opp.startLocation?.longitude ?? null;
        const depCity = (opp.startLocation?.city || '').toLowerCase().trim();

        let emptyKm = 0;

        if (destLat !== null && destLng !== null && depLat !== null && depLng !== null) {
          // Calcul précis par coordonnées
          emptyKm = this.getDistance(destLat, destLng, depLat, depLng);
        } else if (destCity && depCity) {
          // Fallback : même ville = 0, différente = 50 km estimé
          emptyKm = destCity === depCity ? 0 : 50;
        }

        return { job: opp, emptyKm: Math.round(emptyKm) };
      })
      // Trier par km à vide croissant, puis par revenu décroissant à égalité
      .sort((a, b) => {
        if (a.emptyKm !== b.emptyKm) return a.emptyKm - b.emptyKm;
        const revA = a.job.payout ? Number(a.job.payout.value) : 0;
        const revB = b.job.payout ? Number(b.job.payout.value) : 0;
        return revB - revA;
      })
      .slice(0, 50); // Top 50

    this.nearbyPanel = {
      open: true,
      destinationCity: dest.city || 'Inconnue',
      jobs: ranked
    };
  }

  private showNearbyFromDb(dest: any, afterDate?: string): void {
    const destLat = dest.latitude;
    const destLng = dest.longitude;
    if (destLat == null || destLng == null) {
      alert('Coordonnées de destination introuvables pour la recherche de proximité.');
      return;
    }

    const params: any = {
      lat: destLat,
      lng: destLng,
      radiusKm: 2500,
      limit: 50
    };
    if (afterDate) {
      params.afterDate = afterDate;
    }

    this.fleetService.getNearbyWorkOpportunities(params).subscribe({
      next: (data: any[]) => {
        this.nearbyPanel = {
          open: true,
          destinationCity: dest.city || 'Inconnue',
          // Chaque item est un WorkOpportunityResponse avec emptyKm
          jobs: data.map((item: any) => ({
            job: this.normalizeDbJob(item),
            emptyKm: Math.round(item.emptyKm ?? 0)
          }))
        };
      },
      error: (err: any) => {
        console.error('Error fetching nearby jobs from DB:', err);
        alert('Erreur lors de la recherche de courses proches.');
      }
    });
  }

  switchSource(source: 'file' | 'db'): void {
    this.dataSource = source;
    this.opportunities = [];
    this.planGenerated = false;
    this.trucks = [];
    this.importResult = null;
    this.closeNearby();
  }

  importToDb(): void {
    if (this.opportunities.length === 0) return;
    this.importLoading = true;
    this.fleetService.importWorkOpportunities('IMPORT', this.opportunities).subscribe({
      next: (res: any) => {
        this.importResult = {
          imported: res.imported || 0,
          skipped: res.skipped || 0,
          total: res.total || 0
        };
        this.importLoading = false;
      },
      error: (err: any) => {
        console.error('Import error:', err);
        this.importLoading = false;
        alert('Erreur lors de l\'importation en base de données.');
      }
    });
  }

  loadFromDb(): void {
    this.dbLoading = true;
    const params: any = {
      ...this.dbFilter,
      page: this.dbPage,
      size: 500
    };
    if (!params.startDate) delete params.startDate;
    if (!params.endDate) delete params.endDate;
    if (!params.minRevenue) delete params.minRevenue;
    if (!params.departureCity) delete params.departureCity;
    if (!params.arrivalCity) delete params.arrivalCity;

    this.fleetService.getWorkOpportunities(params).subscribe({
      next: (data: any) => {
        // Normalise les champs DB → même format que le JSON importé
        this.opportunities = (data.content || []).map((item: any) => this.normalizeDbJob(item));
        this.dbTotalElements = data.totalElements || 0;
        this.dbLoading = false;
        this.generatePlan();
      },
      error: (err: any) => {
        console.error('Error loading from DB:', err);
        this.dbLoading = false;
        alert('Erreur lors du chargement depuis la base de données.');
      }
    });
  }

  /**
   * Convertit un WorkOpportunityResponse (format DB plat)
   * vers le format JSON attendu par generatePlan() et le template.
   */
  private normalizeDbJob(item: any): any {
    return {
      // Champs DB directs
      id: item.id,
      externalId: item.externalId,
      statut: item.statut,
      notes: item.notes,
      // Dates (déjà en ISO string depuis le backend JSON)
      firstPickupTime: item.firstPickupTime,
      lastDeliveryTime: item.lastDeliveryTime,
      // Revenu — format JSON { value, unit }
      payout: { value: item.payoutValue, unit: item.payoutUnit || 'EUR' },
      // Départ — format JSON { city, latitude, longitude }
      startLocation: {
        city: item.departureCity,
        latitude: item.departureLat,
        longitude: item.departureLng
      },
      // Arrivée — format JSON { city, latitude, longitude }
      endLocation: {
        city: item.arrivalCity,
        latitude: item.arrivalLat,
        longitude: item.arrivalLng
      },
      // Distance — format JSON { value }
      totalDistance: item.distanceKm != null ? { value: item.distanceKm } : null,
    };
  }

  // ── Recherche De / À ─────────────────────────────────────────────

  /** Retourne true si le job correspond aux filtres De/À actifs */
  jobMatchesSearch(job: any): boolean {
    if (!this.searchFrom && !this.searchTo) return true;
    const depCity = (job.startLocation?.city || '').toLowerCase();
    const arrCity = (job.endLocation?.city || '').toLowerCase();
    const from = this.searchFrom.toLowerCase().trim();
    const to = this.searchTo.toLowerCase().trim();
    const matchFrom = !from || depCity.includes(from);
    const matchTo = !to || arrCity.includes(to);
    return matchFrom && matchTo;
  }

  /** Retourne true si une ville contient le terme de recherche (pour le surlignage) */
  matchesCity(city: string | undefined, term: string): boolean {
    if (!term || !city) return false;
    return city.toLowerCase().includes(term.toLowerCase().trim());
  }

  /** Nombre de jobs visibles pour un camion donné */
  getVisibleJobsCount(truck: any): number {
    return (truck.jobs || []).filter((j: any) => this.jobMatchesSearch(j)).length;
  }

  /** Recalcule searchMatchCount sur tous les camions */
  onSearchChange(): void {
    this.searchMatchCount = this.trucks.reduce((sum, t) =>
      sum + (t.jobs || []).filter((j: any) => this.jobMatchesSearch(j)).length, 0
    );
  }

  resetSearch(): void {
    this.searchFrom = '';
    this.searchTo = '';
    this.searchMatchCount = 0;
  }

  // ── Tri par tarif ────────────────────────────────────────────────

  toggleTariffSort(): void {
    if (this.tariffSort === 'none') {
      this.tariffSort = 'desc'; // Plus cher d'abord
    } else if (this.tariffSort === 'desc') {
      this.tariffSort = 'asc';  // Moins cher d'abord
    } else {
      this.tariffSort = 'none'; // Ordre chronologique du planning
    }
  }

  togglePanelTariffSort(): void {
    if (this.panelTariffSort === 'none') {
      this.panelTariffSort = 'desc'; // Plus cher d'abord
    } else if (this.panelTariffSort === 'desc') {
      this.panelTariffSort = 'asc';  // Moins cher d'abord
    } else {
      this.panelTariffSort = 'none'; // Tri par distance à vide
    }
  }

  getFilteredAndSortedJobs(truck: any): any[] {
    const list = (truck.jobs || []).filter((j: any) => this.jobMatchesSearch(j));
    if (this.tariffSort === 'desc') {
      return [...list].sort((a, b) => (Number(b.payout?.value) || 0) - (Number(a.payout?.value) || 0));
    } else if (this.tariffSort === 'asc') {
      return [...list].sort((a, b) => (Number(a.payout?.value) || 0) - (Number(b.payout?.value) || 0));
    }
    return list;
  }

  getSortedPanelJobs(): { job: any; emptyKm: number }[] {
    let list = this.nearbyPanel.jobs || [];

    // Filtre par date exacte de départ si spécifié (ex: "2026-09-25")
    if (this.panelDateFilter) {
      const targetDateStr = this.panelDateFilter.substring(0, 10);
      list = list.filter(item => {
        if (!item.job?.firstPickupTime) return false;
        const pickupDateStr = item.job.firstPickupTime.substring(0, 10);
        return pickupDateStr === targetDateStr;
      });
    }

    if (this.panelTariffSort === 'desc') {
      return [...list].sort((a, b) => (Number(b.job.payout?.value) || 0) - (Number(a.job.payout?.value) || 0));
    } else if (this.panelTariffSort === 'asc') {
      return [...list].sort((a, b) => (Number(a.job.payout?.value) || 0) - (Number(b.job.payout?.value) || 0));
    }
    return list;
  }

  closeNearby(): void {
    this.nearbyPanel = { open: false, destinationCity: '', jobs: [] };
    this.panelDateFilter = '';
  }

  isRoundTrip(job: any): boolean {
    if (!job) return false;
    if (job.workOpportunityType === 'ROUND_TRIP') return true;
    const startCity = (job.startLocation?.city || job.departureCity || '').trim().toLowerCase();
    const endCity = (job.endLocation?.city || job.arrivalCity || '').trim().toLowerCase();
    if (startCity && endCity && startCity === endCity) {
      return true;
    }
    const stops = this.getJobStops(job);
    if (stops.length > 2) {
      const first = (stops[0]?.city || '').trim().toLowerCase();
      const last = (stops[stops.length - 1]?.city || '').trim().toLowerCase();
      if (first && last && first === last) {
        return true;
      }
    }
    return false;
  }

  getJobStops(job: any): any[] {
    if (!job) return [];
    if (job.stops && Array.isArray(job.stops)) return job.stops;
    if (job.loads && Array.isArray(job.loads) && job.loads[0]?.stops && Array.isArray(job.loads[0].stops)) {
      return job.loads[0].stops.map((s: any) => ({
        city: s.location?.city || s.city || '',
        type: s.stopType || '',
        sequence: s.stopSequenceNumber || 0,
        time: s.actions?.[0]?.plannedTime || s.plannedTime || null
      }));
    }
    return [];
  }

  getRouteSummary(job: any): string {
    const stops = this.getJobStops(job);
    if (stops.length > 2) {
      const cities = stops.map(s => s.city).filter(Boolean);
      return cities.join(' ➔ ');
    }
    return '';
  }

  // ── Modal Amazon Relay : Coller JSON ──────────────────────────────

  openRelayModal(): void {
    this.relayModalOpen = true;
    this.relayJsonText = '';
    this.relayParseError = '';
    this.relayPreviewCount = 0;
    this.relayImportResult = null;
  }

  closeRelayModal(): void {
    this.relayModalOpen = false;
  }

  clearRelayModal(): void {
    this.relayJsonText = '';
    this.relayParseError = '';
    this.relayPreviewCount = 0;
    this.relayImportResult = null;
  }

  /** Appelé à chaque collage (Ctrl+V) pour détecter immédiatement les offres */
  onRelayPaste(event: ClipboardEvent): void {
    // On laisse NgModel mettre à jour relayJsonText, puis on parse
    setTimeout(() => this.parseRelayJson(), 50);
  }

  /** Parse le JSON collé et compte les offres détectées */
  private parseRelayJson(): void {
    this.relayParseError = '';
    this.relayPreviewCount = 0;
    const text = this.relayJsonText.trim();
    if (!text) return;
    try {
      const parsed = JSON.parse(text);
      const items = this.extractRelayItems(parsed);
      if (items.length === 0) {
        this.relayParseError = 'Aucune offre trouvée dans ce JSON. Vérifiez que vous avez copié la bonne réponse (requête "search").';
      } else {
        this.relayPreviewCount = items.length;
      }
    } catch (e) {
      this.relayParseError = 'JSON invalide. Vérifiez que vous avez tout copié (pas de coupure).';
    }
  }

  /** Extrait le tableau d'offres depuis la structure Amazon Relay */
  private extractRelayItems(parsed: any): any[] {
    if (Array.isArray(parsed)) return parsed;
    if (parsed.workOpportunities && Array.isArray(parsed.workOpportunities)) return parsed.workOpportunities;
    if (parsed.searchResults && Array.isArray(parsed.searchResults)) return parsed.searchResults;
    if (parsed.data && Array.isArray(parsed.data)) return parsed.data;
    return [];
  }

  /** Convertit un item Amazon Relay vers le format TMS */
  private normalizeRelayItem(item: any): any {
    let startLocation: any = null;
    let endLocation: any = null;

    // Extraire depuis stops[]
    if (Array.isArray(item.stops) && item.stops.length > 0) {
      const pickupStop = item.stops.find((s: any) =>
        s.stopType === 'PICKUP' || s.type === 'PICKUP'
      ) || item.stops[0];

      const dropoffStop = [...item.stops].reverse().find((s: any) =>
        s.stopType === 'DROPOFF' || s.type === 'DROPOFF'
      ) || item.stops[item.stops.length - 1];

      if (pickupStop?.location) {
        startLocation = {
          city:      pickupStop.location.city || pickupStop.location.label || '',
          latitude:  pickupStop.location.latitude  || null,
          longitude: pickupStop.location.longitude || null
        };
      }
      if (dropoffStop?.location) {
        endLocation = {
          city:      dropoffStop.location.city || dropoffStop.location.label || '',
          latitude:  dropoffStop.location.latitude  || null,
          longitude: dropoffStop.location.longitude || null
        };
      }
    }

    // Extraire depuis loads[].stops[] (autre format Amazon Relay)
    if (!startLocation && Array.isArray(item.loads) && item.loads[0]?.stops) {
      const stops = item.loads[0].stops;
      const first = stops[0];
      const last  = stops[stops.length - 1];
      if (first?.location) startLocation = { city: first.location.city || '', latitude: first.location.latitude, longitude: first.location.longitude };
      if (last?.location)  endLocation   = { city: last.location.city  || '', latitude: last.location.latitude,  longitude: last.location.longitude  };
    }

    // Fallback direct
    if (!startLocation && item.startLocation) startLocation = item.startLocation;
    if (!endLocation   && item.endLocation)   endLocation   = item.endLocation;

    // Payout
    let payout = item.payout || null;
    if (!payout && item.payoutValue) payout = { value: item.payoutValue, unit: item.payoutUnit || 'EUR' };

    // Distance
    let totalDistance = item.totalDistance || null;
    if (!totalDistance && item.distanceKm) totalDistance = { value: item.distanceKm };

    return {
      id:               item.id || null,
      firstPickupTime:  item.firstPickupTime  || item.pickupTime  || null,
      lastDeliveryTime: item.lastDeliveryTime || item.deliveryTime || null,
      payout,
      totalDistance,
      startLocation,
      endLocation,
      cargoType: item.cargoType || item.equipmentType || null,
      notes:     item.notes || null
    };
  }

  /** Importe les offres collées vers la base de données */
  importRelayJson(): void {
    const text = this.relayJsonText.trim();
    if (!text) return;

    let items: any[] = [];
    try {
      const parsed = JSON.parse(text);
      items = this.extractRelayItems(parsed).map(i => this.normalizeRelayItem(i));
    } catch (e) {
      this.relayParseError = 'Erreur de parsing JSON.';
      return;
    }

    if (items.length === 0) {
      this.relayParseError = 'Aucune offre à importer.';
      return;
    }

    this.relayImportLoading = true;
    this.relayImportResult = null;

    this.fleetService.importWorkOpportunities('AMAZON_RELAY', items).subscribe({
      next: (res: any) => {
        this.relayImportResult = {
          imported: res.imported || 0,
          skipped:  res.skipped  || 0,
          total:    res.total    || 0
        };
        this.relayImportLoading = false;
        // Recharger les opportunités si on est en mode DB
        if (this.dataSource === 'db') this.loadFromDb();
      },
      error: (err: any) => {
        console.error('Relay import error:', err);
        this.relayParseError = 'Erreur lors de l\'importation. Le backend TMS est-il démarré ?';
        this.relayImportLoading = false;
      }
    });
  }
}
