const fs = require('fs');
const path = require('path');

function processDirectory(dir) {
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (fs.statSync(fullPath).isDirectory()) {
            processDirectory(fullPath);
        } else if (file.endsWith('-list.component.ts')) {
            fixTsFile(fullPath);
        } else if (file.endsWith('-list.component.html')) {
            fixHtmlFile(fullPath);
        }
    }
}

function fixTsFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix undefined in imports: [ ..., , MatPaginatorModule, PaginatePipe]
    content = content.replace(/,\s*,\s*MatPaginatorModule/g, ', MatPaginatorModule');
    
    // Fix duplicate pagination logic:
    // If we have "// --- Pagination ---" block and ALSO another pageIndex, pageSize, onPageChange, we should remove the old one.
    // Or we remove the new one if there was an old one. Actually, let's just remove the generic block if the class already had pageIndex before.
    
    // Check if duplicate onPageChange exists:
    const onPageChangeCount = (content.match(/onPageChange/g) || []).length;
    if (onPageChangeCount > 1) {
        // Remove the one we injected
        content = content.replace(/\n\s*\/\/ --- Pagination ---\n\s*pageIndex = 0;\n\s*pageSize = 10;\n\s*pageSizeOptions = \[5, 10, 25, 50\];\n\n\s*onPageChange\(event: PageEvent\): void \{\n\s*this\.pageIndex = event\.pageIndex;\n\s*this\.pageSize = event\.pageSize;\n\s*\}\n/, '');
    }
    
    fs.writeFileSync(filePath, content, 'utf8');
}

function fixHtmlFile(filePath) {
    let content = fs.readFileSync(filePath, 'utf8');
    
    // Fix machine-list.component.html `(machines | paginate:pageIndex:pageSize)()`
    // Original might have been `machines()` because it's a signal. 
    // Wait, if it's a signal, the pipe goes AFTER the call: `machines() | paginate...`
    // Let's fix that.
    content = content.replace(/\(([a-zA-Z0-9_\.]+)\s*\|\s*paginate:pageIndex:pageSize\)\(\)/g, "($1() | paginate:pageIndex:pageSize)");
    
    fs.writeFileSync(filePath, content, 'utf8');
}

processDirectory('c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet');