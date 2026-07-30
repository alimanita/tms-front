import {
  Component,
  Input,
  Output,
  EventEmitter,
  OnInit,
  OnDestroy,
  OnChanges,
  SimpleChanges,
  ChangeDetectionStrategy,
  ChangeDetectorRef,
  forwardRef,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { ControlValueAccessor, NG_VALUE_ACCESSOR } from '@angular/forms';
import { Subject } from 'rxjs';
import { debounceTime, distinctUntilChanged, takeUntil } from 'rxjs/operators';

export interface AutocompleteOption {
  id: number | string;
  label: string;
  sublabel?: string;
  meta?: string;
}

@Component({
  selector: 'app-autocomplete',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './autocomplete.component.html',
  styleUrls: ['./autocomplete.component.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
  providers: [
    {
      provide: NG_VALUE_ACCESSOR,
      useExisting: forwardRef(() => AutocompleteComponent),
      multi: true,
    },
  ],
})
export class AutocompleteComponent
  implements OnInit, OnDestroy, OnChanges, ControlValueAccessor {

  @Input() options: AutocompleteOption[] = [];
  @Input() placeholder = 'Rechercher…';
  @Input() emptyMessage = 'Aucun résultat';
  @Input() showCreate = true;
  @Input() createLabel?: string;
  @Input() loading = false;
  @Input() disabled = false;
  @Input() pageSize = 20;
  @Input() hasError = false;

  /** Clé unique par ligne — quand elle change, l'input est réinitialisé */
  @Input() resetKey: any = null;

  @Input() displayFn: (opt: AutocompleteOption) => string =
    (opt) => opt.label;

  @Output() selected      = new EventEmitter<AutocompleteOption>();
  @Output() createClicked = new EventEmitter<string>();
  @Output() searchChange  = new EventEmitter<string>();

  searchTerm     = '';
  isOpen         = false;
  visibleOptions: AutocompleteOption[] = [];

  private displayLimit = this.pageSize;
  private allFiltered: AutocompleteOption[] = [];
  private destroy$ = new Subject<void>();
  private search$  = new Subject<string>();
private currentValue: any = null;
  private _onChange  = (_: any) => {};
  private _onTouched = () => {};

  constructor(private cdr: ChangeDetectorRef) {}

  // ── CVA ────────────────────────────────────────────────────────────────────

  writeValue(value: any): void {
    if (value == null || value === '') {
       this.currentValue = value; 
      this.searchTerm = '';
      this.cdr.markForCheck();
      return;
    }
    const found = this.options.find(o => o.id === value);
    this.searchTerm = found ? this.displayFn(found) : String(value);
    this.cdr.markForCheck();
  }

  registerOnChange(fn: any): void  { this._onChange  = fn; }
  registerOnTouched(fn: any): void { this._onTouched = fn; }

  setDisabledState(d: boolean): void {
    this.disabled = d;
    this.cdr.markForCheck();
  }

  // ── Lifecycle ──────────────────────────────────────────────────────────────

  ngOnInit(): void {
    this.displayLimit = this.pageSize;

    this.search$.pipe(
      debounceTime(150),
      distinctUntilChanged(),
      takeUntil(this.destroy$),
    ).subscribe(term => {
      this.displayLimit   = this.pageSize;
      this.allFiltered    = this.filterOptions(term);
      this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
      this.searchChange.emit(term);
      this.cdr.markForCheck();
    });

    this.allFiltered    = this.options.slice();
    this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
  }

 ngOnChanges(changes: SimpleChanges): void {
  if (changes['resetKey'] && !changes['resetKey'].firstChange) {
    this.currentValue   = null;      // ← réinitialiser aussi la valeur mémorisée
    this.searchTerm     = '';
    this.isOpen         = false;
    this.displayLimit   = this.pageSize;
    this.allFiltered    = this.options.slice();
    this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
    this.cdr.markForCheck();
    return;                          // ← sortir, ne pas traiter 'options' après reset
  }

  if (changes['options']) {
    // ← résoudre le label depuis currentValue (pas depuis searchTerm)
    if (this.currentValue != null) {
      const found = this.options.find(o => o.id === this.currentValue);
      this.searchTerm = found ? this.displayFn(found) : '';
    }
    this.allFiltered    = this.filterOptions(this.searchTerm);
    this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
    this.cdr.markForCheck();
  }
}

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
  }

  // ── Handlers ───────────────────────────────────────────────────────────────

  onInput(value: string): void {
    this.searchTerm = value;
    this.isOpen     = true;
    this.search$.next(value);
  }

  onFocus(): void {
    this.displayLimit   = this.pageSize;
    this.allFiltered    = this.filterOptions(this.searchTerm);
    this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
    this.isOpen         = true;
    this.cdr.markForCheck();
  }

  onBlur(): void {
    setTimeout(() => {
      this.isOpen = false;
      this._onTouched();
      this.cdr.markForCheck();
    }, 200);
  }

  selectOption(opt: AutocompleteOption): void {
    this.searchTerm = this.displayFn(opt);
    this.isOpen     = false;
    this._onChange(opt.id);
    this.selected.emit(opt);
    this.cdr.markForCheck();
  }

  onCreate(): void {
    this.isOpen = false;
    this.createClicked.emit(this.searchTerm);
    this.cdr.markForCheck();
  }

  clear(): void {
    this.searchTerm     = '';
    this.displayLimit   = this.pageSize;
    this.allFiltered    = this.options.slice();
    this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
    this.isOpen         = true;
    this._onChange(null);
    this.cdr.markForCheck();
  }

  onScroll(event: Event): void {
    const el = event.target as HTMLElement;
    const atBottom = el.scrollTop + el.clientHeight >= el.scrollHeight - 5;
    if (atBottom && this.visibleOptions.length < this.allFiltered.length) {
      this.displayLimit  += this.pageSize;
      this.visibleOptions = this.allFiltered.slice(0, this.displayLimit);
      this.cdr.markForCheck();
    }
  }

  // ── Helpers ────────────────────────────────────────────────────────────────

  private filterOptions(term: string): AutocompleteOption[] {
    const lower = (term || '').toLowerCase().trim();
    if (!lower) return this.options.slice();
    return this.options.filter(o =>
      o.label.toLowerCase().includes(lower) ||
      (o.sublabel || '').toLowerCase().includes(lower),
    );
  }
}