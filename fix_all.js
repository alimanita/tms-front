const fs = require('fs');

function fixAll(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = require('path').join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            fixAll(fullPath);
        } else if (file.endsWith('-list.component.ts')) {
            let ts = fs.readFileSync(fullPath, 'utf8');
            ts = ts.replace(/,\s*,\s*MatPaginatorModule/g, ', MatPaginatorModule');
            fs.writeFileSync(fullPath, ts, 'utf8');
        } else if (file.endsWith('fuel-list.component.html')) {
            let html = fs.readFileSync(fullPath, 'utf8');
            html = html.replace(/\[length\]="filteredPleins\.length"/, '[length]="pleins.length"');
            fs.writeFileSync(fullPath, html, 'utf8');
        }
    }
}
fixAll('c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet');