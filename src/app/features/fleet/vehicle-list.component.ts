import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { vehicleFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface VehicleRow {
  id: number;
  registration: string;
  brand?: string;
  model?: string;
  status: string;
  currentMileage: number;
  insuranceExpiry?: string;
}

@Component({
  selector: 'app-vehicle-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper, DatePipe],
  template: `
    <app-crud-table
      title="Vehicules"
      [columns]="columns"
      [rows]="rows()"
      [loading]="loading()"
      (addClick)="create()"
      (editClick)="edit($event)"
      (removeClick)="remove($event)"
    />
  `
})
export class VehicleListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);

  protected readonly loading = signal(true);
  protected readonly rows = signal<VehicleRow[]>([]);

  protected readonly columns: CrudColumn<VehicleRow>[] = [
    { key: 'registration', label: 'Immatriculation' },
    { key: 'brand', label: 'Marque' },
    { key: 'model', label: 'Modele' },
    { key: 'status', label: 'Statut' },
    { key: 'currentMileage', label: 'Km' },
    { key: 'insuranceExpiry', label: 'Assurance', format: (r) => this.datePipe.transform(r.insuranceExpiry, 'dd/MM/yyyy') ?? '' }
  ];

  ngOnInit(): void { this.reload(); }

  create(): void {
    this.crud.openCreate(this.api.paths.vehicles, 'Nouveau vehicule', vehicleFields, (v) => v, () => this.reload());
  }

  edit(row: VehicleRow): void {
    this.crud.openEdit(this.api.paths.vehicles, 'Modifier vehicule', vehicleFields, row, (r) => ({ ...r }), (v) => v, () => this.reload());
  }

  remove(row: VehicleRow): void {
    this.crud.confirmDelete(this.api.paths.vehicles, row.id, () => this.reload());
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe({
      next: (p) => { this.rows.set(p.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
