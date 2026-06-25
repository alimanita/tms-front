import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { fuelFields, mapFuelBody, toOptions } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface FuelRow { id: number; vehicleRegistration?: string; driverName?: string; fillDate: string; liters: number; totalAmount: number; }
interface VehicleRow { id: number; registration: string; }
interface DriverRow { id: number; fullName: string; }

@Component({
  selector: 'app-fuel-list',
  imports: [CrudTableComponent],
 providers: [CrudHelper, DatePipe, DecimalPipe],
  template: `<app-crud-table title="Carburant" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class FuelListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<FuelRow[]>([]);
  protected readonly columns: CrudColumn<FuelRow>[] = [
    { key: 'fillDate', label: 'Date', format: (r) => this.datePipe.transform(r.fillDate, 'dd/MM/yyyy HH:mm') ?? '' },
    { key: 'vehicleRegistration', label: 'Vehicule' }, { key: 'driverName', label: 'Chauffeur' },
    { key: 'liters', label: 'Litres' },
    { key: 'totalAmount', label: 'Montant', format: (r) => `${this.decimalPipe.transform(r.totalAmount, '1.2-2')} EUR` }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.withFields((f) => this.crud.openCreate(this.api.paths.fuelRecords, 'Nouveau plein', f, mapFuelBody, () => this.reload())); }
  edit(row: FuelRow): void {
    this.api.get<FuelRow & { vehicleId: number; driverId?: number; mileage: number; station?: string; pricePerLiter: number }>(this.api.paths.fuelRecords, row.id).subscribe((detail) => {
      this.withFields((fields) => this.crud.openEdit(this.api.paths.fuelRecords, 'Modifier plein', fields, row, () => ({
        vehicleId: detail.vehicleId, driverId: detail.driverId, fillDate: detail.fillDate?.slice(0, 16),
        mileage: detail.mileage, station: detail.station, liters: detail.liters, pricePerLiter: detail.pricePerLiter
      }), mapFuelBody, () => this.reload()));
    });
  }
  remove(row: FuelRow): void { this.crud.confirmDelete(this.api.paths.fuelRecords, row.id, () => this.reload()); }
  private withFields(cb: (fields: ReturnType<typeof fuelFields>) => void): void {
    this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe((vehicles) => {
      this.api.list<DriverRow>(this.api.paths.drivers).subscribe((drivers) => {
        cb(fuelFields(toOptions(vehicles.content, (v) => v.registration), toOptions(drivers.content, (d) => d.fullName)));
      });
    });
  }
  private reload(): void { this.loading.set(true); this.api.list<FuelRow>(this.api.paths.fuelRecords).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
