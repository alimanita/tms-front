const fs = require('fs');
const p = 'c:/Users/HP/Desktop/Marbre/tms-system/tms-frontend/src/app/routes/fleet/fleet.service.ts';
let c = fs.readFileSync(p, 'utf8');

const methods = `
  updatePlein(id: number, request: PleinCarburantRequest, file?: File): Observable<PleinCarburantResponse> {
    const formData = new FormData();
    formData.append('plein', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (file) {
      formData.append('justificatif', file);
    }
    return this.http.put<PleinCarburantResponse>(\`\${this.apiUrl}/carburant/\${id}\`, formData);
  }

  extractPeageData(file: File): Observable<any> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<any>(\`\${this.apiUrl}/peages/extract\`, formData);
  }

  savePeage(request: any, file?: File): Observable<any> {
    const formData = new FormData();
    formData.append('peage', new Blob([JSON.stringify(request)], { type: 'application/json' }));
    if (file) {
      formData.append('justificatif', file);
    }
    return this.http.post<any>(\`\${this.apiUrl}/peages\`, formData);
  }

  getTolls(params?: any): Observable<any> {
    return this.http.get<any>(\`\${this.apiUrl}/peages\`, { params });
  }

  getTollProofFile(missionId: number, depenseId: number): Observable<Blob> {
    return this.http.get(\`\${this.apiUrl}/missions/\${missionId}/expenses/\${depenseId}/proof\`, { responseType: 'blob' });
  }
`;

// Only add if missing
if (!c.includes('updatePlein')) {
    // Find the last index of '}'
    const lastIndex = c.lastIndexOf('}');
    if (lastIndex !== -1) {
        c = c.substring(0, lastIndex) + methods + '\n}\n';
        fs.writeFileSync(p, c, 'utf8');
        console.log("Methods added properly");
    }
} else {
    console.log("Already present");
}