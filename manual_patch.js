const fs = require('fs');

function paginateList(tsPath, htmlPath, listVar) {
    let tsContent = fs.readFileSync(tsPath, 'utf8');
    let htmlContent = fs.readFileSync(htmlPath, 'utf8');
    
    // TS
    if (!tsContent.includes('PaginatePipe')) {
        tsContent = `import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';\nimport { PaginatePipe } from 'app/shared/pipes/paginate.pipe';\n` + tsContent;
        tsContent = tsContent.replace(/imports:\s*\[([\s\S]*?)\]/, "imports: [$1, MatPaginatorModule, PaginatePipe]");
        const paginationLogic = `\n  pageIndex = 0;\n  pageSize = 10;\n  pageSizeOptions = [5, 10, 25, 50];\n  onPageChange(event: PageEvent): void {\n    this.pageIndex = event.pageIndex;\n    this.pageSize = event.pageSize;\n  }\n`;
        tsContent = tsContent.replace(/(export class \w+(?: implements \w+)?\s*\{)/, `$1${paginationLogic}`);
        fs.writeFileSync(tsPath, tsContent, 'utf8');
    }
    
    // HTML
    if (!htmlContent.includes('paginate:pageIndex:pageSize')) {
        // Find *ngFor iterating over listVar
        const regex = new RegExp(`\\*ngFor="let\\s+(\\w+)\\s+of\\s+${listVar}"`);
        htmlContent = htmlContent.replace(regex, `*ngFor="let $1 of (${listVar} | paginate:pageIndex:pageSize)"`);
        
        const paginatorHtml = `\n  <mat-paginator\n    [length]="(${listVar} || []).length"\n    [pageSize]="pageSize"\n    [pageSizeOptions]="pageSizeOptions"\n    (page)="onPageChange($event)">\n  </mat-paginator>\n`;
        htmlContent = htmlContent.replace(/<\/table>/, `</table>${paginatorHtml}`);
        fs.writeFileSync(htmlPath, htmlContent, 'utf8');
    }
}

paginateList(
    'c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet/mission/mission-list/mission-list.component.ts',
    'c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet/mission/mission-list/mission-list.component.html',
    'filteredMissions'
);