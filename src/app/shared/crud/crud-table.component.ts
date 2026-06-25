import { Component, input, output, signal, computed } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { CrudColumn } from '../crud/crud.helper';

@Component({
  selector: 'app-crud-table',
  imports: [MatCardModule, MatTableModule, MatButtonModule, MatIconModule, MatProgressSpinnerModule],
  template: `
    <mat-card>
      <div class="header">
        <div class="header-left">
          <h1>{{ title() }}</h1>
          <div class="search-box">
            <mat-icon class="search-icon">search</mat-icon>
            <input 
              type="text" 
              placeholder="Rechercher..." 
              [value]="searchTerm()" 
              (input)="onSearchInput($event)"
              aria-label="Rechercher"
            />
            @if (searchTerm()) {
              <button class="clear-btn" type="button" (click)="clearSearch()" aria-label="Effacer">
                <mat-icon>close</mat-icon>
              </button>
            }
          </div>
        </div>
        <button mat-flat-button color="primary" type="button" (click)="addClick.emit()">
          <mat-icon class="btn-icon">add</mat-icon>
          Ajouter
        </button>
      </div>
      
      @if (loading()) {
        <div class="loading"><mat-spinner diameter="36"></mat-spinner></div>
      } @else {
        <table mat-table [dataSource]="filteredRows()">
          @for (col of columns(); track col.key) {
            <ng-container [matColumnDef]="col.key">
              <th mat-header-cell *matHeaderCellDef>{{ col.label }}</th>
              <td mat-cell *matCellDef="let row">
                @if (col.key === 'status') {
                  <span [class]="getStatusBadgeClass(row[col.key])">
                    {{ getStatusLabel(row[col.key]) }}
                  </span>
                } @else {
                  {{ col.format ? col.format(row) : row[col.key] }}
                }
              </td>
            </ng-container>
          }
          <ng-container matColumnDef="actions">
            <th mat-header-cell *matHeaderCellDef class="actions-header">Actions</th>
            <td mat-cell *matCellDef="let row" class="actions-cell">
              <button mat-icon-button type="button" (click)="editClick.emit(row)" aria-label="Modifier" class="edit-btn">
                <mat-icon>edit</mat-icon>
              </button>
              <button mat-icon-button color="warn" type="button" (click)="removeClick.emit(row)" aria-label="Supprimer" class="delete-btn">
                <mat-icon>delete</mat-icon>
              </button>
            </td>
          </ng-container>
          <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
          <tr mat-row *matRowDef="let row; columns: displayedColumns"></tr>
        </table>
        
        @if (filteredRows().length === 0 && !loading()) {
          <div class="no-results">
            <mat-icon>search_off</mat-icon>
            <p>Aucun résultat trouvé pour "{{ searchTerm() }}"</p>
          </div>
        }
      }
    </mat-card>
  `,
  styles: `
    mat-card {
      padding: 1.5rem !important;
      border: 1px solid var(--border) !important;
    }
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1.5rem;
      gap: 1rem;
      flex-wrap: wrap;
    }
    .header-left {
      display: flex;
      align-items: center;
      gap: 1.5rem;
      flex: 1;
      min-width: 280px;
    }
    h1 {
      margin: 0;
      font-size: 1.35rem;
      font-weight: 700;
      letter-spacing: -0.01em;
      color: var(--text);
    }
    .search-box {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--surface-2);
      border: 1px solid var(--border);
      border-radius: var(--radius);
      padding: 0 0.75rem;
      height: 38px;
      width: 100%;
      max-width: 300px;
      transition: all var(--transition);

      &:focus-within {
        border-color: var(--primary);
        background: var(--surface);
        box-shadow: var(--shadow-glow);
      }

      .search-icon {
        color: var(--muted);
        font-size: 20px;
        width: 20px;
        height: 20px;
        margin-right: 0.5rem;
      }

      input {
        border: none;
        background: transparent;
        color: var(--text);
        font-family: inherit;
        font-size: 0.875rem;
        outline: none;
        width: 100%;
        height: 100%;

        &::placeholder {
          color: var(--muted);
        }
      }

      .clear-btn {
        background: transparent;
        border: none;
        cursor: pointer;
        color: var(--muted);
        display: flex;
        align-items: center;
        justify-content: center;
        padding: 2px;
        border-radius: var(--radius-full);
        
        &:hover {
          background-color: var(--border);
          color: var(--text);
        }

        mat-icon {
          font-size: 16px;
          width: 16px;
          height: 16px;
        }
      }
    }
    .btn-icon {
      margin-right: 4px;
      font-size: 18px;
      width: 18px;
      height: 18px;
    }
    .loading {
      display: grid;
      place-items: center;
      min-height: 200px;
    }
    table {
      width: 100%;
      background: transparent !important;
    }
    .mat-mdc-cell, .mat-mdc-header-cell {
      padding: 0.85rem 1rem !important;
    }
    .actions-header {
      width: 100px;
      text-align: right !important;
    }
    .actions-cell {
      text-align: right;
      white-space: nowrap;
    }
    .edit-btn {
      color: var(--primary);
      &:hover {
        background-color: var(--primary-light) !important;
      }
    }
    .delete-btn {
      color: var(--danger);
      &:hover {
        background-color: var(--danger-light) !important;
      }
    }
    .no-results {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      color: var(--muted);
      gap: 0.5rem;

      mat-icon {
        font-size: 36px;
        width: 36px;
        height: 36px;
      }

      p {
        margin: 0;
        font-weight: 500;
        font-size: 0.9rem;
      }
    }
  `
})
export class CrudTableComponent<T extends { id: number }> {
  readonly title = input.required<string>();
  readonly columns = input.required<CrudColumn<T>[]>();
  readonly rows = input.required<T[]>();
  readonly loading = input(false);

