import { Component, inject, OnInit, OnDestroy, signal, ViewEncapsulation } from '@angular/core';
import { AsyncPipe, DecimalPipe, NgClass } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TmsApiService } from '../../core/services/tms-api.service';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { forkJoin } from 'rxjs';

interface TrackingVehicle {
  id: number;
  registration: string;
  brand: string;
  model: string;
  driverName: string;
  status: 'ACTIVE' | 'IDLE' | 'STOPPED' | 'OFFLINE';
  speed: number; // km/h
  fuel: number; // %
  temp: number; // °C
  lat: number;
  lng: number;
  angle: number;
  lastUpdated: Date;
  batteryVoltage: number; // V
  obdDiagnostics: string; // DTC status
  selected?: boolean;
}

interface LiveAlert {
  time: string;
  vehicle: string;
  type: string;
  severity: 'warning' | 'danger' | 'info';
  message: string;
}

@Component({
  selector: 'app-fleet-tracking',
  imports: [NgClass, FormsModule, MatCardModule, MatIconModule, MatButtonModule, MatProgressSpinnerModule, DecimalPipe],
  templateUrl: './fleet-tracking.component.html',
  styleUrl: './fleet-tracking.component.scss',
  encapsulation: ViewEncapsulation.None // So leaflet styles map correctly
})
export class FleetTrackingComponent implements OnInit, OnDestroy {
  private readonly api = inject(TmsApiService);
  
  protected readonly loading = signal(true);
  protected readonly vehicles = signal<TrackingVehicle[]>([]);
  protected readonly filteredVehicles = signal<TrackingVehicle[]>([]);
  protected readonly selectedVehicle = signal<TrackingVehicle | null>(null);
  protected readonly alerts = signal<LiveAlert[]>([]);

  // Search & Filter
  protected searchQuery = '';
  protected statusFilter: 'ALL' | 'ACTIVE' | 'STOPPED' | 'OFFLINE' = 'ALL';

  private map: any = null;
  private markersMap: Map<number, any> = new Map();
  private simulationIntervalId: any = null;

  // France cities coordinates to simulate tracks
  private routePoints = [
    { name: 'Paris', lat: 48.8566, lng: 2.3522 },
    { name: 'Lille', lat: 50.6292, lng: 3.0573 },
    { name: 'Lyon', lat: 45.7640, lng: 4.8357 },
    { name: 'Marseille', lat: 43.2965, lng: 5.3698 },
    { name: 'Nantes', lat: 47.2184, lng: -1.5536 },
    { name: 'Strasbourg', lat: 48.5734, lng: 7.7521 },
    { name: 'Bordeaux', lat: 44.8378, lng: -0.5792 },
    { name: 'Toulouse', lat: 43.6047, lng: 1.4442 }
  ];

  ngOnInit(): void {
    this.loadLeaflet().then(() => {
      this.loadData();
      this.startSimulation();
      this.initializeAlerts();
    });
  }

  ngOnDestroy(): void {
    if (this.simulationIntervalId) {
      clearInterval(this.simulationIntervalId);
    }
    if (this.map) {
      this.map.remove();
    }
  }

  private loadLeaflet(): Promise<void> {
    if ((window as any)['L']) {
      return Promise.resolve();
    }
    return new Promise((resolve, reject) => {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.css';
      document.head.appendChild(link);

      const script = document.createElement('script');
      script.src = 'https://unpkg.com/leaflet@1.9.4/dist/leaflet.js';
      script.onload = () => resolve();
      script.onerror = (err) => reject(err);
      document.body.appendChild(script);
    });
  }

  private loadData(): void {
    this.loading.set(true);
    
    // Fetch vehicles and drivers to correlate drivers and simulate coordinates
    forkJoin({
      vehicles: this.api.list<{ id: number; registration: string; brand: string; model: string; status: string; currentMileage: number }>('/api/v1/vehicles'),
      drivers: this.api.list<{ id: number; firstName: string; lastName: string; active: boolean }>('/api/v1/drivers')
    }).subscribe({
      next: ({ vehicles, drivers }) => {
        const driversList = drivers.content || [];
        const trackingList: TrackingVehicle[] = (vehicles.content || []).map((v, index) => {
          // Assign driver or default
          const driver = driversList[index % driversList.length];
          const driverName = driver ? `${driver.firstName} ${driver.lastName}` : 'Chauffeur Non Assigné';
          
          // Generate simulated telemetry data
          const cityPoint = this.routePoints[index % this.routePoints.length];
          // Give minor offsets to coordinates so they don't overlap exactly
          const offsetLat = (Math.random() - 0.5) * 0.15;
          const offsetLng = (Math.random() - 0.5) * 0.15;

          const statuses: ('ACTIVE' | 'IDLE' | 'STOPPED' | 'OFFLINE')[] = ['ACTIVE', 'ACTIVE', 'STOPPED', 'IDLE', 'OFFLINE'];
          const status = statuses[index % statuses.length];

          const speed = status === 'ACTIVE' ? Math.floor(65 + Math.random() * 25) : (status === 'IDLE' ? 0 : 0);
          const fuel = Math.floor(40 + Math.random() * 55);
          const temp = status === 'ACTIVE' ? Math.floor(82 + Math.random() * 8) : 22;

          return {
            id: v.id,
            registration: v.registration,
            brand: v.brand || 'Volvo',
            model: v.model || 'FH16',
            driverName,
            status,
            speed,
            fuel,
            temp,
            lat: cityPoint.lat + offsetLat,
            lng: cityPoint.lng + offsetLng,
            angle: Math.floor(Math.random() * 360),
            lastUpdated: new Date(),
            batteryVoltage: 24.1 + Math.random() * 1.2,
            obdDiagnostics: Math.random() > 0.9 ? 'DTC P0113 (Pression Admission)' : 'Pas de code défaut'
          };
        });

        this.vehicles.set(trackingList);
        this.applyFilters();
        this.initializeMap();
        this.loading.set(false);
      },
      error: () => {
        this.loading.set(false);
      }
    });
  }

