import { Component, ElementRef, OnDestroy, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import { catchError, forkJoin, of } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { DashboardStats, Page, TechnicianLoad, Ticket } from '../../models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="db-state" *ngIf="!stats">
      <div class="db-spinner"></div>
      <p>Chargement du tableau de bord...</p>
    </div>

    <div *ngIf="stats as s">
      <!-- En-tête -->
      <div class="db-head">
        <div>
          <h1 class="db-title">{{ s.scope === 'GLOBAL' ? 'Supervision du service informatique' : 'Mon activité' }}</h1>
          <p class="db-sub">Bonjour {{ firstName }}, voici les indicateurs de performance et la répartition des incidents.</p>
        </div>
        <span class="db-date">{{ today | date:'EEEE d MMMM y' }}</span>
      </div>

      <!-- Ligne 1 : carte principale + SLA -->
      <div class="db-top">
        <section class="db-hero">
          <div class="db-hero-left">
            <div class="db-hero-label">Total tickets</div>
            <div class="db-hero-big">{{ s.total }}</div>
            <span class="db-mom" [class.up]="momUp" *ngIf="momText">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round">
                <path *ngIf="momUp" d="m18 15-6-6-6 6"/><path *ngIf="!momUp" d="m6 9 6 6 6-6"/>
              </svg>
              {{ momText }}
            </span>
            <p class="db-hero-note">Évolution mensuelle de l'année en cours</p>
          </div>
          <div class="db-hero-right">
            <div class="db-legend">
              <span *ngFor="let l of legend"><i [style.background]="l.color"></i>{{ l.label }} : {{ l.count }} ({{ l.pct }}%)</span>
            </div>
            <div class="db-chart"><canvas #lineCanvas></canvas></div>
          </div>
        </section>

        <section class="db-card db-sand">
          <h2>Résolution et SLA</h2>
          <div class="db-kpis">
            <div class="db-kpi">
              <span class="db-kpi-ico c1"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
              <div class="k">Temps moyen</div><div class="v">{{ s.tempsMoyenResolutionHeures }} h</div>
            </div>
            <div class="db-kpi">
              <span class="db-kpi-ico c2"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg></span>
              <div class="k">SLA dépassés</div><div class="v">{{ breach }}</div>
            </div>
            <div class="db-kpi">
              <span class="db-kpi-ico c3"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg></span>
              <div class="k">SLA respecté</div><div class="v">{{ slaMet }}%</div>
            </div>
          </div>
          <div class="db-sub-title">Répartition par catégorie</div>
          <div class="db-chart small"><canvas #catCanvas></canvas></div>
        </section>
      </div>

      <!-- Ligne 2 : trois cartes -->
      <div class="db-bottom">
        <section class="db-card">
          <h2>Volume par priorité</h2>
          <div class="db-bar" *ngFor="let p of prioBars">
            <div class="top"><span><i class="dot" [style.background]="p.color"></i>{{ p.label }}</span><b>{{ p.count }}</b></div>
            <div class="track"><div class="fill" [style.width.%]="p.width" [style.background]="p.color"></div></div>
          </div>
        </section>

        <section class="db-card">
          <h2>Tickets par statut</h2>
          <div class="db-bar" *ngFor="let b of statusBars">
            <div class="top"><span><i class="dot" [style.background]="b.color"></i>{{ b.label }}</span><b>{{ b.count }}</b></div>
            <div class="track"><div class="fill" [style.width.%]="b.width" [style.background]="b.color"></div></div>
          </div>
        </section>

        <section class="db-card">
          <ng-container *ngIf="techs.length; else rate">
            <h2>Charge par technicien</h2>
            <div class="db-tech" *ngFor="let t of techs">
              <span class="db-avatar">{{ initials(t.nom) }}</span>
              <div class="db-tech-body">
                <div class="top"><b>{{ t.nom }}</b><span>{{ t.ticketsActifs }} en cours</span></div>
                <div class="track"><div class="fill" [style.width.%]="techWidth(t)"></div></div>
                <small>{{ t.ticketsResolus }} résolu(s)</small>
              </div>
            </div>
          </ng-container>

          <ng-template #rate>
            <h2>Taux de résolution</h2>
            <div class="db-ring">
              <svg viewBox="0 0 120 120">
                <circle cx="60" cy="60" r="52" class="bg"/>
                <circle cx="60" cy="60" r="52" class="fg"
                        [attr.stroke-dasharray]="326.7"
                        [attr.stroke-dashoffset]="326.7 - (326.7 * s.tauxResolutionPourcent) / 100"/>
              </svg>
              <div class="db-ring-txt"><b>{{ s.tauxResolutionPourcent }}%</b><span>résolus</span></div>
            </div>
          </ng-template>
        </section>
      </div>

      <!-- Derniers tickets -->
      <section class="db-card db-recent" *ngIf="recent.length">
        <div class="db-recent-head">
          <h2>Derniers tickets</h2>
          <a routerLink="/tickets" class="db-link">Voir tout →</a>
        </div>
        <a class="db-row" *ngFor="let t of recent" [routerLink]="['/tickets', t.id]">
          <span class="db-ref">{{ t.reference }}</span>
          <div class="db-row-main">
            <b>{{ t.titre }}</b>
            <small>{{ t.categoryNom }} · {{ t.dateCreation | date:'dd/MM/yyyy HH:mm' }}</small>
          </div>
          <span class="db-pill" [ngClass]="'p-' + t.priorite"><i></i>{{ t.priorite }}</span>
          <span class="db-pill" [ngClass]="'s-' + t.statut"><i></i>{{ t.statut.replace('_', ' ') }}</span>
        </a>
      </section>
    </div>
  `,
  styles: [`
    :host { display: block; }
    .db-top > *, .db-bottom > *, .db-hero > * { min-width: 0; }

    .db-state { padding: 80px 20px; text-align: center; color: #64748B; }
    .db-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border-radius: 50%; border: 3px solid #E0E7FF; border-top-color: #4F46E5; animation: db-spin .8s linear infinite; }
    @keyframes db-spin { to { transform: rotate(360deg); } }

    /* ── En-tête ── */
    .db-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 20px; }
    .db-title { font-size: 26px; font-weight: 700; letter-spacing: -.3px; color: #0F172A; }
    .db-sub { margin-top: 4px; font-size: 13.5px; color: #64748B; }
    .db-date { padding: 8px 14px; border-radius: 12px; background: #F1F5F9; color: #475569; font-size: 12.5px; font-weight: 600; text-transform: capitalize; }

    /* ── Grilles ── */
    .db-top { display: grid; grid-template-columns: 1.6fr 1fr; gap: 16px; margin-bottom: 16px; }
    .db-bottom { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; margin-bottom: 16px; }
    @media (max-width: 1100px) { .db-top, .db-bottom { grid-template-columns: 1fr; } }

    /* ── Carte principale ── */
    .db-hero {
      display: grid; grid-template-columns: 210px 1fr; gap: 18px; padding: 26px; border-radius: 26px; color: #fff;
      background: linear-gradient(120deg, #3730A3 0%, #0D9488 100%);
      box-shadow: 0 16px 34px rgba(55, 48, 163, .25);
    }
    @media (max-width: 800px) { .db-hero { grid-template-columns: 1fr; } }
    .db-hero-label { font-size: 15px; font-weight: 600; opacity: .95; }
    .db-hero-big { margin: 10px 0 12px; font-size: 64px; font-weight: 800; line-height: 1; letter-spacing: -2px; }
    .db-mom { display: inline-flex; align-items: center; gap: 5px; padding: 4px 11px; border-radius: 999px; background: #F43F5E; font-size: 12px; font-weight: 700; }
    .db-mom.up { background: #16A34A; }
    .db-mom svg { width: 13px; height: 13px; }
    .db-hero-note { margin-top: 14px; font-size: 12px; color: #C7D2FE; line-height: 1.5; }
    .db-legend { display: flex; flex-wrap: wrap; gap: 8px 16px; margin-bottom: 10px; font-size: 12px; }
    .db-legend span { display: inline-flex; align-items: center; }
    .db-legend i { width: 10px; height: 10px; border-radius: 50%; margin-right: 6px; }

    .db-chart { position: relative; width: 100%; height: 200px; overflow: hidden; }
    .db-chart.small { height: 150px; }
    .db-chart canvas { display: block; max-width: 100%; }

    /* ── Cartes ── */
    .db-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 22px; padding: 22px; box-shadow: 0 1px 2px rgba(15, 23, 42, .04); }
    .db-card h2 { margin-bottom: 16px; font-size: 15.5px; font-weight: 700; color: #0F172A; }
    .db-sand { background: #FEF3E2; border-color: #FBE3C0; }
    .db-sub-title { margin: 14px 0 6px; font-size: 12px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #B45309; }

    .db-kpis { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .db-kpi { padding: 12px; border-radius: 16px; background: rgba(255,255,255,.7); }
    .db-kpi .k { margin-top: 8px; font-size: 11.5px; color: #64748B; }
    .db-kpi .v { font-size: 24px; font-weight: 700; color: #0F172A; line-height: 1.2; }
    .db-kpi-ico { width: 30px; height: 30px; border-radius: 10px; display: grid; place-items: center; }
    .db-kpi-ico svg { width: 16px; height: 16px; }
    .c1 { background: #E0E7FF; color: #4F46E5; }
    .c2 { background: #FEE2E2; color: #DC2626; }
    .c3 { background: #DCFCE7; color: #16A34A; }

    /* ── Barres ── */
    .db-bar { margin-bottom: 15px; }
    .db-bar .top { display: flex; justify-content: space-between; align-items: center; margin-bottom: 6px; font-size: 13px; color: #334155; }
    .db-bar .top b { color: #0F172A; }
    .dot { display: inline-block; width: 9px; height: 9px; border-radius: 50%; margin-right: 8px; }
    .track { height: 9px; border-radius: 6px; background: #EEF2FF; overflow: hidden; }
    .fill { height: 100%; min-width: 0; border-radius: 6px; background: linear-gradient(90deg, #4F46E5, #0D9488); transition: width .5s ease; }

    /* ── Techniciens ── */
    .db-tech { display: flex; align-items: center; gap: 12px; margin-bottom: 15px; }
    .db-avatar { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; flex-shrink: 0; background: linear-gradient(135deg, #4F46E5, #0D9488); color: #fff; font-size: 12px; font-weight: 700; }
    .db-tech-body { flex: 1; min-width: 0; }
    .db-tech-body .top { display: flex; justify-content: space-between; margin-bottom: 5px; font-size: 13px; }
    .db-tech-body .top span { color: #64748B; font-size: 12px; }
    .db-tech-body small { display: block; margin-top: 4px; color: #94A3B8; font-size: 11.5px; }

    /* ── Anneau de résolution ── */
    .db-ring { position: relative; width: 150px; height: 150px; margin: 6px auto 0; }
    .db-ring svg { width: 100%; height: 100%; transform: rotate(-90deg); }
    .db-ring circle { fill: none; stroke-width: 11; }
    .db-ring .bg { stroke: #EEF2FF; }
    .db-ring .fg { stroke: #0D9488; stroke-linecap: round; transition: stroke-dashoffset .6s ease; }
    .db-ring-txt { position: absolute; inset: 0; display: flex; flex-direction: column; align-items: center; justify-content: center; }
    .db-ring-txt b { font-size: 30px; font-weight: 800; color: #0F172A; }
    .db-ring-txt span { font-size: 12px; color: #64748B; }

    /* ── Derniers tickets ── */
    .db-recent-head { display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px; }
    .db-recent-head h2 { margin: 0; }
    .db-link { font-size: 13px; font-weight: 600; color: #4F46E5; }
    .db-link:hover { text-decoration: underline; }
    .db-row { display: flex; align-items: center; gap: 14px; padding: 12px 8px; border-bottom: 1px solid #F1F5F9; border-radius: 12px; transition: background .12s; }
    .db-row:last-child { border-bottom: 0; }
    .db-row:hover { background: #F5F7FF; }
    .db-ref { padding: 4px 9px; border-radius: 8px; background: #EEF2FF; color: #3730A3; font-family: Consolas, monospace; font-size: 12px; font-weight: 700; white-space: nowrap; }
    .db-row-main { flex: 1; min-width: 0; }
    .db-row-main b { display: block; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; color: #0F172A; font-size: 13.5px; }
    .db-row-main small { color: #94A3B8; font-size: 12px; }

    .db-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: 11.5px; font-weight: 600; white-space: nowrap; }
    .db-pill i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .p-BASSE { background: #DCFCE7; color: #15803D; } .p-MOYENNE { background: #FEF3C7; color: #B45309; }
    .p-HAUTE { background: #FFEDD5; color: #C2410C; } .p-CRITIQUE { background: #FEE2E2; color: #B91C1C; }
    .s-OUVERT { background: #EEF2FF; color: #4338CA; } .s-AFFECTE { background: #E0F2FE; color: #0369A1; }
    .s-EN_COURS { background: #FEF3C7; color: #B45309; } .s-EN_ATTENTE { background: #F1F5F9; color: #475569; }
    .s-RESOLU { background: #CCFBF1; color: #0F766E; } .s-CLOTURE { background: #DCFCE7; color: #15803D; }
    .s-ANNULE { background: #FEE2E2; color: #B91C1C; }
    @media (max-width: 800px) { .db-row .db-pill:last-child { display: none; } }
  `],
})
export class DashboardComponent implements OnInit, OnDestroy {
  private api = inject(TicketService);
  private auth = inject(AuthService);
  @ViewChild('lineCanvas') lineCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('catCanvas') catCanvas?: ElementRef<HTMLCanvasElement>;

  stats?: DashboardStats;
  techs: TechnicianLoad[] = [];
  recent: Ticket[] = [];
  byMonth: number[] = Array(12).fill(0);
  breach = 0;
  slaMet = 100;
  momText = '';
  momUp = true;
  today = new Date();
  private charts: Chart[] = [];

  // Calculés une seule fois (évite de recréer des tableaux à chaque détection de changement)
  legend: { key: string; label: string; color: string; count: number; pct: number }[] = [];
  prioBars: { label: string; count: number; width: number; color: string }[] = [];
  statusBars: { label: string; count: number; width: number; color: string }[] = [];

  private legendBase = [
    { key: 'CRITIQUE', label: 'Critique', color: '#E11D48' },
    { key: 'HAUTE', label: 'Haute', color: '#F97316' },
    { key: 'MOYENNE', label: 'Moyenne', color: '#F59E0B' },
    { key: 'BASSE', label: 'Basse', color: '#22C55E' },
  ];

  get firstName() { return this.auth.currentUser()?.prenom ?? ''; }

  ngOnInit() {
    const isTech = this.auth.currentUser()?.role === 'TECHNICIEN';
    const emptyPage: Page<Ticket> = { content: [], totalElements: 0 };
    forkJoin({
      stats: this.api.getDashboardStats(),
      tickets: this.api.getAllTickets({ page: 0, size: 1000 }).pipe(catchError(() => of(emptyPage))),
      techs: isTech
        ? of([] as TechnicianLoad[])
        : this.api.getTechnicianLoad().pipe(catchError(() => of([] as TechnicianLoad[]))),
    }).subscribe((r) => {
      this.stats = r.stats;
      this.techs = r.techs;
      this.compute(r.tickets.content);
      this.buildLists(r.stats);
      setTimeout(() => this.draw(), 50); // attend que les <canvas> soient affichés
    });
  }

  ngOnDestroy() {
    this.charts.forEach((c) => c.destroy());
  }

  initials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }

  techWidth(t: TechnicianLoad) {
    const max = Math.max(1, ...this.techs.map((x) => x.ticketsActifs));
    return (t.ticketsActifs * 100) / max;
  }

  private pct(n: number, total: number) { return total ? Math.round((n * 100) / total) : 0; }
  private width(n: number, total: number) { return total ? (n * 100) / total : 0; }

  private buildLists(s: DashboardStats) {
    const count = (key: string) => s.parPriorite.find((p) => p.label === key)?.count ?? 0;
    this.legend = this.legendBase.map((l) => ({ ...l, count: count(l.key), pct: this.pct(count(l.key), s.total) }));

    const colorOf = (key: string) => this.legendBase.find((l) => l.key === key)?.color ?? '#4F46E5';
    const labelOf = (key: string) => this.legendBase.find((l) => l.key === key)?.label ?? key;
    this.prioBars = [...s.parPriorite].reverse().map((p) => ({
      label: labelOf(p.label), count: p.count, width: this.width(p.count, s.total), color: colorOf(p.label),
    }));

    this.statusBars = [
      { label: 'Ouverts', count: s.ouverts, color: '#6366F1' },
      { label: 'En cours', count: s.enCours, color: '#F59E0B' },
      { label: 'Résolus', count: s.resolus, color: '#0D9488' },
      { label: 'Clôturés', count: s.clotures, color: '#22C55E' },
    ].map((b) => ({ ...b, width: this.width(b.count, s.total) }));
  }

  private compute(tickets: Ticket[]) {
    const now = new Date();
    tickets.forEach((t) => {
      const d = new Date(t.dateCreation);
      if (d.getFullYear() === now.getFullYear()) this.byMonth[d.getMonth()]++;
    });
    const m = now.getMonth();
    if (m > 0 && this.byMonth[m - 1] > 0) {
      const p = Math.round(((this.byMonth[m] - this.byMonth[m - 1]) * 100) / this.byMonth[m - 1]);
      this.momUp = p >= 0;
      this.momText = `${Math.abs(p)}% MoM`;
    }
    this.breach = tickets.filter((t) => t.slaDepasse).length;
    this.slaMet = tickets.length ? Math.round(((tickets.length - this.breach) * 100) / tickets.length) : 100;
    this.recent = [...tickets]
      .sort((a, b) => new Date(b.dateCreation).getTime() - new Date(a.dateCreation).getTime())
      .slice(0, 5);
  }

  private draw() {
    if (!this.stats || !this.lineCanvas || !this.catCanvas) return;
    this.charts.forEach((c) => c.destroy());
    this.charts = [];
    const mois = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Juin', 'Juil', 'Août', 'Sep', 'Oct', 'Nov', 'Déc'];

    this.charts.push(new Chart(this.lineCanvas.nativeElement, {
      type: 'line',
      data: {
        labels: mois,
        datasets: [{
          data: this.byMonth, borderColor: '#fff', backgroundColor: 'rgba(255,255,255,.18)',
          borderWidth: 2.5, fill: true, tension: 0.4, pointBackgroundColor: '#fff', pointRadius: 3.5, pointHoverRadius: 6,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        plugins: {
          legend: { display: false },
          tooltip: { callbacks: { label: (c) => ` ${c.parsed.y} ticket(s)` } },
        },
        scales: {
          x: { ticks: { color: '#E0E7FF' }, grid: { display: false }, border: { display: false } },
          y: { display: false, beginAtZero: true },
        },
      },
    }));

    this.charts.push(new Chart(this.catCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.stats.parCategorie.map((c) => c.label),
        datasets: [{
          data: this.stats.parCategorie.map((c) => c.count),
          backgroundColor: ['#4F46E5', '#0D9488', '#D97706', '#0284C7', '#64748B'],
          borderColor: '#FEF3E2', borderWidth: 3,
        }],
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        animation: false,
        cutout: '62%',
        plugins: { legend: { position: 'right', labels: { boxWidth: 10, font: { size: 11 } } } },
      },
    }));
  }
}