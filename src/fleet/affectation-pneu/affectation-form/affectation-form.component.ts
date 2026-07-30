import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { FleetService, PneuResponse, VehiculeResponse } from '../../fleet.service';

@Component({
  selector: 'app-affectation-form',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, MatSnackBarModule, RouterModule],
  templateUrl: './affectation-form.component.html',
  styleUrls: ['./affectation-form.component.scss'],
})
export class AffectationFormComponent implements OnInit {
  form!: FormGroup;
  loading = false;
  submitted = false;

  pneus: PneuResponse[] = [];
  vehicules: VehiculeResponse[] = [];
  readonly positions = ['FL', 'FR', 'RL', 'RR', 'RL_INT', 'RR_INT', 'SPARE'];

  constructor(
    private fb: FormBuilder,
    private fleetService: FleetService,
    private router: Router,
    private snackBar: MatSnackBar,
  ) {}

  ngOnInit(): void {
    this.form = this.fb.group({
      pneuId: [null, Validators.required],
      vehiculeId: [null, Validators.required],
      position: ['FL', Validators.required],
      mountDate: [null, Validators.required],
      mountMileage: [0, [Validators.required, Validators.min(0)]],
      notes: [''],
    });

    this.loadData();
  }

  loadData(): void {
    // Ideally we fetch only Pneus en stock, but for now we fetch all and filter client side
    this.fleetService.getPneus().subscribe({
      next: (page: any) => {
        const allPneus = page.content ?? page;
        this.pneus = allPneus.filter((p: PneuResponse) => p.status === 'STOCK' && p.isActive);
      }
    });
    this.fleetService.getVehicules().subscribe({
      next: (page: any) => {
        this.vehicules = page.content ?? page;
      }
    });
  }

  onSubmit(): void {
    this.submitted = true;
    if (this.form.invalid) return;

    this.loading = true;
    this.fleetService.saveAffectationPneu(this.form.value).subscribe({
      next: () => {
        this.snackBar.open('Pneu monté avec succès', 'Fermer', { duration: 3000 });
        this.router.navigate(['/fleet/affectation-pneus']);
      },
      error: () => {
        this.snackBar.open('Erreur lors de la sauvegarde', 'Fermer', { duration: 3000 });
        this.loading = false;
      }
    });
  }

  onCancel(): void {
    this.router.navigate(['/fleet/affectation-pneus']);
  }
}