  private initializeMap(): void {
    setTimeout(() => {
      const L = (window as any)['L'];
      if (!L) return;

      this.map = L.map('tracking-map', {
        zoomControl: false,
        attributionControl: false
      }).setView([46.6033, 1.8883], 6); // Center of France

      L.tileLayer('https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png', {
        maxZoom: 20
      }).addTo(this.map);

      // Add zoom control to bottom right
      L.control.zoom({ position: 'bottomright' }).addTo(this.map);

      // Plot markers
      this.updateMapMarkers();
    }, 100);
  }

  private updateMapMarkers(): void {
    const L = (window as any)['L'];
    if (!L || !this.map) return;

    // Clear old markers
    this.markersMap.forEach((marker) => marker.remove());
    this.markersMap.clear();

    const list = this.filteredVehicles();
    list.forEach((v) => {
      // Setup marker color by status
      const color = this.getStatusColor(v.status);
      const pulseClass = v.status === 'ACTIVE' ? 'marker-pulse' : '';

      const customHtml = `
        <div class="custom-map-marker ${v.status.toLowerCase()} ${pulseClass}" style="border-color: ${color}">
          <div class="marker-center" style="background-color: ${color}"></div>
        </div>
      `;

      const icon = L.divIcon({
        className: 'div-icon-wrapper',
        html: customHtml,
        iconSize: [28, 28],
        iconAnchor: [14, 14]
      });

      const marker = L.marker([v.lat, v.lng], { icon }).addTo(this.map);
      
      // Bind click
      marker.on('click', () => {
        this.selectVehicle(v);
      });

      // Bind tooltip
      marker.bindTooltip(`
        <div class="marker-tooltip">
          <strong>${v.registration}</strong> (${v.brand})<br/>
          <span>${v.driverName}</span><br/>
          <strong>${v.speed} km/h</strong> | ${v.fuel}% Carburant
        </div>
      `, { direction: 'top', offset: [0, -10] });

      this.markersMap.set(v.id, marker);
    });
  }

  protected selectVehicle(vehicle: TrackingVehicle): void {
    // Unselect previous
    const updated = this.vehicles().map((v) => ({
      ...v,
      selected: v.id === vehicle.id
    }));
    this.vehicles.set(updated);
    this.applyFilters();

    const selected = updated.find((v) => v.id === vehicle.id) || null;
    this.selectedVehicle.set(selected);

    // Pan to vehicle coordinates
    if (selected && this.map) {
      this.map.panTo([selected.lat, selected.lng]);
    }
  }

  protected applyFilters(): void {
    let list = this.vehicles();

    // Query search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      list = list.filter((v) => 
        v.registration.toLowerCase().includes(q) || 
        v.brand.toLowerCase().includes(q) || 
        v.model.toLowerCase().includes(q) || 
        v.driverName.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.statusFilter !== 'ALL') {
      list = list.filter((v) => v.status === this.statusFilter);
    }

