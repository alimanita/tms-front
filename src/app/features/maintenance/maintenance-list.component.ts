import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { maintenanceFields, mapMaintenanceBody, toOptions } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface MaintenanceRow { id: number; vehicleRegistration?: string; maintenanceType: string; maintenanceDate: string; cost: number; supplier?: string; }
interface VehicleRow { id: number; registration: string; }

@Component({
  selector: 'app-maintenance-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper,DecimalPipe, DatePipe],
  template: `<app-crud-table title="Entretien" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class MaintenanceListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<MaintenanceRow[]>([]);
  protected readonly columns: CrudColumn<MaintenanceRow>[] = [
    { key: 'maintenanceDate', label: 'Date', format: (r) => this.datePipe.transform(r.maintenanceDate, 'dd/MM/yyyy') ?? '' },
    { key: 'vehicleRegistration', label: 'Vehicule' }, { key: 'maintenanceType', label: 'Type' },
    { key: 'cost', label: 'Cout', format: (r) => `${this.decimalPipe.transform(r.cost, '1.2-2')} EUR` },
    { key: 'supplier', label: 'Fournisseur' }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.withFields((f) => this.crud.openCreate(this.api.paths.maintenanceRecords, 'Nouvel entretien', f, mapMaintenanceBody, () => this.reload())); }
  edit(row: MaintenanceRow): void {
    this.api.get<MaintenanceRow & { vehicleId: number; mileage?: number; nextDueDate?: string }>(this.api.paths.maintenanceRecords, row.id).subscribe((detail) => {
      this.withFields((fields) => this.crud.openEdit(this.api.paths.maintenanceRecords, 'Modifier entretien', fields, row, () => ({
        vehicleId: detail.vehicleId, maintenanceType: detail.maintenanceType, maintenanceDate: detail.maintenanceDate,
        mileage: detail.mileage, cost: detail.cost, supplier: detail.supplier, nextDueDate: detail.nextDueDate
      }), mapMaintenanceBody, () => this.reload()));
    });
  }
  remove(row: MaintenanceRow): void { this.crud.confirmDelete(this.api.paths.maintenanceRecords, row.id, () => this.reload()); }
  private withFields(cb: (fields: ReturnType<typeof maintenanceFields>) => void): void {
    this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe((p) => cb(maintenanceFields(toOptions(p.content, (v) => v.registration))));
  }
  private reload(): void { this.loading.set(true); this.api.list<MaintenanceRow>(this.api.paths.maintenanceRecords).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
