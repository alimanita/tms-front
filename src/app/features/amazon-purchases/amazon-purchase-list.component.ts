import { DatePipe, DecimalPipe } from '@angular/common';
import { Component, inject, OnInit, signal } from '@angular/core';
import { TmsApiService } from '../../core/services/tms-api.service';
import { CrudHelper, CrudColumn } from '../../shared/crud/crud.helper';
import { amazonFields, mapAmazonBody } from '../../shared/crud/field-configs';
import { CrudTableComponent } from '../../shared/crud/crud-table.component';

interface AmazonRow { id: number; amazonOrderNumber: string; purchaseDate: string; supplier?: string; amountTtc?: number; totalPurchaseCost?: number; status?: string; }

@Component({
  selector: 'app-amazon-purchase-list',
  imports: [CrudTableComponent],
  providers: [CrudHelper],
  template: `<app-crud-table title="Achats Amazon" [columns]="columns" [rows]="rows()" [loading]="loading()" (addClick)="create()" (editClick)="edit($event)" (removeClick)="remove($event)" />`
})
export class AmazonPurchaseListComponent implements OnInit {
  private readonly api = inject(TmsApiService);
  private readonly crud = inject(CrudHelper);
  private readonly datePipe = inject(DatePipe);
  private readonly decimalPipe = inject(DecimalPipe);
  protected readonly loading = signal(true);
  protected readonly rows = signal<AmazonRow[]>([]);
  protected readonly columns: CrudColumn<AmazonRow>[] = [
    { key: 'amazonOrderNumber', label: 'Commande' },
    { key: 'purchaseDate', label: 'Date', format: (r) => this.datePipe.transform(r.purchaseDate, 'dd/MM/yyyy') ?? '' },
    { key: 'supplier', label: 'Fournisseur' },
    { key: 'amountTtc', label: 'TTC', format: (r) => `${this.decimalPipe.transform(r.amountTtc, '1.2-2')} EUR` },
    { key: 'totalPurchaseCost', label: 'Cout total', format: (r) => `${this.decimalPipe.transform(r.totalPurchaseCost, '1.2-2')} EUR` },
    { key: 'status', label: 'Statut' }
  ];
  ngOnInit(): void { this.reload(); }
  create(): void { this.crud.openCreate(this.api.paths.amazonPurchases, 'Nouvel achat Amazon', amazonFields(), mapAmazonBody, () => this.reload()); }
  edit(row: AmazonRow): void {
    this.api.get<AmazonRow & { items?: { designation: string; quantity: number; unitPrice: number }[] }>(this.api.paths.amazonPurchases, row.id).subscribe((detail) => {
      const item = detail.items?.[0];
      this.crud.openEdit(this.api.paths.amazonPurchases, 'Modifier achat Amazon', amazonFields(), row, () => ({
        amazonOrderNumber: detail.amazonOrderNumber,
        purchaseDate: detail.purchaseDate,
        supplier: detail.supplier,
        status: detail.status,
        itemDesignation: item?.designation,
        itemQuantity: item?.quantity,
        itemUnitPrice: item?.unitPrice
      }), mapAmazonBody, () => this.reload());
    });
  }
  remove(row: AmazonRow): void { this.crud.confirmDelete(this.api.paths.amazonPurchases, row.id, () => this.reload()); }
  private reload(): void { this.loading.set(true); this.api.list<AmazonRow>(this.api.paths.amazonPurchases).subscribe({ next: (p) => { this.rows.set(p.content); this.loading.set(false); }, error: () => this.loading.set(false) }); }
}
