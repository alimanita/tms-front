const fs = require('fs');
const path = 'c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet/fuel-fillings/fuel-list/fuel-list.component.html';
let c = fs.readFileSync(path, 'utf8');

// Count paginators
const count = (c.match(/<mat-paginator/g) || []).length;
console.log('Found ' + count + ' paginators');

if (count === 0) {
    c = c.replace(/<\/table>/, '</table>\n  <mat-paginator\n    [length]="(pleins || []).length"\n    [pageSize]="pageSize"\n    [pageSizeOptions]="pageSizeOptions"\n    (page)="onPageChange($event)">\n  </mat-paginator>\n');
    c = c.replace(/\*ngFor="let p of pleins"/, '*ngFor="let p of (pleins | paginate:pageIndex:pageSize)"');
    fs.writeFileSync(path, c, 'utf8');
    console.log('Added single paginator');
} else if (count > 1) {
    // Remove all and add one
    c = c.replace(/<mat-paginator[\s\S]*?<\/mat-paginator>/g, '');
    c = c.replace(/<\/table>/, '</table>\n  <mat-paginator\n    [length]="(pleins || []).length"\n    [pageSize]="pageSize"\n    [pageSizeOptions]="pageSizeOptions"\n    (page)="onPageChange($event)">\n  </mat-paginator>\n');
    fs.writeFileSync(path, c, 'utf8');
    console.log('Fixed double paginator');
} else {
    console.log('Exactly one paginator already present');
}