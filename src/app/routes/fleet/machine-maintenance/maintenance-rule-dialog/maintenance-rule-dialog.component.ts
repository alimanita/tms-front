import {
  Component, EventEmitter, Input, OnDestroy, OnInit, Output,
  ChangeDetectionStrategy, ChangeDetectorRef
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';

import { MachineMaintenanceRuleService } from '../machine-maintenance-rule.service';
import { MachineMaintenanceRuleResponse } from '../machine-maintenance-rule.model';

@Component({
  selector: 'app-maintenance-rule-dialog',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatIconModule,
    MatCheckboxModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './maintenance-rule-dialog.component.html',
  styleUrl: './maintenance-rule-dialog.component.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MaintenanceRuleDialogComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  @Input() machineId!: number;
  @Input() rule?: MachineMaintenanceRuleResponse;

  isOpen = false;
  @Output() closed = new EventEmitter<void>();
  @Output() ruleSaved = new EventEmitter<void>();

  @Input() set open(val: boolean) {
    this.isOpen = val;
    if (val) this.initForm();
  }

  form!: FormGroup;
  loading = false;

  typesAction = [
    { value: 'LUBRIFICATION',         label: 'Lubrification' },
    { value: 'VIDANGE',               label: 'Vidange' },
    { value: 'VERIFICATION_NIVEAU',   label: 'Vér. niveau' },
    { value: 'VERIFICATION_TENSION',  label: 'Vér. tension' },
    { value: 'SERRAGE',               label: 'Serrage' },
    { value: 'NETTOYAGE',             label: 'Nettoyage' },
    { value: 'REMPLACEMENT',          label: 'Remplacement' },
    { value: 'AUTRE',                 label: 'Autre' },
  ];

  constructor(
    private fb: FormBuilder,
    private ruleService: MachineMaintenanceRuleService,
    private cdr: ChangeDetectorRef,
  ) {
    this.form = this.fb.group({});
  }

  ngOnInit(): void {
    this.initForm();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  get isEditMode(): boolean {
    return !!this.rule?.id;
  }

  private initForm(): void {
    const r = this.rule;
    this.form = this.fb.group({
      code:                       [r?.code ?? ''],
      typeAction:                 [r?.typeAction ?? '', Validators.required],
      description:                [r?.description ?? '', Validators.required],
      consommable:                [r?.consommable ?? ''],
      quantite:                   [r?.quantite ?? null],
      uniteQuantite:              [r?.uniteQuantite ?? ''],
      intervalleHeures:           [r?.intervalleHeures ?? null],
      intervalleJours:            [r?.intervalleJours ?? null],
      dernieresHeuresEffectuees:  [r?.dernieresHeuresEffectuees ?? null],
      derniereDateEffectuee:      [r?.derniereDateEffectuee ?? null],
      actif:                      [r?.actif ?? true],
    });
    this.cdr.markForCheck();
  }

  close(): void {
    this.closed.emit();
  }

  onBackdropClick(): void {
    if (!this.loading) this.close();
  }

  submit(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      this.cdr.markForCheck();
      return;
    }

    this.loading = true;
    this.cdr.markForCheck();

    const payload = {
      ...this.form.getRawValue(),
      machineId: this.machineId,
    };

    const req$ = this.isEditMode
      ? this.ruleService.update(this.rule!.id, payload)
      : this.ruleService.create(payload);

    req$.pipe(takeUntil(this.destroy$)).subscribe({
      next: () => {
        this.loading = false;
        this.ruleSaved.emit();
        this.cdr.markForCheck();
      },
      error: err => {
        console.error('Erreur enregistrement règle de maintenance', err);
        this.loading = false;
        this.cdr.markForCheck();
      },
    });
  }
}