const fs = require('fs');

const tsPath = 'c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet/machine-maintenance/machine-maintenance-rules-list/machine-maintenance-rules-list.component.ts';
let tsContent = fs.readFileSync(tsPath, 'utf8');

if (!tsContent.includes('PaginatePipe')) {
    tsContent = `import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';\nimport { PaginatePipe } from 'app/shared/pipes/paginate.pipe';\n` + tsContent;
    tsContent = tsContent.replace(/imports:\s*\[([\s\S]*?)\]/, "imports: [$1, MatPaginatorModule, PaginatePipe]");
    const paginationLogic = `\n  pageIndex = 0;\n  pageSize = 10;\n  pageSizeOptions = [5, 10, 25, 50];\n  onPageChange(event: PageEvent): void {\n    this.pageIndex = event.pageIndex;\n    this.pageSize = event.pageSize;\n  }\n`;
    tsContent = tsContent.replace(/(export class \w+(?: implements \w+)?\s*\{)/, `$1${paginationLogic}`);
    fs.writeFileSync(tsPath, tsContent, 'utf8');
}