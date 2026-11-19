import { Component, DestroyRef, OnInit, inject } from '@angular/core';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { Subject, debounceTime, distinctUntilChanged } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { Ticket } from '../../models/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <!-- En-tête -->
    <div class="tl-head">
      <div>
        <h1 class="tl-title">{{ isEmployee ? 'Mes tickets' : 'Gestion des tickets' }}</h1>
        <p class="tl-sub">
          {{ isEmployee ? 'Suivez l’avancement de vos demandes.' : 'Consultez, filtrez et suivez tous les incidents du service.' }}
        </p>
      </div>
      <a *ngIf="role !== 'TECHNICIEN'" routerLink="/tickets/new" class="tl-cta">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 5v14"/><path d="M5 12h14"/></svg>
        Nouveau ticket
      </a>
    </div>

    <!-- Onglets de statut -->
    <div class="tl-tabs" *ngIf="!isEmployee">
      <button *ngFor="let t of tabs" class="tl-tab" [class.on]="statut === t.value" (click)="setStatut(t.value)">
        {{ t.label }}
      </button>
    </div>

    <!-- Barre d'outils -->
    <div class="tl-toolbar" *ngIf="!isEmployee">
      <div class="tl-search">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>
        <input [(ngModel)]="search" (ngModelChange)="search$.next($event)" placeholder="Rechercher par titre ou référence..." />
        <button *ngIf="search" class="tl-clear" (click)="clearSearch()" aria-label="Effacer">×</button>
      </div>

      <select class="tl-select" [(ngModel)]="priorite" (ngModelChange)="load(true)">
        <option value="">Toutes les priorités</option>
        <option *ngFor="let p of priorites" [value]="p.value">{{ p.label }}</option>
      </select>

      <select class="tl-select" [(ngModel)]="sort" (ngModelChange)="load(true)">
        <option value="dateCreation,desc">Plus récents d’abord</option>
        <option value="dateCreation,asc">Plus anciens d’abord</option>
      </select>

      <button *ngIf="hasFilters" class="tl-reset" (click)="resetFilters()">Réinitialiser</button>
    </div>

    <!-- Tableau -->
    <div class="tl-card">
      <div class="tl-scroll">
        <table class="tl-table">
          <thead>
            <tr>
              <th>Référence</th>
              <th>Ticket</th>
              <th>Priorité</th>
              <th>Statut</th>
              <th>Technicien</th>
              <th>Créé le</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            <tr *ngFor="let t of tickets" [routerLink]="['/tickets', t.id]" class="tl-row">
              <td><span class="tl-ref">{{ t.reference }}</span></td>

              <td class="tl-main">
                <div class="tl-name">
                  {{ t.titre }}
                  <span class="tl-sla" *ngIf="t.slaDepasse">SLA dépassé</span>
                </div>
                <div class="tl-cat">{{ t.categoryNom }}</div>
              </td>

              <td>
                <span class="tl-pill" [ngClass]="'p-' + t.priorite">
                  <i></i>{{ prioLabel(t.priorite) }}
                </span>
              </td>

              <td>
                <span class="tl-pill" [ngClass]="'s-' + t.statut">
                  <i></i>{{ statutLabel(t.statut) }}
                </span>
              </td>

              <td>
                <div class="tl-tech" *ngIf="t.technicienNom; else none">
                  <span class="tl-avatar">{{ initials(t.technicienNom) }}</span>
                  <span>{{ t.technicienNom }}</span>
                </div>
                <ng-template #none><span class="tl-unassigned">Non affecté</span></ng-template>
              </td>

              <td class="tl-date">{{ t.dateCreation | date:'dd/MM/yyyy' }}</td>

              <td class="tl-go">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Chargement -->
      <div class="tl-state" *ngIf="loading && !tickets.length">
        <div class="tl-spinner"></div>
        <p>Chargement des tickets...</p>
      </div>

      <!-- État vide -->
      <div class="tl-state" *ngIf="!loading && !tickets.length">
        <div class="tl-empty-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
            <path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>
          </svg>
        </div>
        <h3>Aucun ticket trouvé</h3>
        <p>{{ hasFilters ? 'Essayez de modifier ou de réinitialiser vos filtres.' : 'Aucun ticket n’a encore été créé.' }}</p>
        <button *ngIf="hasFilters" class="tl-reset" (click)="resetFilters()">Réinitialiser les filtres</button>
      </div>
    </div>

    <!-- Pagination -->
    <div class="tl-pager" *ngIf="total > 0">
      <span class="tl-count">{{ from }}–{{ to }} sur {{ total }} ticket(s)</span>
      <div class="tl-pages">
        <button class="tl-pbtn" [disabled]="page === 0" (click)="go(page - 1)" aria-label="Précédent">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </button>
        <span class="tl-pinfo">Page {{ page + 1 }} / {{ pages }}</span>
        <button class="tl-pbtn" [disabled]="page + 1 >= pages" (click)="go(page + 1)" aria-label="Suivant">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m9 18 6-6-6-6"/></svg>
        </button>
      </div>
    </div>
  `,
  styles: [`
    :host { display: block; }

    /* ── En-tête ── */
    .tl-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; margin-bottom: 18px; flex-wrap: wrap; }
    .tl-title { font-size: 26px; font-weight: 700; letter-spacing: -.3px; color: #0F172A; }
    .tl-sub { margin-top: 4px; font-size: 13.5px; color: #64748B; }
    .tl-cta {
      display: inline-flex; align-items: center; gap: 8px;
      padding: 10px 18px; border-radius: 14px; font-weight: 600; font-size: 13.5px;
      color: #fff; background: linear-gradient(120deg, #4F46E5, #0D9488);
      box-shadow: 0 8px 18px rgba(79, 70, 229, .28);
      transition: transform .15s, box-shadow .15s;
    }
    .tl-cta:hover { transform: translateY(-1px); box-shadow: 0 10px 22px rgba(79, 70, 229, .35); }
    .tl-cta svg { width: 16px; height: 16px; }

    /* ── Onglets ── */
    .tl-tabs { display: flex; gap: 6px; flex-wrap: wrap; margin-bottom: 14px; }
    .tl-tab {
      width: auto; margin: 0; padding: 7px 14px; border-radius: 999px;
      border: 1px solid #E2E8F0; background: #fff; color: #475569;
      font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
      transition: all .15s;
    }
    .tl-tab:hover { border-color: #C7D2FE; color: #3730A3; background: #F5F7FF; }
    .tl-tab.on { background: #4F46E5; border-color: #4F46E5; color: #fff; box-shadow: 0 4px 12px rgba(79, 70, 229, .3); }

    /* ── Barre d'outils ── */
    .tl-toolbar { display: flex; gap: 10px; align-items: center; flex-wrap: wrap; margin-bottom: 16px; }
    .tl-search { position: relative; flex: 1; min-width: 240px; max-width: 420px; }
    .tl-search svg { position: absolute; left: 13px; top: 50%; transform: translateY(-50%); width: 17px; height: 17px; color: #94A3B8; pointer-events: none; }
    .tl-search input {
      width: 100%; padding: 10px 34px 10px 40px; border-radius: 14px;
      border: 1px solid #E2E8F0; background: #F8FAFC; font-size: 13.5px; outline: none;
      transition: border-color .15s, box-shadow .15s, background .15s;
    }
    .tl-search input:focus { background: #fff; border-color: #818CF8; box-shadow: 0 0 0 4px rgba(99, 102, 241, .12); }
    .tl-clear {
      position: absolute; right: 8px; top: 50%; transform: translateY(-50%);
      width: 22px; height: 22px; padding: 0; margin: 0; border: 0; border-radius: 50%;
      background: #E2E8F0; color: #475569; font-size: 15px; line-height: 1; cursor: pointer;
    }
    .tl-select {
      width: auto; min-width: 170px; padding: 10px 14px; border-radius: 14px;
      border: 1px solid #E2E8F0; background: #F8FAFC; font-size: 13.5px; color: #334155;
      cursor: pointer; outline: none;
    }
    .tl-select:focus { border-color: #818CF8; box-shadow: 0 0 0 4px rgba(99, 102, 241, .12); background: #fff; }
    .tl-reset {
      width: auto; margin: 0; padding: 9px 14px; border-radius: 12px; border: 0;
      background: #EEF2FF; color: #4338CA; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer;
    }
    .tl-reset:hover { background: #E0E7FF; }

    /* ── Carte et tableau ── */
    .tl-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); overflow: hidden; }
    .tl-scroll { overflow-x: auto; }
    .tl-table { width: 100%; border-collapse: collapse; min-width: 860px; }
    .tl-table th {
      text-align: left; padding: 14px 16px; background: #F8FAFC;
      font-size: 11.5px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; color: #64748B;
      border-bottom: 1px solid #E2E8F0;
    }
    .tl-table td { padding: 14px 16px; border-bottom: 1px solid #F1F5F9; vertical-align: middle; font-size: 13.5px; }
    .tl-table tbody tr:last-child td { border-bottom: 0; }
    .tl-row { cursor: pointer; transition: background .12s; }
    .tl-row:hover { background: #F5F7FF; }
    .tl-row:hover .tl-go svg { transform: translateX(3px); color: #4F46E5; }

    .tl-ref {
      display: inline-block; padding: 4px 9px; border-radius: 8px;
      background: #EEF2FF; color: #3730A3; font-family: Consolas, monospace; font-size: 12px; font-weight: 700;
    }
    .tl-main { max-width: 340px; }
    .tl-name { font-weight: 600; color: #0F172A; display: flex; align-items: center; gap: 8px; flex-wrap: wrap; }
    .tl-cat { margin-top: 2px; font-size: 12px; color: #94A3B8; }
    .tl-sla { padding: 2px 8px; border-radius: 999px; background: #FEE2E2; color: #B91C1C; font-size: 10.5px; font-weight: 700; }

    /* ── Pastilles priorité / statut ── */
    .tl-pill {
      display: inline-flex; align-items: center; gap: 6px;
      padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap;
    }
    .tl-pill i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .p-BASSE    { background: #DCFCE7; color: #15803D; }
    .p-MOYENNE  { background: #FEF3C7; color: #B45309; }
    .p-HAUTE    { background: #FFEDD5; color: #C2410C; }
    .p-CRITIQUE { background: #FEE2E2; color: #B91C1C; }
    .s-OUVERT     { background: #EEF2FF; color: #4338CA; }
    .s-AFFECTE    { background: #E0F2FE; color: #0369A1; }
    .s-EN_COURS   { background: #FEF3C7; color: #B45309; }
    .s-EN_ATTENTE { background: #F1F5F9; color: #475569; }
    .s-RESOLU     { background: #CCFBF1; color: #0F766E; }
    .s-CLOTURE    { background: #DCFCE7; color: #15803D; }
    .s-ANNULE     { background: #FEE2E2; color: #B91C1C; }

    /* ── Technicien ── */
    .tl-tech { display: flex; align-items: center; gap: 9px; font-weight: 500; color: #334155; }
    .tl-avatar {
      width: 30px; height: 30px; border-radius: 50%; display: grid; place-items: center;
      background: linear-gradient(135deg, #4F46E5, #0D9488); color: #fff; font-size: 11px; font-weight: 700;
    }
    .tl-unassigned { color: #94A3B8; font-style: italic; font-size: 12.5px; }
    .tl-date { color: #64748B; white-space: nowrap; }
    .tl-go { width: 40px; text-align: right; }
    .tl-go svg { width: 18px; height: 18px; color: #CBD5E1; transition: transform .15s, color .15s; }

    /* ── États vide et chargement ── */
    .tl-state { padding: 54px 20px; text-align: center; color: #64748B; }
    .tl-state h3 { margin-top: 14px; font-size: 16px; color: #0F172A; }
    .tl-state p { margin-top: 4px; font-size: 13.5px; }
    .tl-state .tl-reset { margin-top: 14px; }
    .tl-empty-ico {
      width: 64px; height: 64px; margin: 0 auto; border-radius: 20px;
      display: grid; place-items: center; background: #EEF2FF; color: #6366F1;
    }
    .tl-empty-ico svg { width: 30px; height: 30px; }
    .tl-spinner {
      width: 30px; height: 30px; margin: 0 auto 10px; border-radius: 50%;
      border: 3px solid #E0E7FF; border-top-color: #4F46E5; animation: tl-spin .8s linear infinite;
    }
    @keyframes tl-spin { to { transform: rotate(360deg); } }

    /* ── Pagination ── */
    .tl-pager { display: flex; justify-content: space-between; align-items: center; gap: 12px; margin-top: 16px; flex-wrap: wrap; }
    .tl-count { font-size: 13px; color: #64748B; }
    .tl-pages { display: flex; align-items: center; gap: 10px; }
    .tl-pinfo { font-size: 13px; font-weight: 600; color: #334155; }
    .tl-pbtn {
      width: 36px; height: 36px; margin: 0; padding: 0; border-radius: 12px;
      border: 1px solid #E2E8F0; background: #fff; color: #334155;
      display: grid; place-items: center; cursor: pointer; transition: all .15s;
    }
    .tl-pbtn svg { width: 16px; height: 16px; }
    .tl-pbtn:hover:not(:disabled) { background: #4F46E5; border-color: #4F46E5; color: #fff; }
    .tl-pbtn:disabled { opacity: .4; cursor: not-allowed; }
  `],
})
export class TicketListComponent implements OnInit {
  private auth = inject(AuthService);
  private api = inject(TicketService);
  private destroyRef = inject(DestroyRef);

  search$ = new Subject<string>();

  tickets: Ticket[] = [];
  total = 0;
  page = 0;
  size = 10;
  loading = false;

  search = '';
  statut = '';
  priorite = '';
  sort = 'dateCreation,desc';

  tabs = [
    { value: '', label: 'Tous' },
    { value: 'OUVERT', label: 'Ouverts' },
    { value: 'AFFECTE', label: 'Affectés' },
    { value: 'EN_COURS', label: 'En cours' },
    { value: 'EN_ATTENTE', label: 'En attente' },
    { value: 'RESOLU', label: 'Résolus' },
    { value: 'CLOTURE', label: 'Clôturés' },
    { value: 'ANNULE', label: 'Annulés' },
  ];
  priorites = [
    { value: 'CRITIQUE', label: 'Critique' },
    { value: 'HAUTE', label: 'Haute' },
    { value: 'MOYENNE', label: 'Moyenne' },
    { value: 'BASSE', label: 'Basse' },
  ];

  private statutLabels: Record<string, string> = {
    OUVERT: 'Ouvert', AFFECTE: 'Affecté', EN_COURS: 'En cours', EN_ATTENTE: 'En attente',
    RESOLU: 'Résolu', CLOTURE: 'Clôturé', ANNULE: 'Annulé',
  };
  private prioLabels: Record<string, string> = {
    BASSE: 'Basse', MOYENNE: 'Moyenne', HAUTE: 'Haute', CRITIQUE: 'Critique',
  };

  get role() { return this.auth.currentUser()?.role; }
  get isEmployee() { return this.role === 'EMPLOYE'; }
  get pages() { return Math.max(1, Math.ceil(this.total / this.size)); }
  get from() { return this.total ? this.page * this.size + 1 : 0; }
  get to() { return Math.min((this.page + 1) * this.size, this.total); }
  get hasFilters() { return !!(this.search.trim() || this.statut || this.priorite); }

  statutLabel(s: string) { return this.statutLabels[s] ?? s; }
  prioLabel(p: string) { return this.prioLabels[p] ?? p; }
  initials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  ngOnInit() {
    this.search$
      .pipe(debounceTime(300), distinctUntilChanged(), takeUntilDestroyed(this.destroyRef))
      .subscribe(() => this.load(true));
    this.load();
  }

  setStatut(v: string) { this.statut = v; this.load(true); }
  clearSearch() { this.search = ''; this.search$.next(''); }
  resetFilters() {
    this.search = ''; this.statut = ''; this.priorite = ''; this.sort = 'dateCreation,desc';
    this.load(true);
  }
  go(p: number) { this.page = p; this.load(); }

  load(reset = false) {
    if (reset) this.page = 0;
    this.loading = true;
    const obs = this.isEmployee
      ? this.api.getMyTickets(this.page, this.size)
      : this.api.getAllTickets({
          q: this.search, statut: this.statut, priorite: this.priorite,
          page: this.page, size: this.size, sort: this.sort,
        });
    obs.subscribe({
      next: (res) => { this.tickets = res.content; this.total = res.totalElements; this.loading = false; },
      error: () => { this.tickets = []; this.total = 0; this.loading = false; },
    });
  }
}