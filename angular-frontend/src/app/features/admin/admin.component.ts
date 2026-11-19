import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { Category, Team, User, UserRole } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- En-tête -->
    <div class="ad-head">
      <div>
        <h1 class="ad-title">Administration</h1>
        <p class="ad-sub">Gérez les comptes, les équipes et les catégories de la plateforme.</p>
      </div>
      <button *ngIf="tab === 'users'" class="ad-cta" (click)="showForm = !showForm">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">
          <path *ngIf="!showForm" d="M12 5v14M5 12h14"/><path *ngIf="showForm" d="M18 6 6 18M6 6l12 12"/>
        </svg>
        {{ showForm ? 'Fermer' : 'Nouvel utilisateur' }}
      </button>
    </div>

    <div class="ad-error" *ngIf="error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
      {{ error }}
      <button class="ad-error-x" (click)="error = ''" aria-label="Fermer">×</button>
    </div>

    <!-- Cartes de synthèse -->
    <div class="ad-stats">
      <div class="ad-stat">
        <div class="ad-stat-ico i1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></div>
        <div><b>{{ users.length }}</b><span>Utilisateurs</span></div>
      </div>
      <div class="ad-stat">
        <div class="ad-stat-ico i2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></div>
        <div><b>{{ activeCount }}</b><span>Comptes actifs</span></div>
      </div>
      <div class="ad-stat">
        <div class="ad-stat-ico i3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg></div>
        <div><b>{{ techCount }}</b><span>Techniciens</span></div>
      </div>
      <div class="ad-stat">
        <div class="ad-stat-ico i4"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg></div>
        <div><b>{{ teams.length }} · {{ categories.length }}</b><span>Équipes · Catégories</span></div>
      </div>
    </div>

    <!-- Onglets -->
    <div class="ad-tabs">
      <button class="ad-tab" [class.on]="tab === 'users'" (click)="tab = 'users'">Utilisateurs <i>{{ users.length }}</i></button>
      <button class="ad-tab" [class.on]="tab === 'teams'" (click)="tab = 'teams'">Équipes <i>{{ teams.length }}</i></button>
      <button class="ad-tab" [class.on]="tab === 'cats'" (click)="tab = 'cats'">Catégories <i>{{ categories.length }}</i></button>
    </div>

    <!-- ═════════ UTILISATEURS ═════════ -->
    <ng-container *ngIf="tab === 'users'">

      <!-- Formulaire de création -->
      <form class="ad-card ad-form" *ngIf="showForm" autocomplete="off" (ngSubmit)="createUser()">
        <h2>Nouvel utilisateur</h2>
        <div class="ad-grid">
          <div class="ad-field">
            <label>Prénom</label>
            <input name="prenom" [(ngModel)]="newUser.prenom" autocomplete="off" placeholder="Ex : Salma" />
          </div>
          <div class="ad-field">
            <label>Nom</label>
            <input name="nom" [(ngModel)]="newUser.nom" autocomplete="off" placeholder="Ex : Tazi" />
          </div>
          <div class="ad-field">
            <label>Adresse e-mail</label>
            <input name="email" type="email" [(ngModel)]="newUser.email" autocomplete="off" placeholder="prenom.nom@entreprise.ma" />
          </div>
          <div class="ad-field">
            <label>Mot de passe <span class="ad-opt">(8 caractères min.)</span></label>
            <input name="pwd" type="password" [(ngModel)]="newUser.motDePasse" autocomplete="new-password" placeholder="••••••••" />
            <small class="ad-hint err" *ngIf="newUser.motDePasse && newUser.motDePasse.length < 8">Trop court : 8 caractères minimum.</small>
          </div>
          <div class="ad-field">
            <label>Rôle</label>
            <select name="role" [(ngModel)]="newUser.role">
              <option *ngFor="let r of roles" [value]="r">{{ roleLabel(r) }}</option>
            </select>
          </div>
          <div class="ad-field" *ngIf="newUser.role === 'TECHNICIEN'">
            <label>Équipe</label>
            <select name="team" [(ngModel)]="newUser.teamId">
              <option [ngValue]="null">Aucune</option>
              <option *ngFor="let t of teams" [ngValue]="t.id">{{ t.nom }}</option>
            </select>
          </div>
        </div>
        <div class="ad-actions">
          <button type="button" class="ad-ghost" (click)="showForm = false">Annuler</button>
          <button type="submit" class="ad-primary" [disabled]="!canCreate">Créer le compte</button>
        </div>
      </form>

      <!-- Recherche -->
      <div class="ad-toolbar">
        <div class="ad-search">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
          <input [(ngModel)]="search" name="search" autocomplete="off" placeholder="Rechercher un utilisateur (nom, e-mail)..." />
        </div>
        <select class="ad-filter" [(ngModel)]="roleFilter" name="roleFilter">
          <option value="">Tous les rôles</option>
          <option *ngFor="let r of allRoles" [value]="r">{{ roleLabel(r) }}</option>
        </select>
      </div>

      <!-- Tableau -->
      <div class="ad-card ad-table-card">
        <div class="ad-scroll">
          <table class="ad-table">
            <thead>
              <tr><th>Utilisateur</th><th>Rôle</th><th>Équipe</th><th>État</th><th></th></tr>
            </thead>
            <tbody>
              <tr *ngFor="let u of filteredUsers">
                <td>
                  <div class="ad-user">
                    <span class="ad-avatar" [ngClass]="'av-' + u.role">{{ initials(u) }}</span>
                    <div>
                      <b>{{ u.prenom }} {{ u.nom }}</b>
                      <small>{{ u.email }}</small>
                    </div>
                  </div>
                </td>
                <td><span class="ad-pill" [ngClass]="'r-' + u.role">{{ roleLabel(u.role) }}</span></td>
                <td>{{ u.teamNom || '—' }}</td>
                <td>
                  <span class="ad-state" [class.off]="!u.actif"><i></i>{{ u.actif ? 'Actif' : 'Désactivé' }}</span>
                </td>
                <td class="ad-right">
                  <button class="ad-small" [class.danger]="u.actif" *ngIf="u.id !== auth.currentUser()?.id" (click)="toggle(u)">
                    {{ u.actif ? 'Désactiver' : 'Activer' }}
                  </button>
                  <span class="ad-you" *ngIf="u.id === auth.currentUser()?.id">Vous</span>
                </td>
              </tr>
              <tr *ngIf="!filteredUsers.length">
                <td colspan="5" class="ad-empty">Aucun utilisateur trouvé.</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </ng-container>

    <!-- ═════════ ÉQUIPES ═════════ -->
    <div class="ad-two" *ngIf="tab === 'teams'">
      <div class="ad-card">
        <h2>Équipes existantes</h2>
        <div class="ad-item" *ngFor="let t of teams">
          <span class="ad-item-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg></span>
          <div><b>{{ t.nom }}</b><small>{{ t.description || 'Sans description' }}</small></div>
        </div>
        <p class="ad-empty" *ngIf="!teams.length">Aucune équipe.</p>
      </div>
      <form class="ad-card" autocomplete="off" (ngSubmit)="addTeam()">
        <h2>Ajouter une équipe</h2>
        <div class="ad-field"><label>Nom</label><input name="tn" [(ngModel)]="newTeam.nom" autocomplete="off" placeholder="Ex : Support Réseau" /></div>
        <div class="ad-field"><label>Description</label><textarea name="td" rows="3" [(ngModel)]="newTeam.description" placeholder="Rôle de l'équipe..."></textarea></div>
        <button type="submit" class="ad-primary" [disabled]="!newTeam.nom.trim()">Ajouter l'équipe</button>
      </form>
    </div>

    <!-- ═════════ CATÉGORIES ═════════ -->
    <div class="ad-two" *ngIf="tab === 'cats'">
      <div class="ad-card">
        <h2>Catégories existantes</h2>
        <div class="ad-item" *ngFor="let c of categories">
          <span class="ad-item-ico c"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg></span>
          <div><b>{{ c.nom }}</b><small>{{ c.description || 'Sans description' }}</small></div>
        </div>
        <p class="ad-empty" *ngIf="!categories.length">Aucune catégorie.</p>
      </div>
      <form class="ad-card" autocomplete="off" (ngSubmit)="addCategory()">
        <h2>Ajouter une catégorie</h2>
        <div class="ad-field"><label>Nom</label><input name="cn" [(ngModel)]="newCat.nom" autocomplete="off" placeholder="Ex : Messagerie" /></div>
        <div class="ad-field"><label>Description</label><textarea name="cd" rows="3" [(ngModel)]="newCat.description" placeholder="Type de demandes concernées..."></textarea></div>
        <button type="submit" class="ad-primary" [disabled]="!newCat.nom.trim()">Ajouter la catégorie</button>
      </form>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── En-tête ── */
    .ad-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
    .ad-title { font-size: 26px; font-weight: 700; letter-spacing: -.3px; color: #0F172A; }
    .ad-sub { margin-top: 4px; font-size: 13.5px; color: #64748B; }
    .ad-cta {
      display: inline-flex; align-items: center; gap: 8px; width: auto; margin: 0;
      padding: 10px 18px; border: 0; border-radius: 14px; font: inherit; font-weight: 600; font-size: 13.5px; color: #fff; cursor: pointer;
      background: linear-gradient(120deg, #4F46E5, #0D9488); box-shadow: 0 8px 18px rgba(79,70,229,.28);
      transition: transform .15s, box-shadow .15s;
    }
    .ad-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(79,70,229,.35); }
    .ad-cta svg { width: 16px; height: 16px; }

    .ad-error {
      display: flex; align-items: center; gap: 10px; padding: 12px 14px; margin-bottom: 16px;
      border-radius: 14px; background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; font-size: 13.5px;
    }
    .ad-error svg { width: 18px; height: 18px; flex-shrink: 0; }
    .ad-error-x { margin: 0 0 0 auto; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: #FECDD3; color: #BE123C; cursor: pointer; font-size: 16px; line-height: 1; }

    /* ── Cartes de synthèse ── */
    .ad-stats { display: grid; grid-template-columns: repeat(4, 1fr); gap: 14px; margin-bottom: 20px; }
    @media (max-width: 1000px) { .ad-stats { grid-template-columns: 1fr 1fr; } }
    .ad-stat { display: flex; align-items: center; gap: 14px; padding: 16px 18px; background: #fff; border: 1px solid #E2E8F0; border-radius: 18px; }
    .ad-stat b { display: block; font-size: 22px; font-weight: 700; color: #0F172A; line-height: 1.1; }
    .ad-stat span { font-size: 12px; color: #64748B; }
    .ad-stat-ico { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; }
    .ad-stat-ico svg { width: 21px; height: 21px; }
    .i1 { background: #EEF2FF; color: #4F46E5; }
    .i2 { background: #DCFCE7; color: #16A34A; }
    .i3 { background: #FEF3C7; color: #D97706; }
    .i4 { background: #CCFBF1; color: #0D9488; }

    /* ── Onglets ── */
    .ad-tabs { display: flex; gap: 6px; padding: 5px; width: fit-content; max-width: 100%; margin-bottom: 18px; background: #F1F5F9; border-radius: 14px; overflow-x: auto; }
    .ad-tab {
      display: inline-flex; align-items: center; gap: 8px; width: auto; margin: 0; padding: 8px 16px;
      border: 0; border-radius: 10px; background: transparent; color: #64748B;
      font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; white-space: nowrap;
    }
    .ad-tab i { font-style: normal; padding: 1px 8px; border-radius: 999px; background: #E2E8F0; color: #475569; font-size: 11.5px; }
    .ad-tab:hover { color: #3730A3; }
    .ad-tab.on { background: #fff; color: #3730A3; box-shadow: 0 2px 8px rgba(15,23,42,.1); }
    .ad-tab.on i { background: #EEF2FF; color: #4F46E5; }

    /* ── Cartes ── */
    .ad-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 22px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
    .ad-card h2 { font-size: 16px; font-weight: 700; color: #0F172A; margin-bottom: 16px; }
    .ad-form { margin-bottom: 18px; border-color: #C7D2FE; background: linear-gradient(180deg, #F8F9FF, #fff); }
    .ad-two { display: grid; grid-template-columns: 1.3fr 1fr; gap: 18px; align-items: start; }
    @media (max-width: 1000px) { .ad-two { grid-template-columns: 1fr; } }

    /* ── Champs ── */
    .ad-grid { display: grid; grid-template-columns: 1fr 1fr; gap: 0 16px; }
    @media (max-width: 800px) { .ad-grid { grid-template-columns: 1fr; } }
    .ad-field { margin-bottom: 16px; }
    .ad-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #1E293B; }
    .ad-opt { color: #94A3B8; font-weight: 500; }
    .ad-field input, .ad-field select, .ad-field textarea {
      width: 100%; padding: 11px 14px; border-radius: 14px; border: 1px solid #E2E8F0;
      background: #F8FAFC; font: inherit; font-size: 14px; color: #0F172A; outline: none;
      transition: border-color .15s, box-shadow .15s, background .15s;
    }
    .ad-field textarea { resize: vertical; line-height: 1.5; }
    .ad-field input::placeholder, .ad-field textarea::placeholder { color: #94A3B8; }
    .ad-field input:focus, .ad-field select:focus, .ad-field textarea:focus,
    .ad-search input:focus, .ad-filter:focus {
      background: #fff; border-color: #818CF8; box-shadow: 0 0 0 4px rgba(99,102,241,.13);
    }
    .ad-hint { display: block; margin-top: 5px; font-size: 12px; }
    .ad-hint.err { color: #E11D48; }

    /* Flèche personnalisée des listes */
    .ad-field select, .ad-filter {
      appearance: none; -webkit-appearance: none; -moz-appearance: none; cursor: pointer;
      padding-right: 40px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center; background-size: 16px;
    }

    /* ── Boutons ── */
    .ad-actions { display: flex; justify-content: flex-end; gap: 10px; padding-top: 6px; }
    .ad-primary {
      width: auto; margin: 0; padding: 11px 20px; border: 0; border-radius: 14px; font: inherit; font-size: 13.5px; font-weight: 600; color: #fff; cursor: pointer;
      background: linear-gradient(120deg, #4F46E5, #0D9488); box-shadow: 0 8px 18px rgba(79,70,229,.25); transition: transform .15s;
    }
    .ad-primary:hover:not(:disabled) { transform: translateY(-1px); }
    .ad-primary:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }
    .ad-ghost { width: auto; margin: 0; padding: 11px 18px; border: 0; border-radius: 14px; background: #F1F5F9; color: #475569; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; }
    .ad-ghost:hover { background: #E2E8F0; }

    /* ── Recherche ── */
    .ad-toolbar { display: flex; gap: 10px; flex-wrap: wrap; margin-bottom: 14px; }
    .ad-search { position: relative; flex: 1; min-width: 240px; max-width: 420px; }
    .ad-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 17px; height: 17px; color: #94A3B8; pointer-events: none; }
    .ad-search input {
      width: 100%; padding: 10px 14px 10px 40px; border-radius: 14px; border: 1px solid #E2E8F0;
      background: #F8FAFC; font: inherit; font-size: 13.5px; outline: none; transition: all .15s;
    }
    .ad-filter { width: auto; min-width: 170px; padding-top: 10px; padding-bottom: 10px; padding-left: 14px; border-radius: 14px; border: 1px solid #E2E8F0; background-color: #F8FAFC; font: inherit; font-size: 13.5px; color: #334155; outline: none; }

    /* ── Tableau ── */
    .ad-table-card { padding: 0; overflow: hidden; }
    .ad-scroll { overflow-x: auto; }
    .ad-table { width: 100%; min-width: 760px; border-collapse: collapse; }
    .ad-table th { text-align: left; padding: 14px 18px; background: #F8FAFC; border-bottom: 1px solid #E2E8F0; font-size: 11.5px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #64748B; }
    .ad-table td { padding: 14px 18px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; font-size: 13.5px; color: #334155; }
    .ad-table tbody tr:last-child td { border-bottom: 0; }
    .ad-table tbody tr:hover { background: #F8FAFF; }
    .ad-right { text-align: right; }
    .ad-empty { padding: 28px; text-align: center; color: #94A3B8; font-size: 13.5px; }

    .ad-user { display: flex; align-items: center; gap: 12px; }
    .ad-user b { display: block; color: #0F172A; font-weight: 600; }
    .ad-user small { color: #94A3B8; font-size: 12px; }
    .ad-avatar { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 12.5px; font-weight: 700; flex-shrink: 0; }
    .av-ADMIN { background: linear-gradient(135deg, #E11D48, #F97316); }
    .av-IT_MANAGER { background: linear-gradient(135deg, #7C3AED, #4F46E5); }
    .av-TECHNICIEN { background: linear-gradient(135deg, #0D9488, #0284C7); }
    .av-EMPLOYE { background: linear-gradient(135deg, #64748B, #94A3B8); }

    .ad-pill { display: inline-block; padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .r-ADMIN { background: #FFE4E6; color: #BE123C; }
    .r-IT_MANAGER { background: #EDE9FE; color: #6D28D9; }
    .r-TECHNICIEN { background: #CCFBF1; color: #0F766E; }
    .r-EMPLOYE { background: #F1F5F9; color: #475569; }

    .ad-state { display: inline-flex; align-items: center; gap: 7px; font-size: 12.5px; font-weight: 600; color: #15803D; }
    .ad-state i { width: 8px; height: 8px; border-radius: 50%; background: #22C55E; box-shadow: 0 0 0 3px rgba(34,197,94,.2); }
    .ad-state.off { color: #B91C1C; }
    .ad-state.off i { background: #EF4444; box-shadow: 0 0 0 3px rgba(239,68,68,.2); }

    .ad-small { width: auto; margin: 0; padding: 7px 14px; border: 0; border-radius: 10px; background: #EEF2FF; color: #4338CA; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .ad-small:hover { background: #E0E7FF; }
    .ad-small.danger { background: #FEE2E2; color: #B91C1C; }
    .ad-small.danger:hover { background: #FECACA; }
    .ad-you { font-size: 12px; font-weight: 600; color: #94A3B8; }

    /* ── Listes équipes / catégories ── */
    .ad-item { display: flex; align-items: center; gap: 14px; padding: 12px 14px; margin-bottom: 10px; border: 1px solid #F1F5F9; border-radius: 14px; background: #F8FAFC; transition: all .15s; }
    .ad-item:hover { border-color: #C7D2FE; background: #F5F7FF; }
    .ad-item b { display: block; color: #0F172A; font-size: 14px; }
    .ad-item small { color: #64748B; font-size: 12.5px; }
    .ad-item-ico { width: 40px; height: 40px; border-radius: 12px; display: grid; place-items: center; background: #EEF2FF; color: #4F46E5; flex-shrink: 0; }
    .ad-item-ico.c { background: #CCFBF1; color: #0D9488; }
    .ad-item-ico svg { width: 19px; height: 19px; }
  `],
})
export class AdminComponent implements OnInit {
  private api = inject(TicketService);
  auth = inject(AuthService);

  users: User[] = [];
  teams: Team[] = [];
  categories: Category[] = [];
  error = '';

  tab: 'users' | 'teams' | 'cats' = 'users';
  showForm = false;
  search = '';
  roleFilter = '';

  newUser = { nom: '', prenom: '', email: '', motDePasse: '', role: 'EMPLOYE' as UserRole, teamId: null as number | null };
  newTeam = { nom: '', description: '' };
  newCat = { nom: '', description: '' };

  allRoles: UserRole[] = ['EMPLOYE', 'TECHNICIEN', 'IT_MANAGER', 'ADMIN'];

  private labels: Record<string, string> = {
    EMPLOYE: 'Employé', TECHNICIEN: 'Technicien', IT_MANAGER: 'Responsable IT', ADMIN: 'Administrateur',
  };

  get roles(): UserRole[] {
    return this.auth.currentUser()?.role === 'ADMIN' ? this.allRoles : ['EMPLOYE', 'TECHNICIEN'];
  }
  get activeCount() { return this.users.filter((u) => u.actif).length; }
  get techCount() { return this.users.filter((u) => u.role === 'TECHNICIEN').length; }
  get canCreate() {
    const u = this.newUser;
    return !!(u.nom.trim() && u.prenom.trim() && u.email.trim() && u.motDePasse.length >= 8);
  }
  get filteredUsers() {
    const q = this.search.trim().toLowerCase();
    return this.users.filter(
      (u) =>
        (!this.roleFilter || u.role === this.roleFilter) &&
        (!q || `${u.prenom} ${u.nom} ${u.email}`.toLowerCase().includes(q))
    );
  }

  roleLabel(r: string) { return this.labels[r] ?? r; }
  initials(u: User) { return ((u.prenom?.[0] ?? '') + (u.nom?.[0] ?? '')).toUpperCase(); }

  private fail = (e: any) => (this.error = e.error?.message || 'Opération impossible.');

  ngOnInit() { this.loadAll(); }

  loadAll() {
    this.api.getUsers().subscribe((u) => (this.users = u));
    this.api.getTeams().subscribe((t) => (this.teams = t));
    this.api.getCategories().subscribe((c) => (this.categories = c));
  }

  createUser() {
    if (!this.canCreate) return;
    this.error = '';
    const body = { ...this.newUser, teamId: this.newUser.role === 'TECHNICIEN' ? this.newUser.teamId : null };
    this.api.createUser(body).subscribe({
      next: () => {
        this.newUser = { nom: '', prenom: '', email: '', motDePasse: '', role: 'EMPLOYE', teamId: null };
        this.showForm = false;
        this.loadAll();
      },
      error: this.fail,
    });
  }

  toggle(u: User) {
    this.error = '';
    this.api.toggleUser(u.id).subscribe({ next: () => this.loadAll(), error: this.fail });
  }

  addTeam() {
    if (!this.newTeam.nom.trim()) return;
    this.error = '';
    this.api.createTeam(this.newTeam).subscribe({
      next: () => { this.newTeam = { nom: '', description: '' }; this.loadAll(); },
      error: this.fail,
    });
  }

  addCategory() {
    if (!this.newCat.nom.trim()) return;
    this.error = '';
    this.api.createCategory(this.newCat).subscribe({
      next: () => { this.newCat = { nom: '', description: '' }; this.loadAll(); },
      error: this.fail,
    });
  }
}