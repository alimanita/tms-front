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

  saveBatch(payload: BatchSaveRequestPayload): Observable<BatchSaveResultResponse> {
    return this.http.post<BatchSaveResultResponse>(`${this.baseUrl}/save`, payload);
  }
}
