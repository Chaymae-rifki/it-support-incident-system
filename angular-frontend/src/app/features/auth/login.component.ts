import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="min-h-screen bg-[#F6F8FA] flex flex-col lg:flex-row">
      <div class="lg:w-[48%] bg-gradient-to-br from-indigo-50 via-white to-teal-50/70 border-r border-slate-200 p-12 flex flex-col justify-between">
        <div>
          <div class="flex items-center gap-3">
            <div class="w-9 h-9 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold">DF</div>
            <span class="text-xl font-semibold text-slate-900">DeskFlow IT</span>
          </div>
          <div class="mt-12 max-w-lg">
            <p class="text-xs font-semibold text-indigo-700 mb-3">Portail de Support & Gestion des Incidents</p>
            <h1 class="text-3xl font-semibold text-slate-900 leading-tight">
              Pilotez le cycle de vie de chaque incident informatique.
            </h1>
            <p class="mt-4 text-slate-600 text-sm leading-relaxed">
              Centralisez les demandes des collaborateurs, coordonnez les équipes techniques et suivez vos indicateurs de résolution en temps réel.
            </p>
          </div>
        </div>
        <div class="text-xs text-slate-500 flex justify-between border-t border-slate-200 pt-6">
          <span>ENSA Fès · ILIA 2 (2026 / 2027)</span>
          <span>Chaymae Rifki & Imane Oubouni</span>
        </div>
      </div>

      <div class="flex-1 flex items-center justify-center p-8">
        <form [formGroup]="form" (ngSubmit)="submit()" class="w-full max-w-md bg-white border border-slate-200 rounded-2xl p-6 space-y-5">
          <div>
            <h2 class="text-xl font-semibold text-slate-900">Connexion à votre espace</h2>
            <p class="text-xs text-slate-500 mt-1">Authentification JWT Spring Security</p>
          </div>
          <div *ngIf="error" class="p-3 text-sm text-rose-700 bg-rose-50 border border-rose-200 rounded-xl">{{ error }}</div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Adresse e-mail</label>
            <input type="email" formControlName="email" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl" />
          </div>
          <div>
            <label class="block text-sm font-medium text-slate-700 mb-1">Mot de passe</label>
            <input type="password" formControlName="motDePasse" class="w-full px-3 py-2.5 text-sm border border-slate-300 rounded-xl" />
          </div>
          <button type="submit" [disabled]="form.invalid" class="w-full py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white text-sm font-medium rounded-xl">
            Se connecter
          </button>
        </form>
      </div>
    </div>
  `,
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = '';

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    const { email, motDePasse } = this.form.value;
    this.auth.login(email!, motDePasse!).subscribe({
      next: (res) => this.router.navigate([res.user.role === 'EMPLOYE' ? '/tickets' : '/dashboard']),
      error: (err) => (this.error = err.error?.message || 'Identifiants invalides'),
    });
  }
}
