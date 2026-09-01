import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { MatIconModule } from '@angular/material/icon';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PartenaireService } from '../partenaire.service';
import { SocietePartenaireResponse } from '../partenaire.model';

@Component({
  selector: 'app-partenaire-list',
  standalone: true,
  imports: [CommonModule, RouterModule, MatIconModule, MatSnackBarModule, ReactiveFormsModule],
  templateUrl: './partenaire-list.component.html',
  styleUrls: ['./partenaire-list.component.scss'],
})
export class PartenaireListComponent implements OnInit {
  partenaires: SocietePartenaireResponse[] = [];
  loading = true;
  showForm = false;
  editId: number | null = null;
  saving = false;
  form!: FormGroup;

  constructor(
    private partenaireService: PartenaireService,
    private snackBar: MatSnackBar,
    private fb: FormBuilder,
  ) {}

  ngOnInit(): void {
    this.initForm();
    this.loadPartenaires();
  }

  private initForm(): void {
    this.form = this.fb.group({
      nom: ['', Validators.required],
      matriculeFiscal: [''],
      contact: [''],
      telephone: [''],
      email: [''],
      adresse: [''],
      iban: [''],
      statut: ['ACTIF'],
      tauxCommissionDefaut: [null, [Validators.min(0), Validators.max(100)]],
    });
  }

  loadPartenaires(): void {
    this.loading = true;
    this.partenaireService.findAll(0, 200).subscribe({
      next: (page) => {
        this.partenaires = page.content;
        this.loading = false;
      },
      error: () => {
        this.loading = false;
        this.snackBar.open('Erreur chargement partenaires', 'Fermer', { duration: 3000 });
      }
    });
  }

  openNew(): void {
    this.editId = null;
    this.form.reset({ statut: 'ACTIF' });
    this.showForm = true;
  }

  openEdit(p: SocietePartenaireResponse): void {
    this.editId = p.id;
    this.form.patchValue(p);
    this.showForm = true;
  }

  closeForm(): void {
    this.showForm = false;
    this.editId = null;
    this.form.reset({ statut: 'ACTIF' });
  }

  onSave(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    this.saving = true;
    const val = this.form.value;
    const req$ = this.editId
      ? this.partenaireService.update(this.editId, val)
      : this.partenaireService.create(val);

    req$.subscribe({
      next: () => {
        this.saving = false;
        this.closeForm();
        this.loadPartenaires();
        this.snackBar.open('Partenaire enregistré !', 'Fermer', { duration: 3000 });
      },
      error: () => {
        this.saving = false;
        this.snackBar.open('Erreur lors de l\'enregistrement', 'Fermer', { duration: 4000 });
      }
    });
  }

  statutLabel(s: string): string {
    return s === 'ACTIF' ? 'Actif' : s === 'INACTIF' ? 'Inactif' : 'En attente';
  }
}
