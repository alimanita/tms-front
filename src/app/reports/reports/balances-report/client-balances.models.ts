// ── client-balances.models.ts ─────────────────────────────────────────────────
// Fichier partagé entre ClientBalancesComponent et ClientStatsComponent

export interface ClientSolde {
  id                  : number;
  nom                 : string;
  prenom              : string | null;
  matriculeFiscal     : string | null;
  totalBls            : number;
  totalEncaissements  : number;
  solde               : number;
  datePremiereCreance : string | null;
  nombreBls           : number;
  datePremierBl       : string | null;
}

export type ScoreLabel = 'CRITIQUE' | 'ÉLEVÉ' | 'MODÉRÉ' | 'FAIBLE';

export interface ClientAvecScore extends ClientSolde {
  score             : number;
  scoreLabel        : ScoreLabel;
  joursDebt         : number;
  frequenceMensuelle: number;
}