const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('-list.component.ts')) {
            processTsFile(fullPath);
        } else if (file.endsWith('-list.component.html')) {
            processHtmlFile(fullPath);
        }
    }
}

function processTsFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Skip if already has PaginatePipe to avoid double processing
    if (content.includes('PaginatePipe')) return;
    
    // 1. Add imports
    const importPaginator = `import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';\nimport { PaginatePipe } from 'app/shared/pipes/paginate.pipe';\n`;
    content = importPaginator + content;
    
    // 2. Add to @Component imports array
    content = content.replace(/imports:\s*\[([\s\S]*?)\]/, (match, p1) => {
        return `imports: [${p1}, MatPaginatorModule, PaginatePipe]`;
    });
    
    // 3. Add pagination variables and method inside class
    const paginationLogic = `
  // --- Pagination ---
  pageIndex = 0;
  pageSize = 10;
  pageSizeOptions = [5, 10, 25, 50];

  onPageChange(event: PageEvent): void {
    this.pageIndex = event.pageIndex;
    this.pageSize = event.pageSize;
  }
`;
    // Insert right after `export class ... implements OnInit {` or similar
    content = content.replace(/(export class \w+(?: implements \w+)?\s*\{)/, `$1\n${paginationLogic}`);
    
    fs.writeFileSync(filePath, content, 'utf8');
    console.log("Updated TS:", filePath);
}

function processHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    if (content.includes('paginate:pageIndex:pageSize')) return;
    if (!content.includes('*ngFor')) return;
    
    // 1. Find *ngFor="let item of list" and add pipe
    // We only want to target the main table row, usually it's `<tr *ngFor="let m of missions">`
    // So we replace `let \w+ of \w+(?: \w+)?`
    content = content.replace(/\*ngFor="let\s+(\w+)\s+of\s+([a-zA-Z0-9_\.]+)(\s*.*?)?"/g, (match, item, list, extra) => {
        extra = extra || "";
        // If there's already a pipe (like keyvalue), we append. 
        if (extra.includes('paginate')) return match;
        return `*ngFor="let ${item} of (${list} | paginate:pageIndex:pageSize)${extra}"`;
    });
    
    // 2. We need to find the list variable to pass to MatPaginator length
    // We can extract it from the replaced *ngFor (the first one is usually the list)
    let listVarMatch = content.match(/\*ngFor="let\s+\w+\s+of\s+\(([a-zA-Z0-9_\.]+)\s*\|\s*paginate/);
    if (listVarMatch) {
        const listVar = listVarMatch[1];
        
        // 3. Inject MatPaginator after </table> or </div> enclosing table
        const paginatorHtml = `
  <mat-paginator
    [length]="(${listVar} || []).length"
    [pageSize]="pageSize"
    [pageSizeOptions]="pageSizeOptions"
    (page)="onPageChange($event)">
  </mat-paginator>
`;
        // Replace `</table>` with `</table>` + paginator
        // Wait, some tables are wrapped in divs. Let's just append after </table>
        content = content.replace(/<\/table>/, `</table>\n${paginatorHtml}`);
        
        fs.writeFileSync(filePath, content, 'utf8');
        console.log("Updated HTML:", filePath);
    }
}

// Revert fuel-list so the script can process it uniformly if we want, or just let it process the rest.
// I will just let it process everything in fleet except fuel-fillings/fuel-list to avoid conflicts.
processDirectory('c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet');