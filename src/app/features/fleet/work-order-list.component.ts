import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { mapWorkOrderBody, toEntityOptions, workOrderFields } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface WorkOrderRow {
  id: number;
  reference: string;
  entityLabel?: string;
  orderType: string;
  priority: string;
  status: string;
  scheduledDate?: string;
  actualCost?: number;
}

interface VehicleRow { id: number; registration: string; }
interface MachineRow { id: number; reference: string; name: string; }

@Component({
  selector: 'app-work-order-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper, DatePipe, DecimalPipe],
  template: `<app-crud-table title="Ordres de travail" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class WorkOrderListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<WorkOrderRow[]>([]);
  protected readonly columns: CrudColumn<WorkOrderRow>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'entityLabel', label: 'Entite' },
    { key: 'orderType', label: 'Type' },
    { key: 'priority', label: 'Priorite' },
    { key: 'status', label: 'Statut' },
    { key: 'scheduledDate', label: 'Date prevue', format: (r) => r.scheduledDate ? (this.datePipe.transform(r.scheduledDate, 'dd/MM/yyyy') ?? '') : '' },
    { key: 'actualCost', label: 'Cout', format: (r) => r.actualCost != null ? `${this.decimalPipe.transform(r.actualCost, '1.2-2')} EUR` : '' }
  ];

  ngOnInit(): void { this.reload(); }

  create(): void {
    this.withEntityOptions((options) => {
      this.crud.openCreate(this.api.paths.workOrders, 'Nouvel ordre de travail', workOrderFields(options), mapWorkOrderBody, () => this.reload());
    });
  }

  edit(row: WorkOrderRow): void {
    this.api.get<WorkOrderRow & Record<string, unknown>>(this.api.paths.workOrders, row.id).subscribe((detail) => {
      this.withEntityOptions((options) => {
        this.crud.openEdit(this.api.paths.workOrders, 'Modifier ordre de travail', workOrderFields(options), row, () => ({
          reference: detail.reference,
          entityKey: `${detail['entityType']}:${detail['entityId']}`,
          orderType: detail.orderType,
          priority: detail.priority,
          maintenanceType: detail['maintenanceType'],
          description: detail['description'],
          scheduledDate: detail.scheduledDate,
          mileageAtOrder: detail['mileageAtOrder'],
          hoursAtOrder: detail['hoursAtOrder'],
          estimatedCost: detail['estimatedCost'],
          actualCost: detail.actualCost,
          notes: detail['notes']
        }), mapWorkOrderBody, () => this.reload());
      });
    });
  }

  remove(row: WorkOrderRow): void {
    this.crud.confirmDelete(this.api.paths.workOrders, row.id, () => this.reload());
  }

  private withEntityOptions(cb: (options: ReturnType<typeof toEntityOptions>) => void): void {
    this.api.list<VehicleRow>(this.api.paths.vehicles).subscribe((vehicles) => {
      this.api.list<MachineRow>(this.api.paths.machines).subscribe((machines) => {
        cb(toEntityOptions(vehicles.content, machines.content));
      });
    });
  }

  private reload(): void {
    this.loading.set(true);
    this.api.list<WorkOrderRow>(this.api.paths.workOrders).subscribe({
      next: (p) => { this.rows.set(p.content); this.loading.set(false); },
      error: () => this.loading.set(false)
    });
  }
}
