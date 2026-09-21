import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from 'environments/environment';
import { BatchTicketItem, BatchSaveRequestPayload, BatchSaveResultResponse } from './batch-ticket.model';

@Injectable({ providedIn: 'root' })
export class BatchTicketService {
  private readonly http = inject(HttpClient);
  private readonly baseUrl = `${environment.baseUrl}/fleet/tickets/batch`;

  analyzeBatch(files: File[]): Observable<BatchTicketItem[]> {
    const formData = new FormData();
    files.forEach((file) => {
      formData.append('files', file, file.name);
    });
    return this.http.post<BatchTicketItem[]>(`${this.baseUrl}/analyze`, formData);
  }

  saveBatch(payload: BatchSaveRequestPayload, filesMap?: Map<number, File>): Observable<BatchSaveResultResponse> {
    const formData = new FormData();
    const jsonBlob = new Blob([JSON.stringify(payload)], { type: 'application/json' });
    formData.append('data', jsonBlob);

    if (filesMap) {
      filesMap.forEach((file, index) => {
        if (file) {
          formData.append(`file_${index}`, file, file.name);
        }
      });
    }

    return this.http.post<BatchSaveResultResponse>(`${this.baseUrl}/save`, formData);
  }
}

