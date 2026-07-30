import { Component, inject } from '@angular/core';
import {
  AbstractControl,
  FormBuilder,
  FormsModule,
  ReactiveFormsModule,
  ValidationErrors,
  Validators,
} from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatCheckboxModule } from '@angular/material/checkbox';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatStepperModule } from '@angular/material/stepper';
import { Router, RouterLink } from '@angular/router';
import { TranslatePipe  } from '@ngx-translate/core';

import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { CommonModule } from '@angular/common';
import { EntrepriseService } from 'app/company/entreprise.service';


@Component({
  selector: 'app-register',
  standalone: true,
  templateUrl: './register.html',
  styleUrl: './register.scss',
  imports: [
    CommonModule,
    RouterLink,
    FormsModule,
    ReactiveFormsModule,
    MatButtonModule,
    MatCardModule,
    MatCheckboxModule,
    MatFormFieldModule,
    MatInputModule,
    MatStepperModule,
    MatSnackBarModule,
    TranslatePipe,
  ],
})
export class Register {
  private readonly fb = inject(FormBuilder);
  private readonly entrepriseService = inject(EntrepriseService);
  private readonly router = inject(Router);
  private readonly snackBar = inject(MatSnackBar);

  isLoading = false;

  // Formulaire entreprise
  entrepriseForm = this.fb.nonNullable.group({
    nom: ['', [Validators.required, Validators.minLength(3)]],
    description: [''],
    email: ['', [Validators.required, Validators.email]],
    numTel: ['', [Validators.required]],
    matriculeFiscal: ['', [Validators.required]],
    codeFiscal: [''],
    steWeb: [''],
    // Adresse
    adresse1: ['', [Validators.required]],
    adresse2: [''],
    ville: ['', [Validators.required]],
    codePostale: ['', [Validators.required]],
    pays: ['', [Validators.required]],
  });

  // Formulaire utilisateur admin
  adminForm = this.fb.nonNullable.group(
    {
      nom: ['', [Validators.required]],
      prenom: ['', [Validators.required]],
      email: ['', [Validators.required, Validators.email]],
      login: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
    },
    {
      validators: [this.matchValidator('password', 'confirmPassword')],
    }
  );

  // Acceptation des conditions
  termsAccepted = false;

  matchValidator(source: string, target: string) {
    return (control: AbstractControl): ValidationErrors | null => {
      const sourceControl = control.get(source);
      const targetControl = control.get(target);

      if (!sourceControl || !targetControl) {
        return null;
      }

      if (targetControl.errors && !targetControl.errors['mismatch']) {
        return null;
      }

      if (sourceControl.value !== targetControl.value) {
        targetControl.setErrors({ mismatch: true });
        return { mismatch: true };
      } else {
        targetControl.setErrors(null);
        return null;
      }
    };
  }

  onSubmit(): void {
    if (this.entrepriseForm.invalid || this.adminForm.invalid || !this.termsAccepted) {
      this.snackBar.open(
        'Veuillez remplir tous les champs obligatoires et accepter les conditions',
        'Fermer',
        { duration: 3000 }
      );
      return;
    }

    this.isLoading = true;

    const entrepriseData = {
      nom: this.entrepriseForm.value.nom!,
      description: this.entrepriseForm.value.description || '',
      email: this.entrepriseForm.value.email!,
      numTel: this.entrepriseForm.value.numTel!,
      matriculeFiscal: this.entrepriseForm.value.matriculeFiscal!,
      codeFiscal: this.entrepriseForm.value.codeFiscal || '',
      steWeb: this.entrepriseForm.value.steWeb || '',
      adresse: {
        adresse1: this.entrepriseForm.value.adresse1!,
        adresse2: this.entrepriseForm.value.adresse2 || '',
        ville: this.entrepriseForm.value.ville!,
        codePostale: this.entrepriseForm.value.codePostale!,
        pays: this.entrepriseForm.value.pays!,
      },
      utilisateurAdmin: {
        nom: this.adminForm.value.nom!,
        prenom: this.adminForm.value.prenom!,
        email: this.adminForm.value.email!,
        login: this.adminForm.value.login!,
        password: this.adminForm.value.password!,
      },
    };

    this.entrepriseService.registerEntreprise(entrepriseData).subscribe({
      next: (response: any) => {
        this.snackBar.open(
          'Entreprise créée avec succès ! Vous allez être redirigé vers la page de connexion.',
          'Fermer',
          { duration: 5000 }
        );
        setTimeout(() => {
          this.router.navigate(['/auth/login']);
        }, 2000);
      },
      error: (error) => {
        this.isLoading = false;
        const errorMessage = error.error?.message || 
          'Une erreur est survenue lors de la création de l\'entreprise';
        this.snackBar.open(errorMessage, 'Fermer', { 
          duration: 5000,
          panelClass: ['error-snackbar']
        });
      },
    });
  }
}