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
    <div class="page">
      <div class="shell">

        <!-- Panneau gauche -->
        <div class="visual">
          <svg class="star white" viewBox="0 0 40 40" aria-hidden="true">
            <g stroke="currentColor" stroke-width="7">
              <line x1="20" y1="3" x2="20" y2="37"/>
              <line x1="5.3" y1="11.5" x2="34.7" y2="28.5"/>
              <line x1="5.3" y1="28.5" x2="34.7" y2="11.5"/>
            </g>
          </svg>
          <div class="visual-text">
            <p class="small">Vous pouvez facilement</p>
            <h2>Accéder à votre espace de support informatique</h2>
          </div>
        </div>

        <!-- Formulaire -->
        <div class="formside">
          <form class="form" [formGroup]="form" (ngSubmit)="submit()">
            <svg class="star violet" viewBox="0 0 40 40" aria-hidden="true">
              <g stroke="currentColor" stroke-width="7">
                <line x1="20" y1="3" x2="20" y2="37"/>
                <line x1="5.3" y1="11.5" x2="34.7" y2="28.5"/>
                <line x1="5.3" y1="28.5" x2="34.7" y2="11.5"/>
              </g>
            </svg>

            <h1>Connexion</h1>
            <p class="subtitle">
              Accédez à vos tickets, suivez vos incidents et gardez tout le support informatique au même endroit.
            </p>

            <div class="err" *ngIf="error">{{ error }}</div>

            <label for="email">Votre e-mail</label>
            <input id="email" type="email" formControlName="email" autocomplete="username" />

            <label for="pwd">Mot de passe</label>
            <div class="pwd">
              <input id="pwd" [type]="showPwd ? 'text' : 'password'" formControlName="motDePasse" autocomplete="current-password" />
              <button type="button" class="eye" (click)="showPwd = !showPwd" [attr.aria-label]="showPwd ? 'Masquer le mot de passe' : 'Afficher le mot de passe'">
                <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
                  <path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12z"/>
                  <circle cx="12" cy="12" r="3"/>
                  <line *ngIf="showPwd" x1="3" y1="21" x2="21" y2="3"/>
                </svg>
              </button>
            </div>

            <button type="submit" class="submit" [disabled]="form.invalid || loading">
              {{ loading ? 'Connexion...' : 'Se connecter' }}
            </button>

            <p class="note">Pas de compte ? Contactez l'administrateur du service informatique.</p>
          </form>
        </div>

      </div>
    </div>
  `,
  styles: [`
    :host{display:block}
    .page{min-height:100vh;display:flex;align-items:center;justify-content:center;padding:32px;background:#F3F2FF;
      font-family:'Inter','Segoe UI',system-ui,sans-serif}

    /* ---------- Grande carte ---------- */
    .shell{width:100%;max-width:1060px;min-height:620px;display:flex;gap:16px;padding:14px;background:#fff;
      border-radius:32px;box-shadow:0 30px 80px rgba(80,60,200,.22)}

    /* ---------- Panneau gauche : dégradé flou ---------- */
    .visual{position:relative;flex:0 0 46%;border-radius:26px;overflow:hidden;padding:26px;
      display:flex;flex-direction:column;justify-content:space-between;color:#fff;
      background:
        radial-gradient(circle at 4% 0%, #a5eaff 0%, rgba(165,234,255,0) 38%),
        radial-gradient(circle at 100% 0%, #c27bff 0%, rgba(194,123,255,0) 42%),
        radial-gradient(ellipse 60% 48% at 22% 44%, #10008f 0%, #3a1fd1 45%, rgba(58,31,209,0) 100%),
        radial-gradient(ellipse 45% 40% at 85% 50%, #b9e6ff 0%, rgba(185,230,255,0) 100%),
        radial-gradient(ellipse 90% 45% at 0% 100%, #7d5cf2 0%, rgba(125,92,242,0) 100%),
        linear-gradient(180deg, #c3d8ff 0%, #d9ddff 55%, #9a83f6 100%)}
    .star{display:block}
    .star.white{width:42px;height:42px;color:#fff}
    .star.violet{width:26px;height:26px;color:#4535FF;margin-bottom:14px}
    .visual-text{margin-bottom:8px}
    .small{margin:0 0 14px;font-size:15px}
    .visual h2{margin:0;font-size:29px;line-height:1.2;font-weight:700;max-width:340px}

    /* ---------- Formulaire ---------- */
    .formside{flex:1;display:flex;align-items:center;justify-content:center;padding:24px}
    .form{width:100%;max-width:340px}
    h1{margin:0;font-size:34px;font-weight:700;color:#000;letter-spacing:-.5px}
    .subtitle{margin:14px 0 28px;font-size:13px;line-height:1.5;color:#7B7B85}
    label{display:block;font-size:15px;font-weight:500;color:#000;margin:0 0 8px}
    input{width:100%;padding:12px 16px;font:inherit;font-size:13px;color:#111;background:#fff;
      border:2px solid #D8D8DE;border-radius:12px;outline:none;box-sizing:border-box;margin-bottom:18px}
    input:focus{border-color:#4535FF;box-shadow:0 0 0 3px rgba(69,53,255,.12)}
    .pwd{position:relative}
    .pwd input{padding-right:44px}
    .eye{position:absolute;right:14px;top:13px;border:0;background:none;color:#6B6B76;cursor:pointer;padding:0;
      display:flex;width:auto}
    .submit{width:100%;margin-top:10px;padding:13px;font:inherit;font-size:13px;font-weight:600;color:#fff;
      background:#4535FF;border:0;border-radius:12px;cursor:pointer;box-shadow:0 10px 24px rgba(69,53,255,.38)}
    .submit:hover:not(:disabled){background:#3a2be6}
    .submit:disabled{opacity:.55;cursor:not-allowed;box-shadow:none}
    .note{margin:26px 0 0;text-align:center;font-size:13px;color:#7B7B85}
    .err{margin-bottom:16px;padding:11px 14px;font-size:13px;color:#BE123C;background:#FFF1F2;
      border:1px solid #FECDD3;border-radius:12px;text-align:center}

    /* ---------- Mobile ---------- */
    @media(max-width:860px){
      .page{padding:16px}
      .shell{flex-direction:column;min-height:0}
      .visual{flex:none;min-height:240px}
      .visual h2{font-size:22px}
    }
  `],
})
export class LoginComponent {
  private fb = inject(FormBuilder);
  private auth = inject(AuthService);
  private router = inject(Router);
  error = '';
  loading = false;
  showPwd = false;

  form = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    motDePasse: ['', Validators.required],
  });

  submit() {
    if (this.form.invalid) return;
    this.loading = true;
    this.error = '';
    const { email, motDePasse } = this.form.value;
    this.auth.login(email!, motDePasse!).subscribe({
      next: (res) => this.router.navigate([res.user.role === 'EMPLOYE' ? '/tickets' : '/dashboard']),
      error: (err) => {
        this.loading = false;
        this.error = err.error?.message || 'Impossible de joindre le serveur.';
      },
    });
  }
}