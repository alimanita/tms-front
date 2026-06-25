import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { mapOrderBody, orderFields, toOptions } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface OrderRow { id: number; reference: string; orderDate: string; customerName?: string; status: string; totalAmount?: number; }
interface CustomerRow { id: number; name: string; }

@Component({
  selector: 'app-order-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper],
  template: `<app-crud-table title="Commandes clients" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class OrderListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<OrderRow[]>([]);
  protected readonly columns: CrudColumn<OrderRow>[] = [
    { key: 'reference', label: 'Reference' },
    { key: 'orderDate', label: 'Date', format: (r) => this.datePipe.transform(r.orderDate, 'dd/MM/yyyy') ?? '' },
    { key: 'customerName', label: 'Client' },
    { key: 'status', label: 'Statut' },
    { key: 'totalAmount', label: 'Total', format: (r) => `${this.decimalPipe.transform(r.totalAmount, '1.2-2')} EUR` }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.withCustomerFields((fields) => this.crud.openCreate(this.api.paths.customerOrders, 'Nouvelle commande', fields, mapOrderBody, () => this.reload())); }
  edit(row: OrderRow): void {
    this.api.get<OrderRow & { customerId: number; lines?: { designation: string; quantity: number; salePrice: number }[] }>(this.api.paths.customerOrders, row.id).subscribe((detail) => {
      const line = detail.lines?.[0];
      this.withCustomerFields((fields) => this.crud.openEdit(this.api.paths.customerOrders, 'Modifier commande', fields, row, () => ({
        reference: detail.reference, orderDate: detail.orderDate, customerId: detail.customerId, status: detail.status,
        designation: line?.designation, quantity: line?.quantity, salePrice: line?.salePrice
      }), mapOrderBody, () => this.reload()));
    });
  }
  remove(row: OrderRow): void { this.crud.confirmDelete(this.api.paths.customerOrders, row.id, () => this.reload()); }
  private withCustomerFields(cb: (fields: ReturnType<typeof orderFields>) => void): void {
    this.api.list<CustomerRow>(this.api.paths.customers).subscribe((p) => cb(orderFields(toOptions(p.content, (c) => c.name))));
  }
  private reload(): void { this.loading.set(true); this.api.list<OrderRow>(this.api.paths.customerOrders).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
