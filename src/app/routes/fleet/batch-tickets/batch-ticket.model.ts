export type TicketType = 'PEAGE' | 'CARBURANT' | 'UNKNOWN';
export type Confidence = 'HIGH' | 'LOW' | 'NONE' | 'UNKNOWN';
export type ProcessingStatus = 'PENDING' | 'PROCESSING' | 'OK' | 'PARTIAL' | 'ERROR';

export interface BatchTicketItem {
  ticketIndex: number;
  fileName: string;
  file?: File;
  previewUrl?: string;
  
  ticketType: TicketType;
  typeConfidence: Confidence;
  processingStatus: ProcessingStatus;
  errorMessage?: string;
  
  // Date
  operationDate?: string;
  dateConfidence?: Confidence;
  dateWarning?: string;
  
  // Common / financial
  amountTTC?: number;
  amountHT?: number;
  tvaAmount?: number;
  tvaRate?: number;

  // Toll specific
  gareEntree?: string;
  gareSortie?: string;
  receiptNumber?: string;
  societeAutoroute?: string;

  // Fuel specific
  quantityLiters?: number;
  pricePerLiter?: number;
  totalCost?: number;
  fuelType?: string;
  
  // Selection
  vehiculeId?: number;
  chauffeurId?: number;
  missionId?: number;
  notes?: string;

  // UI state
  isEditing?: boolean;
  isValid?: boolean;
}

export interface BatchSaveItemPayload {
  ticketIndex: number;
  ticketType: TicketType;
  vehiculeId: number;
  chauffeurId?: number;
  missionId?: number;
  operationDate?: string;
  receiptNumber?: string;
  notes?: string;
  amountTTC?: number;
  amountHT?: number;
  tvaAmount?: number;
  tvaRate?: number;
  gareEntree?: string;
  gareSortie?: string;
  societeAutoroute?: string;
  quantityLiters?: number;
  pricePerLiter?: number;
  totalCost?: number;
  fuelType?: string;
}

export interface BatchSaveRequestPayload {
  items: BatchSaveItemPayload[];
}

export interface BatchSaveResultResponse {
  savedCount: number;
  failedCount: number;
  results: {
    ticketIndex: number;
    ticketType: TicketType;
    savedId?: number;
    success: boolean;
    errorMessage?: string;
  }[];
}
