import {
  Component, EventEmitter, Input, Output,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, ValidationErrors } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { FleetService, MachineResponse } from '../../fleet.service';

@Component({
  selector: 'app-update-machine-hours-dialog',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatIconModule, MatProgressSpinnerModule],
  templateUrl: './update-machine-hours-dialog.html',
  styleUrl: './update-machine-hours-dialog.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class UpdateMachineHoursDialogComponent {
  @Input() machine?: MachineResponse;

  isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() updated = new EventEmitter<void>();

  @Input() set open(val: boolean) {
    this.isOpen = val;
    if (val) this.initForm();
  }

  form!: FormGroup;
  loading = false;

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({});
  }

  private initForm(): void {
    const heuresActuelles = this.machine?.heuresActuelles ?? 0;
    this.form = this.fb.group({
      nouvellesHeures: [
        heuresActuelles,
        [Validators.required, Validators.min(0), this.pasInferieurValidator(heuresActuelles)],
      ],
    });
    this.cdr.markForCheck();
  }

  private pasInferieurValidator(min: number) {
    return (control: AbstractControl): ValidationErrors | null => {
      if (control.value === null || control.value === '') return null;
      return Number(control.value) < min ? { inferieurActuel: true } : null;
    };
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (!this.loading) this.close();
  }

  submit(): void {
    if (this.form.invalid || !this.machine) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const nouvellesHeures = this.form.value.nouvellesHeures;

    // ⚠️ Hypothèse : méthode à ajouter dans FleetService si absente :
    //   updateHeuresActuelles(id: number, heures: number): Observable<any>
    this.fleetService.updateHeuresActuelles(this.machine.id, nouvellesHeures).subscribe({
      next: () => {
        this.loading = false;
        this.updated.emit();
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Erreur mise à jour heures', err);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}