import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { mapTireAssignmentBody, tireAssignmentFields, toOptions } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface AssignmentRow {
  id: number;
  tireSerialNumber?: string;
  vehicleRegistration?: string;
  position: string;
  mountDate: string;
  mountMileage: number;
}

interface TireRow { id: number; serialNumber: string; }
interface VehicleRow { id: number; registration: string; }

@Component({
  selector: 'app-tire-assignment-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper, DatePipe, DecimalPipe],
  template: `<app-crud-table title="Affectations pneus" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class TireAssignmentListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<AssignmentRow[]>([]);
  protected readonly columns: CrudColumn<AssignmentRow>[] = [
    { key: 'tireSerialNumber', label: 'Pneu' },
    { key: 'vehicleRegistration', label: 'Vehicule' },
    { key: 'position', label: 'Position' },
    { key: 'mountDate', label: 'Date montage', format: (r) => this.datePipe.transform(r.mountDate, 'dd/MM/yyyy') ?? '' },
    { key: 'mountMileage', label: 'Km', format: (r) => this.decimalPipe.transform(r.mountMileage, '1.0-0') ?? '' }
  ];

  ngOnInit(): void { this.reload(); }

  create(): void {
    this.withFields((fields) => {
      this.crud.openCreate(`${this.api.paths.tireAssignments}`, 'Nouvelle affectation', fields, mapTireAssignmentBody, () => this.reload());
    });
  }

  edit(_row: AssignmentRow): void {
    // Les affectations se terminent par un demontage, pas une edition complete
  }

  remove(_row: AssignmentRow): void {
    // Demontage via endpoint dedie — non expose en suppression directe
  }

  private withFields(cb: (fields: ReturnType<typeof tireAssignmentFields>) => void): void {
    this.api.list<TireRow>(this.api.paths.tires).subscribe((tires) => {
      this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe((vehicles) => {
        cb(tireAssignmentFields(
          toOptions(tires.content, (t) => t.serialNumber),
          toOptions(vehicles.content, (v) => v.registration)
        ));
      });
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe({
      next: (vehicles) => {
        const vehicle = vehicles.content[0];
        if (!vehicle) {
          this.rows.set([]);
          this.loading.set(false);
          return;
        }
        this.api.get<AssignmentRow[]>(`${this.api.paths.tires}/assignments/vehicle`, vehicle.id).subscribe({
          next: (items) => { this.rows.set(items as unknown as AssignmentRow[]); this.loading.set(false); },
          error: () => this.loading.set(false)
        });
      },
      error: () => this.loading.set(false)
    });
  }
}