    this.filteredVehicles.set(list);
    this.updateMapMarkers();
  }

  protected setSearch(q: string): void {
    this.searchQuery = q;
    this.applyFilters();
  }

  protected setFilter(filter: 'ALL' | 'ACTIVE' | 'STOPPED' | 'OFFLINE'): void {
    this.statusFilter = filter;
    this.applyFilters();
  }

  // Simulation: Move vehicles slightly and update speeds/telemetry in real time
  private startSimulation(): void {
    this.simulationIntervalId = setInterval(() => {
      let alertAdded = false;

      const updated = this.vehicles().map((v) => {
        if (v.status === 'OFFLINE' || v.status === 'STOPPED') {
          return v;
        }

        // Simulating speed fluctuations
        let speed = v.speed;
        let lat = v.lat;
        let lng = v.lng;

        if (v.status === 'ACTIVE') {
          speed = Math.max(50, Math.min(110, v.speed + Math.floor((Math.random() - 0.5) * 10)));
          
          // Move slightly in current direction (angle)
          const angleRad = (v.angle * Math.PI) / 180;
          // ~0.001 deg coordinate change per cycle
          lat += Math.cos(angleRad) * 0.0012;
          lng += Math.sin(angleRad) * 0.0012;

          // Occasionally trigger alert for harsh events
          if (speed > 105 && Math.random() > 0.85 && !alertAdded) {
            this.pushAlert({
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              vehicle: v.registration,
              type: 'EXCÈS DE VITESSE',
              severity: 'danger',
              message: `Vitesse de ${speed} km/h enregistrée.`
            });
            alertAdded = true;
          }
        } else if (v.status === 'IDLE') {
          // Occasional engine idle warning
          if (Math.random() > 0.95 && !alertAdded) {
            this.pushAlert({
              time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
              vehicle: v.registration,
              type: 'MOTEUR AU RALENTI',
              severity: 'warning',
              message: `Ralenti prolongé (> 10 min) détecté.`
            });
            alertAdded = true;
          }
        }

        // Slowly consume fuel
        const fuel = Math.max(5, v.fuel - (v.status === 'ACTIVE' ? 0.015 : 0.002));
        if (fuel < 10 && Math.random() > 0.9 && !alertAdded) {
          this.pushAlert({
            time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
            vehicle: v.registration,
            type: 'CARBURANT BAS',
            severity: 'danger',
            message: `Niveau de carburant à ${fuel.toFixed(0)}%. Ravitaillement nécessaire.`
          });
          alertAdded = true;
        }

        // Update markers if it's the selected one
        const isSelected = this.selectedVehicle()?.id === v.id;
        
        return {
          ...v,
          speed: Math.floor(speed),
          lat,
          lng,
          fuel: Number(fuel.toFixed(2)),
          lastUpdated: new Date()
        };
      });

      this.vehicles.set(updated);
      
      // Update selected vehicle telemetry dynamically
      const sel = this.selectedVehicle();
      if (sel) {
        const fresh = updated.find((v) => v.id === sel.id) || null;
        this.selectedVehicle.set(fresh);
      }

      this.applyFilters();
      this.syncMarkersPositions();
    }, 4000);
  }

  // Update marker positions smoothly on the map without rewriting them
  private syncMarkersPositions(): void {
    const list = this.filteredVehicles();
    list.forEach((v) => {
      const marker = this.markersMap.get(v.id);
      if (marker) {
        marker.setLatLng([v.lat, v.lng]);
        
        // Update popup/tooltip context
        marker.getTooltip().setContent(`
          <div class="marker-tooltip">
            <strong>${v.registration}</strong> (${v.brand})<br/>
            <span>${v.driverName}</span><br/>
            <strong>${v.speed} km/h</strong> | ${v.fuel}% Carburant
          </div>
        `);
      }
    });
  }

  private initializeAlerts(): void {
    const initialAlerts: LiveAlert[] = [
      { time: '10:32', vehicle: 'AM-402-XX', type: 'EXCÈS DE VITESSE', severity: 'danger', message: 'Vitesse de 96 km/h détectée (limite 80).' },
      { time: '10:25', vehicle: 'AM-104-BB', type: 'DÉPARTS HORS ZONE', severity: 'info', message: 'Sortie de la zone logistique Nord (Geofence).' },
      { time: '10:14', vehicle: 'AM-987-FR', type: 'ARRÊT PROLONGÉ', severity: 'warning', message: 'Véhicule immobile depuis 45 min sans déconnexion.' }
    ];
    this.alerts.set(initialAlerts);
  }

  private pushAlert(alert: LiveAlert): void {
    const current = [alert, ...this.alerts()];
    // Cap at 15 alerts
    this.alerts.set(current.slice(0, 15));
  }

  protected getStatusLabel(status: string): string {
    switch (status) {
      case 'ACTIVE': return 'En mouvement';
      case 'IDLE': return 'Moteur au ralenti';
      case 'STOPPED': return 'À l\'arrêt';
      case 'OFFLINE': return 'Hors ligne';
      default: return status;
    }
  }

  protected getStatusColor(status: string): string {
    switch (status) {
      case 'ACTIVE': return '#10b981'; // Emerald / green
      case 'IDLE': return '#f59e0b'; // Amber / orange
      case 'STOPPED': return '#3b82f6'; // Blue
      case 'OFFLINE': return '#9ca3af'; // Grey
      default: return '#9ca3af';
    }
  }

  protected getSeverityColor(sev: string): string {
    switch (sev) {
      case 'danger': return 'chip-danger';
      case 'warning': return 'chip-warning';
      case 'info': return 'chip-planned';
      default: return 'chip-muted';
    }
  }
}
