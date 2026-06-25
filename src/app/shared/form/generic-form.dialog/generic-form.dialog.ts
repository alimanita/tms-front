import { Component, inject } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { MAT_DIALOG_DATA, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { GenericFormDialogData } from '../form-field.model';


@Component({
  selector: 'app-generic-form-dialog',
  templateUrl: './generic-form.dialog.html',
  styleUrl: './generic-form.dialog.scss',
  imports: [
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
  ],
})
export class GenericFormDialogComponent {
  protected readonly data = inject<GenericFormDialogData>(MAT_DIALOG_DATA);
  protected readonly dialogRef = inject(MatDialogRef<GenericFormDialogComponent>);
  private readonly fb = inject(FormBuilder);

  protected readonly form = this.fb.group(
    Object.fromEntries(
      this.data.fields.map((field) => [
        field.key,
        [this.initFieldValue(field.key, field.type), field.required ? Validators.required : []],
      ])
    )
  );

  // ── datetime-local helpers ─────────────────────────────────────────────────

  protected getDatePart(key: string): string {
    const val = this.form.get(key)?.value;
    if (!val) return '';
    return String(val).slice(0, 10);
  }

  protected getTimePart(key: string): string {
    const val = this.form.get(key)?.value;
    if (!val) return '';
    const str = String(val);
    if (str.includes('T')) return str.slice(11, 16);
    return '';
  }

  protected onDatePartChange(key: string, event: Event): void {
    const datePart = (event.target as HTMLInputElement).value;
    const timePart = this.getTimePart(key) || '00:00';
    this.form.get(key)?.setValue(datePart ? `${datePart}T${timePart}:00Z` : null);
    this.form.get(key)?.markAsDirty();
  }

  protected onTimePartChange(key: string, event: Event): void {
    const timePart = (event.target as HTMLInputElement).value;
    const datePart = this.getDatePart(key);
    if (datePart) {
      this.form.get(key)?.setValue(`${datePart}T${timePart}:00Z`);
      this.form.get(key)?.markAsDirty();
    }
  }

  // ── Init valeurs ───────────────────────────────────────────────────────────

  private initFieldValue(key: string, type: string): unknown {
    const raw = this.data.value?.[key];
    if (raw == null || raw === '') return null;

    if (
      (type === 'datepicker' || type === 'date' || type === 'datetime-local') &&
      typeof raw === 'string'
    ) {
      return raw.slice(0, 16).replace(' ', 'T');
    }

    return raw;
  }

  // ── Submit ─────────────────────────────────────────────────────────────────

  submit(): void {
    if (this.form.invalid) return;

    const raw = this.form.getRawValue() as Record<string, unknown>;

    const normalized = Object.fromEntries(
      Object.entries(raw).map(([key, value]) => {
        const field = this.data.fields.find((f) => f.key === key);

        if (value === '' || value == null) return [key, null];

        if (field?.type === 'number') return [key, Number(value)];

        if (field?.type === 'select') {
          if (!isNaN(Number(value)) && String(Number(value)) === String(value)) {
            return [key, Number(value)];
          }
          return [key, value];
        }

        if (
          (field?.type === 'datetime-local' ||
            field?.type === 'datepicker' ||
            field?.type === 'date') &&
          typeof value === 'string'
        ) {
          return [key, new Date(value).toISOString()];
        }

        return [key, value];
      })
    );

    this.dialogRef.close(normalized);
  }
}