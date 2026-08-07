import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { fuelFields, mapFuelBody, toOptions } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface FuelRow {
  id: number;
  reference?: string;
  vehiculeImmatriculation?: string;
  chauffeurNom?: string;
  fillingDate: string;
  fuelType?: string;
  quantityLiters: number;
  totalAmount: number;
}
interface VehicleRow { id: number; immatriculation: string; }
interface DriverRow { id: number; prenom: string; nom: string; }

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
    { key: 'fillingDate', label: 'Date', format: (r) => this.datePipe.transform(r.fillingDate, 'dd/MM/yyyy HH:mm') ?? '' },
    { key: 'vehiculeImmatriculation', label: 'Vehicule' },
    { key: 'chauffeurNom', label: 'Chauffeur' },
    { key: 'fuelType', label: 'Type' },
    { key: 'quantityLiters', label: 'Litres' },
    { key: 'totalAmount', label: 'Montant', format: (r) => `${this.decimalPipe.transform(r.totalAmount, '1.2-2')} EUR` }
  ];

  ngOnInit(): void { this.reload(); }

  create(): void {
    this.withFields((f) => this.crud.openCreate(this.api.paths.fuelRecords, 'Nouveau plein', f, mapFuelBody, () => this.reload()));
  }

  edit(row: FuelRow): void {
    this.api.get<FuelRow & { vehiculeId: number; chauffeurId?: number; mileageAfter?: number; receiptNumber?: string; notes?: string; pricePerLiter: number }>(
      this.api.paths.fuelRecords, row.id
    ).subscribe((detail) => {
      this.withFields((fields) => this.crud.openEdit(
        this.api.paths.fuelRecords, 'Modifier plein', fields, row,
        () => ({
          vehiculeId: detail.vehiculeId,
          chauffeurId: detail.chauffeurId,
          fillingDate: detail.fillingDate?.slice(0, 16),
          fuelType: detail.fuelType,
          quantityLiters: detail.quantityLiters,
          pricePerLiter: detail.pricePerLiter,
          mileageAfter: detail.mileageAfter,
          receiptNumber: detail.receiptNumber,
          notes: detail.notes
        }),
        mapFuelBody, () => this.reload()
      ));
    });
  }

  remove(row: FuelRow): void { this.crud.confirmDelete(this.api.paths.fuelRecords, row.id, () => this.reload()); }

  private withFields(cb: (fields: ReturnType<typeof fuelFields>) => void): void {
    this.api.list<VehicleRow>('/fleet/vehicules').subscribe((vehicles) => {
      this.api.list<DriverRow>('/fleet/chauffeurs').subscribe((drivers) => {
        cb(fuelFields(
          toOptions(vehicles.content, (v) => v.immatriculation),
          toOptions(drivers.content, (d) => `${d.prenom} ${d.nom}`)
        ));
      });
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list<FuelRow>(this.api.paths.fuelRecords).subscribe({
      next: (p) => { this.rows.set(p.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
