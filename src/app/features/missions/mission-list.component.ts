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
  template: `<app-crud-table title="Missions" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
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
}
