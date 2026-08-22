const fs = require('fs');
const content = `import { Component, Input, Output, EventEmitter, ChangeDetectionStrategy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

export interface PageChangeEvent {
  pageIndex: number;
  pageSize: number;
}

@Component({
  selector: 'app-pagination-bar',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: \`
    <div class="pagination-bar" *ngIf="!loading">
      <div class="pagination-left">
        <span class="page-size-label">Lignes</span>
        <div class="page-size-select-wrapper">
          <select class="page-size-select"
                  [(ngModel)]="pageSize"
                  (change)="onSizeChange()">
            <option [value]="5">5</option>
            <option [value]="10">10</option>
            <option [value]="20">20</option>
            <option [value]="50">50</option>
          </select>
          <mat-icon class="chevron-xs">expand_more</mat-icon>
        </div>
        <span class="page-info">Page {{ pageIndex + 1 }} sur {{ totalPages || 1 }}</span>
        <span class="results-info">
          Affichage de {{ startIndex + 1 }} a {{ endIndex }} sur {{ total }} resultats
        </span>
      </div>
      <div class="pagination-right">
        <button class="page-btn"
                [disabled]="pageIndex === 0"
                (click)="prev()">
          <mat-icon>chevron_left</mat-icon>
        </button>
        <button class="page-btn"
                [disabled]="pageIndex >= totalPages - 1"
                (click)="next()">
          <mat-icon>chevron_right</mat-icon>
        </button>
      </div>
    </div>
  \`,
  styles: [\`
    .pagination-bar {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 12px 16px;
      border-top: 1px solid #f1f5f9;
      background: #fff;
      flex-wrap: wrap;
      gap: 8px;
    }
    .pagination-left {
      display: flex;
      align-items: center;
      gap: 12px;
      flex-wrap: wrap;
    }
    .page-size-label {
      font-size: 13px;
      color: #64748b;
    }
    .page-size-select-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }
    .page-size-select {
      height: 32px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      padding: 0 26px 0 10px;
      font-size: 13px;
      color: #374151;
      background: #fff;
      appearance: none;
      cursor: pointer;
      outline: none;
    }
    .chevron-xs {
      position: absolute;
      right: 4px;
      font-size: 16px !important;
      width: 16px !important;
      height: 16px !important;
      color: #94a3b8;
      pointer-events: none;
    }
    .page-info {
      font-size: 13px;
      color: #374151;
      font-weight: 500;
    }
    .results-info {
      font-size: 13px;
      color: #94a3b8;
    }
    .pagination-right {
      display: flex;
      align-items: center;
      gap: 6px;
    }
    .page-btn {
      width: 32px;
      height: 32px;
      border: 1px solid #e2e8f0;
      border-radius: 6px;
      background: #fff;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #374151;
      transition: background 0.15s;
    }
    .page-btn mat-icon {
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .page-btn:hover:not(:disabled) {
      background: #f1f5f9;
    }
    .page-btn:disabled {
      opacity: 0.4;
      cursor: not-allowed;
    }
    @media (max-width: 640px) {
      .pagination-bar { flex-direction: column; align-items: flex-start; }
      .results-info { display: none; }
    }
  \`]
})
export class PaginationBarComponent {
  @Input() total = 0;
  @Input() pageIndex = 0;
  @Input() pageSize = 10;
  @Input() loading = false;

  @Output() pageChange = new EventEmitter<PageChangeEvent>();

  get totalPages(): number {
    return Math.max(1, Math.ceil(this.total / this.pageSize));
  }

  get startIndex(): number {
    return this.pageIndex * this.pageSize;
  }

  get endIndex(): number {
    return Math.min(this.startIndex + this.pageSize, this.total);
  }

  onSizeChange(): void {
    this.pageChange.emit({ pageIndex: 0, pageSize: this.pageSize });
  }

  prev(): void {
    if (this.pageIndex > 0) {
      this.pageChange.emit({ pageIndex: this.pageIndex - 1, pageSize: this.pageSize });
    }
  }

  next(): void {
    if (this.pageIndex < this.totalPages - 1) {
      this.pageChange.emit({ pageIndex: this.pageIndex + 1, pageSize: this.pageSize });
    }
  }
}
`;
fs.writeFileSync('c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/shared/components/pagination-bar/pagination-bar.component.ts', content, 'utf8');
console.log('Created pagination-bar component');