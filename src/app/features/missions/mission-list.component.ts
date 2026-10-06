import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { mapMissionBody, missionFields, toOptions } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface MissionRow { id: number; reference: string; customerName?: string; vehicleRegistration?: string; driverName?: string; status: string; revenue?: number; }
interface CustomerRow { id: number; name: string; }
interface VehicleRow { id: number; registration: string; }
interface DriverRow { id: number; fullName: string; }

@Component({
  selector: 'app-mission-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper],
  template: `<app-crud-table title="Missions" [columns]="columns" [rows]="rows()" [loading]="loading()" [hasExportPdf]="true" [hasExportCsv]="true" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" (exportPdfClick)="exportPdf()" (exportCsvClick)="exportCsv()" />`
})
export class MissionListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  protected readonly loading = signal(true);
  protected readonly rows = signal<MissionRow[]>([]);
  protected readonly columns: CrudColumn<MissionRow>[] = [
    { key: 'reference', label: 'Reference' }, { key: 'customerName', label: 'Client' },
    { key: 'vehicleRegistration', label: 'Vehicule' }, { key: 'driverName', label: 'Chauffeur' },
    { key: 'status', label: 'Statut' }, { key: 'revenue', label: 'Revenu' }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.withFields((f) => this.crud.openCreate(this.api.paths.missions, 'Nouvelle mission', f, mapMissionBody, () => this.reload())); }
  edit(row: MissionRow): void {
    this.api.get<MissionRow & { customerId?: number; vehicleId?: number; driverId?: number; departureDate?: string; expectedArrival?: string; loadingAddress?: string; deliveryAddress?: string; transportCost?: number }>(this.api.paths.missions, row.id).subscribe((detail) => {
      this.withFields((fields) => this.crud.openEdit(this.api.paths.missions, 'Modifier mission', fields, row, () => ({
        reference: detail.reference, customerId: detail.customerId, vehicleId: detail.vehicleId, driverId: detail.driverId,
        departureDate: detail.departureDate?.slice(0, 16), expectedArrival: detail.expectedArrival?.slice(0, 16),
        loadingAddress: detail.loadingAddress, deliveryAddress: detail.deliveryAddress, status: detail.status,
        revenue: detail.revenue, transportCost: detail.transportCost
      }), mapMissionBody, () => this.reload()));
    });
  }
  remove(row: MissionRow): void { this.crud.confirmDelete(this.api.paths.missions, row.id, () => this.reload()); }
  private withFields(cb: (fields: ReturnType<typeof missionFields>) => void): void {
    this.api.list<CustomerRow>(this.api.paths.customers).subscribe((customers) => {
      this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe((vehicles) => {
        this.api.list<DriverRow>(this.api.paths.drivers).subscribe((drivers) => {
          cb(missionFields(
            toOptions(customers.content, (c) => c.name),
            toOptions(vehicles.content, (v) => v.registration),
            toOptions(drivers.content, (d) => d.fullName)
          ));
        });
      });
    });
  }
  private reload(): void { this.loading.set(true); this.api.list<MissionRow>(this.api.paths.missions).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }

  exportCsv(): void {
    const headers = ['Référence', 'Client', 'Véhicule', 'Chauffeur', 'Statut', 'Revenu'];
    const rows = this.rows().map(r => [
      r.reference ?? '',
      r.customerName ?? '',
      r.vehicleRegistration ?? '',
      r.driverName ?? '',
      r.status ?? '',
      r.revenue != null ? String(r.revenue) : ''
    ]);
    const csvContent = [headers, ...rows].map(row => row.map(v => `"${String(v).replace(/"/g, '""')}"`).join(',')).join('\r\n');
    const blob = new Blob(['\uFEFF' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `missions_${new Date().toISOString().slice(0,10)}.csv`; a.click();
    URL.revokeObjectURL(url);
  }

  exportPdf(): void {
    const rows = this.rows();
    const statusLabels: Record<string, string> = {
      PLANNED: 'Planifiée', ASSIGNED: 'Affectée', IN_PROGRESS: 'En cours',
      DELIVERED: 'Livrée', CANCELLED: 'Annulée'
    };
    const tbody = rows.map(r => `<tr>
      <td>${r.reference ?? ''}</td><td>${r.customerName ?? ''}</td>
      <td>${r.vehicleRegistration ?? ''}</td><td>${r.driverName ?? ''}</td>
      <td>${statusLabels[r.status] ?? r.status ?? ''}</td>
      <td style="text-align:right">${r.revenue != null ? r.revenue.toLocaleString('fr-FR', {minimumFractionDigits:2}) : ''}</td>
    </tr>`).join('');
    const html = `<!DOCTYPE html><html><head><meta charset="utf-8"><title>Missions</title>
    <style>body{font-family:Arial,sans-serif;font-size:11px;margin:20px}
    h2{margin-bottom:8px}table{width:100%;border-collapse:collapse}
    th,td{border:1px solid #ccc;padding:5px 8px}th{background:#2563eb;color:#fff}
    tr:nth-child(even){background:#f5f5f5}@media print{body{margin:0}}</style></head>
    <body><h2>Liste des Missions — ${new Date().toLocaleDateString('fr-FR')}</h2>
    <table><thead><tr><th>Référence</th><th>Client</th><th>Véhicule</th><th>Chauffeur</th><th>Statut</th><th>Revenu</th></tr></thead>
    <tbody>${tbody}</tbody></table></body></html>`;
    const win = window.open('', '_blank');
    if (win) { win.document.write(html); win.document.close(); win.print(); }
  }
}
