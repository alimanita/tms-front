export type FormFieldType = 'text' | 'number' | 'date' | 'datetime-local' | 'select' | 'textarea' | 'datepicker';

export interface FormFieldOption {
  value: string | number;
  label: string;
}

export interface FormField {
  key: string;
  label: string;
  type: FormFieldType;
  required?: boolean;
  options?: FormFieldOption[];
}

export interface GenericFormDialogData {
  title: string;
  fields: FormField[];
  value?: Record<string, unknown>;
}