  readonly addClick = output<void>();
  readonly editClick = output<T>();
  readonly removeClick = output<T>();

  protected readonly searchTerm = signal('');

  protected readonly filteredRows = computed(() => {
    const term = this.searchTerm().toLowerCase().trim();
    const originalRows = this.rows();
    if (!term) return originalRows;

    return originalRows.filter((row) =>
      this.columns().some((col) => {
        const val = col.format ? col.format(row) : (row as any)[col.key];
        return val != null && String(val).toLowerCase().includes(term);
      })
    );
  });

  get displayedColumns(): string[] {
    return [...this.columns().map((c) => c.key), 'actions'];
  }

  protected onSearchInput(event: Event): void {
    const inputEl = event.target as HTMLInputElement;
    this.searchTerm.set(inputEl.value);
  }

  protected clearSearch(): void {
    this.searchTerm.set('');
  }

  protected getStatusBadgeClass(value: any): string {
    const s = String(value).toUpperCase();
    if (['AVAILABLE', 'DELIVERED', 'CONFIRMED', 'REVENUE'].includes(s)) return 'status-chip chip-active';
    if (['ON_MISSION', 'PREPARATION', 'IN_DELIVERY', 'IN_PROGRESS', 'ASSIGNED'].includes(s)) return 'status-chip chip-warning';
    if (['MAINTENANCE', 'OUT_OF_SERVICE', 'CANCELLED', 'EXPENSE'].includes(s)) return 'status-chip chip-danger';
    if (['DRAFT', 'PLANNED'].includes(s)) return 'status-chip chip-planned';
    return 'status-chip chip-muted';
  }

  protected getStatusLabel(value: any): string {
    const s = String(value).toUpperCase();
    const translations: Record<string, string> = {
      'AVAILABLE': 'Disponible',
      'ON_MISSION': 'En mission',
      'MAINTENANCE': 'Maintenance',
      'OUT_OF_SERVICE': 'Hors service',
      'DRAFT': 'Brouillon',
      'CONFIRMED': 'Confirmé',
      'PREPARATION': 'Préparation',
      'IN_DELIVERY': 'En livraison',
      'DELIVERED': 'Livré',
      'CANCELLED': 'Annulé',
      'PLANNED': 'Planifié',
      'ASSIGNED': 'Affecté',
      'IN_PROGRESS': 'En cours',
      'REVENUE': 'Revenu',
      'EXPENSE': 'Dépense'
    };
    return translations[s] || String(value);
  }
}
