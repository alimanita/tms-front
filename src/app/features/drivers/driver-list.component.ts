import { DatePipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { driverFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface DriverRow { id: number; firstName?: string; lastName?: string; fullName: string; phone?: string; licenseNumber?: string; licenseExpiry?: string; salary?: number; }

@Component({
  selector: 'app-driver-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper,DatePipe],
  template: `<app-crud-table title="Chauffeurs" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class DriverListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<DriverRow[]>([]);
  protected readonly columns: CrudColumn<DriverRow>[] = [
    { key: 'fullName', label: 'Nom' }, { key: 'phone', label: 'Telephone' },
    { key: 'licenseNumber', label: 'Permis' },
    { key: 'licenseExpiry', label: 'Expiration', format: (r) => this.datePipe.transform(r.licenseExpiry, 'dd/MM/yyyy') ?? '' },
    { key: 'salary', label: 'Salaire' }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.crud.openCreate(this.api.paths.drivers, 'Nouveau chauffeur', driverFields, (v) => v, () => this.reload()); }
  edit(row: DriverRow): void {
    this.api.get<DriverRow & { cin?: string; licenseCategory?: string; address?: string; hireDate?: string }>(this.api.paths.drivers, row.id).subscribe((detail) => {
      this.crud.openEdit(this.api.paths.drivers, 'Modifier chauffeur', driverFields, row, () => ({
        firstName: detail.firstName, lastName: detail.lastName, cin: detail.cin, phone: detail.phone,
        licenseNumber: detail.licenseNumber, licenseCategory: detail.licenseCategory, licenseExpiry: detail.licenseExpiry, salary: detail.salary
      }), (v) => v, () => this.reload());
    });
  }
  remove(row: DriverRow): void { this.crud.confirmDelete(this.api.paths.drivers, row.id, () => this.reload()); }
  private reload(): void { this.loading.set(true); this.api.list<DriverRow>(this.api.paths.drivers).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
