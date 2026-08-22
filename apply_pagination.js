const fs = require('fs');
const path = require('path');

// List of components to add frontend pagination to
// format: { tsPath, htmlPath, dataVar (the displayed array), totalVar (all data array, or same if no filtering) }
const targets = [
  {
    ts: 'src/app/routes/fleet/chauffeurs/chauffeur-list/chauffeur-list.component.ts',
    html: 'src/app/routes/fleet/chauffeurs/chauffeur-list/chauffeur-list.component.html',
    displayVar: 'chauffeurs',
    // chauffeur-list has no "all" array - it loads all into chauffeurs directly
  },
  {
    ts: 'src/app/routes/fleet/vehicles/vehicle-list/vehicle-list.component.ts',
    html: 'src/app/routes/fleet/vehicles/vehicle-list/vehicle-list.component.html',
    displayVar: 'vehicules',
  },
  {
    ts: 'src/app/routes/fleet/fuel-fillings/fuel-list/fuel-list.component.ts',
    html: 'src/app/routes/fleet/fuel-fillings/fuel-list/fuel-list.component.html',
    displayVar: 'pleins',
  },
  {
    ts: 'src/app/routes/fleet/pneus/pneu-list/pneu-list.component.ts',
    html: 'src/app/routes/fleet/pneus/pneu-list/pneu-list.component.html',
    displayVar: 'pneus',
  },
  {
    ts: 'src/app/routes/fleet/machines/machine-list/machine-list.component.ts',
    html: 'src/app/routes/fleet/machines/machine-list/machine-list.component.html',
    displayVar: 'machines',
  },
  {
    ts: 'src/app/routes/fleet/notifications/notification-list/notification-list.component.ts',
    html: 'src/app/routes/fleet/notifications/notification-list/notification-list.component.html',
    displayVar: 'notifications',
  },
  {
    ts: 'src/app/routes/fleet/changement-huile/changement-huile-list/changement-huile-list.component.ts',
    html: 'src/app/routes/fleet/changement-huile/changement-huile-list/changement-huile-list.component.html',
    displayVar: 'changements',
  },
  {
    ts: 'src/app/routes/fleet/affectation-pneu/affectation-list/affectation-list.component.ts',
    html: 'src/app/routes/fleet/affectation-pneu/affectation-list/affectation-list.component.html',
    displayVar: 'affectations',
  },
  {
    ts: 'src/app/routes/fleet/documents/document-list/document-list.component.ts',
    html: 'src/app/routes/fleet/documents/document-list/document-list.component.html',
    displayVar: 'documents',
  },
];

const PAGINATION_IMPORT = `import { PaginationBarComponent, PageChangeEvent } from 'app/shared/components/pagination-bar/pagination-bar.component';`;

const PAGINATION_VARS = `
  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return (this as any)[this._displayVar].slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
`;

function addPaginationToTs(tsPath, displayVar) {
  if (!fs.existsSync(tsPath)) { console.log('MISSING: ' + tsPath); return false; }
  let c = fs.readFileSync(tsPath, 'utf8');

  // Already done?
  if (c.includes('PaginationBarComponent')) { console.log('SKIP (already done): ' + tsPath); return false; }

  // Add import at top
  c = c.replace(/(@Component\s*\({)/, PAGINATION_IMPORT + '\n\n$1');

  // Add PaginationBarComponent to imports array
  c = c.replace(/imports:\s*\[([^\]]*)\]/, (m, inner) => {
    const trimmed = inner.trimEnd();
    const sep = trimmed.endsWith(',') ? ' ' : ', ';
    return `imports: [${trimmed}${sep}PaginationBarComponent]`;
  });

  // Add pagination properties and method just before the closing }
  const paginationCode = `
  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  private _displayVar = '${displayVar}';

  get paginatedItems(): any[] {
    const start = this.pageIndex * this.pageSize;
    return ((this as any)['${displayVar}'] as any[] || []).slice(start, start + this.pageSize);
  }

  onPageChange(e: PageChangeEvent): void {
    this.pageIndex = e.pageIndex;
    this.pageSize = e.pageSize;
  }
`;
  // Insert before last closing brace
  const lastBrace = c.lastIndexOf('}');
  c = c.substring(0, lastBrace) + paginationCode + '\n}';

  fs.writeFileSync(tsPath, c, 'utf8');
  console.log('UPDATED TS: ' + tsPath);
  return true;
}

function addPaginationToHtml(htmlPath, displayVar) {
  if (!fs.existsSync(htmlPath)) { console.log('MISSING: ' + htmlPath); return; }
  let c = fs.readFileSync(htmlPath, 'utf8');

  // Already done?
  if (c.includes('app-pagination-bar')) { console.log('SKIP HTML (already done): ' + htmlPath); return; }

  // Replace *ngFor to use paginatedItems
  const ngForRegex = new RegExp(`\\*ngFor="let (\\w+) of ${displayVar}"`, 'g');
  c = c.replace(ngForRegex, `*ngFor="let $1 of paginatedItems"`);

  // Also try the table-closing tag or body-closing to insert pagination bar
  // Strategy: insert before the last </div> that closes the fleet-body
  const paginationHTML = `\n    <app-pagination-bar\n      [total]="${displayVar}.length"\n      [pageIndex]="pageIndex"\n      [pageSize]="pageSize"\n      (pageChange)="onPageChange($event)">\n    </app-pagination-bar>`;

  // Insert after </table> (before </div> of fleet-body)
  if (c.includes('</table>')) {
    c = c.replace(/(<\/table>)(\s*<\/div>)/, '$1' + paginationHTML + '$2');
  } else {
    // fallback: before the last </div>
    const lastDiv = c.lastIndexOf('</div>');
    c = c.substring(0, lastDiv) + paginationHTML + '\n</div>';
  }

  fs.writeFileSync(htmlPath, c, 'utf8');
  console.log('UPDATED HTML: ' + htmlPath);
}

for (const t of targets) {
  const tsUpdated = addPaginationToTs(t.ts, t.displayVar);
  addPaginationToHtml(t.html, t.displayVar);
}

console.log('\nDone!');