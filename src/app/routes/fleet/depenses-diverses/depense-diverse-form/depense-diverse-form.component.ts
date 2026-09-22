import { Component, HostListener, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatIconModule } from '@angular/material/icon';

import { FleetService } from '../../fleet.service';
import { CATEGORIES_DEPENSE, DepenseDiverseRequest } from '../depense-diverse.model';

@Component({
  selector: 'app-depense-diverse-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, MatIconModule],
  templateUrl: './depense-diverse-form.component.html',
  styleUrls: ['./depense-diverse-form.component.scss'],
})
export class DepenseDiverseFormComponent implements OnInit {
  form: FormGroup;
  chauffeurs: any[] = [];
  vehicules: any[] = [];
  categories = CATEGORIES_DEPENSE;

  isEdit = false;
  depenseId?: number;
  selectedFile: File | null = null;
  existingProofUrl: string | null = null;
  loading = false;
  isDragging = false;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private route: ActivatedRoute,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {
    this.form = this.fb.group({
      chauffeurId: [null, Validators.required],
      vehiculeId:  [null],
      dateDepense: [new Date().toISOString().slice(0, 16), Validators.required],
      categorie:   ['AUTRE', Validators.required],
      description: [''],
      amountTTC:   [null, [Validators.required, Validators.min(0.01)]],
      receiptNumber: [''],
      notes:       [''],
    });
  }

  ngOnInit(): void {
    this.loadDropdowns();
    this.route.params.subscribe(p => {
      if (p['id']) {
        this.isEdit = true;
        this.depenseId = +p['id'];
        this.loadDepense(this.depenseId);
      }
    });
  }

  loadDropdowns(): void {
    this.fleetService.getChauffeurs({ size: 1000 }).subscribe((page: any) => {
      this.chauffeurs = page.content ?? page;
      const qpChauffeurId = this.route.snapshot.queryParams['chauffeurId'];
      if (qpChauffeurId && !this.isEdit) {
        this.form.patchValue({ chauffeurId: +qpChauffeurId });
      }
    });

    this.fleetService.getVehicules({ size: 1000 }).subscribe((page: any) => {
      this.vehicules = page.content ?? page;
    });
  }

  loadDepense(id: number): void {
    this.fleetService.getDepenseDiverseById(id).subscribe({
      next: (data: any) => {
        this.form.patchValue({
          chauffeurId:   data.chauffeurId,
          vehiculeId:    data.vehiculeId ?? null,
          dateDepense:   data.dateDepense ? data.dateDepense.slice(0, 16) : '',
          categorie:     data.categorie,
          description:   data.description,
          amountTTC:     data.amountTTC,
          receiptNumber: data.receiptNumber,
          notes:         data.notes,
        });
        if (data.proofUrl) this.existingProofUrl = data.proofUrl;
      },
      error: () => this.snackBar.open('Erreur chargement dépense', 'Fermer', { duration: 3000 }),
    });
  }

  // ── File handling ─────────────────────────────────────────────────

  onFileSelected(event: any): void {
    const file = event.target.files?.[0];
    if (file) this.handleFile(file);
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
    if (files && files.length > 0) this.handleFile(files[0]);
  }

  @HostListener('window:paste', ['$event'])
  onPaste(event: ClipboardEvent): void {
    const items = event.clipboardData?.items;
    if (!items) return;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const file = items[i].getAsFile();
        if (file) {
          this.handleFile(new File([file], `depense_colle_${Date.now()}.png`, { type: file.type }));
          break;
        }
      }
    }
  }

  handleFile(file: File): void {
    this.selectedFile = file;
  }

  removeFile(): void {
    this.selectedFile = null;
    this.existingProofUrl = null;
  }

  extracting = false;
  extractData(): void {
    if (!this.selectedFile) return;
    this.extracting = true;
    this.fleetService.extractDepenseDiverseData(this.selectedFile).subscribe({
      next: (res: any) => {
        this.extracting = false;
        this.snackBar.open('Données extraites avec succès', 'Fermer', { duration: 3000 });
        if (res) {
          const patchObj: any = {};
          if (res.amountTTC != null) patchObj.amountTTC = res.amountTTC;
          if (res.receiptNumber != null) patchObj.receiptNumber = res.receiptNumber;
          if (res.dateDepense != null) patchObj.dateDepense = res.dateDepense.slice(0, 16); // YYYY-MM-DDTHH:mm
          if (res.categorie != null && this.categories.some(c => c.value === res.categorie)) {
            patchObj.categorie = res.categorie;
          }
          if (res.notes != null) patchObj.notes = res.notes;
          
          this.form.patchValue(patchObj);
        }
      },
      error: () => {
        this.extracting = false;
        this.snackBar.open("Échec de l'extraction", 'Fermer', { duration: 3000 });
      }
    });
  }

  // ── Save ─────────────────────────────────────────────────────────

  save(): void {
    if (this.form.invalid) {
      this.snackBar.open('Veuillez remplir les champs obligatoires', 'Fermer', { duration: 3000 });
      return;
    }

    this.loading = true;
    const request: DepenseDiverseRequest = this.form.value;

    const obs$ = this.isEdit && this.depenseId
      ? this.fleetService.updateDepenseDiverse(this.depenseId, request, this.selectedFile || undefined)
      : this.fleetService.saveDepenseDiverse(request, this.selectedFile || undefined);

    obs$.subscribe({
      next: () => {
        this.loading = false;
        this.snackBar.open(
          this.isEdit ? 'Dépense mise à jour' : 'Dépense enregistrée',
          'Fermer', { duration: 3000 }
        );
        this.router.navigate(['/fleet/depenses-diverses']);
      },
      error: (err: any) => {
        this.loading = false;
        const msg = err?.error?.detail || err?.error?.message || "Erreur lors de l'enregistrement";
        this.snackBar.open(msg, 'Fermer', { duration: 3000 });
      },
    });
  }

  cancel(): void {
    this.router.navigate(['/fleet/depenses-diverses']);
  }
}
