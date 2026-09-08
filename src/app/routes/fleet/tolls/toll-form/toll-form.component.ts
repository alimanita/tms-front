import { Component, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService } from '../../fleet.service';
import { PeageRequest } from '../peage.model';
import { MatIconModule } from '@angular/material/icon';
import { MissionService } from '../../mission/mission.service';

@Component({
  selector: 'app-toll-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './toll-form.component.html',
  styleUrls: ['./toll-form.component.scss']
})
export class TollFormComponent implements OnInit {
  peageForm: FormGroup;
  vehicules: any[] = [];
  chauffeurs: any[] = [];
  missions: any[] = []; // Peut être vide, ou à charger si on a un endpoint getMissions

  selectedFile: File | null = null;
  loading = false;
  extracting = false;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private missionService: MissionService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {
    this.peageForm = this.fb.group({
      vehiculeId: [null, Validators.required],
      chauffeurId: [null, Validators.required],
      missionId: [null],
      datePassage: ['', Validators.required],
      amountTTC: [null, [Validators.required, Validators.min(0.01)]],
      amountHT: [null],
      tvaAmount: [null],
      tvaRate: [20.0],
      gareEntree: [''],
      gareSortie: [''],
      receiptNumber: [''],
      societeAutoroute: [''],
      notes: ['']
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
  }

  loadDropdowns(): void {
    this.fleetService.getVehicules({ size: 1000 }).subscribe((page: any) => this.vehicules = page.content ?? page);
    this.fleetService.getChauffeurs({ size: 1000 }).subscribe((page: any) => this.chauffeurs = page.content ?? page);
    this.missionService.findAll(0, 1000).subscribe((page: any) => this.missions = page.content ?? page);
  }

  isDragging = false;

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) {
      this.handleFile(file);
    }
  }

  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = true;
  }

  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
  }

  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragging = false;
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          const newFile = new File([file], `peage_colle_${new Date().getTime()}.png`, { type: file.type });
          this.handleFile(newFile);
          break;
        }
      }
    }
  }

  handleFile(file: File): void {
    this.selectedFile = file;
  }

  extractData(): void {
    if (!this.selectedFile) return;

    this.extracting = true;
    this.fleetService.extractPeageData(this.selectedFile).subscribe({
      next: (res: any) => {
        this.extracting = false;
        if (res) {
          this.peageForm.patchValue({
            amountTTC: res.amountTTC,
            amountHT: res.amountHT,
            tvaAmount: res.tvaAmount,
            tvaRate: res.tvaRate,
            gareEntree: res.entree,
            gareSortie: res.sortie,
            receiptNumber: res.receiptNumber,
            societeAutoroute: res.operator,
          });

          if (res.receiptDate) {
            this.peageForm.patchValue({ datePassage: res.receiptDate });
          }

          this.snackBar.open('Données extraites avec succès !', 'Fermer', { duration: 3000 });
        }
      },
      error: () => {
        this.extracting = false;
        this.snackBar.open("Erreur lors de l'extraction OCR", 'Fermer', { duration: 3000 });
      }
    });
  }

  savePeage(): void {
    if (this.peageForm.invalid) {
      this.snackBar.open('Veuillez remplir les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    const request: PeageRequest = this.peageForm.value;

    this.fleetService.savePeage(request, this.selectedFile || undefined).subscribe({
      next: () => {
        this.snackBar.open('Péage enregistré avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/tolls']);
      },
      error: () => {
        this.loading = false;
        this.snackBar.open("Erreur lors de l'enregistrement", 'Fermer', { duration: 3000 });
      }
    });
  }

  cancel(): void {
    this.router.navigate(['/fleet/tolls']);
  }
}
