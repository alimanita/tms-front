import { Pipe, PipeTransform } from '@angular/core';
import { PaiementLigne } from 'app/reports/reports/financial-report/financial-report';



@Pipe({ name: 'modeCount', standalone: true })
export class ModeCountPipe implements PipeTransform {
  transform(lignes: PaiementLigne[], mode: string): number {
    return lignes.filter(l => l.modePaiement === mode).length;
  }
}