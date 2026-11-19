import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import { NotificationItem } from '../../models/models';

interface Group { label: string; items: NotificationItem[]; }

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <!-- En-tête -->
    <div class="nt-head">
      <div>
        <h1 class="nt-title">Centre de notifications</h1>
        <p class="nt-sub">
          {{ unreadCount ? unreadCount + ' notification(s) non lue(s)' : 'Vous êtes à jour, rien de nouveau.' }}
        </p>
      </div>
      <button class="nt-readall" (click)="readAll()" [disabled]="!unreadCount">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 7 17l-5-5"/><path d="m22 10-7.5 7.5L13 16"/></svg>
        Tout marquer comme lu
      </button>
    </div>

    <!-- Onglets -->
    <div class="nt-tabs">
      <button class="nt-tab" [class.on]="filter === 'all'" (click)="filter = 'all'">
        Toutes <i>{{ items.length }}</i>
      </button>
      <button class="nt-tab" [class.on]="filter === 'unread'" (click)="filter = 'unread'">
        Non lues <i [class.hot]="unreadCount > 0">{{ unreadCount }}</i>
      </button>
    </div>

    <!-- Chargement -->
    <div class="nt-state" *ngIf="loading">
      <div class="nt-spinner"></div>
      <p>Chargement...</p>
    </div>

    <!-- Liste groupée par jour -->
    <ng-container *ngIf="!loading">
      <section class="nt-group" *ngFor="let g of groups">
        <h2 class="nt-day">{{ g.label }}</h2>

        <article class="nt-item" *ngFor="let n of g.items" [class.unread]="!n.lue" (click)="open(n)">
          <div class="nt-ico" [ngClass]="'k-' + kind(n.message)">
            <ng-container [ngSwitch]="kind(n.message)">
              <svg *ngSwitchCase="'alert'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3"/><path d="M12 9v4"/><path d="M12 17h.01"/></svg>
              <svg *ngSwitchCase="'assign'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="m16 11 2 2 4-4"/></svg>
              <svg *ngSwitchCase="'comment'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
              <svg *ngSwitchCase="'done'" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
              <svg *ngSwitchDefault viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/><path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/></svg>
            </ng-container>
          </div>

          <div class="nt-body">
            <p class="nt-msg">{{ n.message }}</p>
            <div class="nt-meta">
              <span class="nt-ref" *ngIf="n.ticketReference">{{ n.ticketReference }}</span>
              <span>{{ n.date | date:'HH:mm' }}</span>
            </div>
          </div>

          <span class="nt-dot" *ngIf="!n.lue" title="Non lue"></span>
          <button class="nt-check" *ngIf="!n.lue" (click)="markRead(n, $event)" aria-label="Marquer comme lue" title="Marquer comme lue">
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"><path d="M20 6 9 17l-5-5"/></svg>
          </button>
        </article>
      </section>

      <!-- État vide -->
      <div class="nt-state" *ngIf="!groups.length">
        <div class="nt-empty-ico">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>
        </div>
        <h3>{{ filter === 'unread' ? 'Aucune notification non lue' : 'Aucune notification' }}</h3>
        <p>{{ filter === 'unread' ? 'Tout a été lu, bravo.' : 'Les alertes sur vos tickets apparaîtront ici.' }}</p>
      </div>
    </ng-container>
  `,
  styles: [`
    :host { display: block; }

    /* ── En-tête ── */
    .nt-head { display: flex; justify-content: space-between; align-items: flex-end; gap: 16px; flex-wrap: wrap; margin-bottom: 18px; }
    .nt-title { font-size: 26px; font-weight: 700; letter-spacing: -.3px; color: #0F172A; }
    .nt-sub { margin-top: 4px; font-size: 13.5px; color: #64748B; }
    .nt-readall {
      display: inline-flex; align-items: center; gap: 8px; width: auto; margin: 0;
      padding: 10px 16px; border: 0; border-radius: 14px; background: #EEF2FF; color: #4338CA;
      font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s;
    }
    .nt-readall svg { width: 17px; height: 17px; }
    .nt-readall:hover:not(:disabled) { background: #4F46E5; color: #fff; box-shadow: 0 8px 18px rgba(79,70,229,.28); }
    .nt-readall:disabled { opacity: .45; cursor: not-allowed; }

    /* ── Onglets ── */
    .nt-tabs { display: flex; gap: 6px; padding: 5px; width: fit-content; margin-bottom: 20px; background: #F1F5F9; border-radius: 14px; }
    .nt-tab {
      display: inline-flex; align-items: center; gap: 8px; width: auto; margin: 0; padding: 8px 16px;
      border: 0; border-radius: 10px; background: transparent; color: #64748B;
      font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s;
    }
    .nt-tab i { font-style: normal; padding: 1px 8px; border-radius: 999px; background: #E2E8F0; color: #475569; font-size: 11.5px; }
    .nt-tab i.hot { background: #F43F5E; color: #fff; }
    .nt-tab:hover { color: #3730A3; }
    .nt-tab.on { background: #fff; color: #3730A3; box-shadow: 0 2px 8px rgba(15,23,42,.1); }

    /* ── Groupes par jour ── */
    .nt-group { margin-bottom: 22px; }
    .nt-day { margin-bottom: 10px; font-size: 11.5px; font-weight: 700; letter-spacing: .7px; text-transform: uppercase; color: #94A3B8; }

    /* ── Carte de notification ── */
    .nt-item {
      position: relative; display: flex; align-items: center; gap: 14px;
      padding: 14px 16px; margin-bottom: 10px; border: 1px solid #E2E8F0; border-radius: 16px;
      background: #fff; cursor: pointer; transition: all .15s;
    }
    .nt-item:hover { border-color: #C7D2FE; transform: translateY(-1px); box-shadow: 0 8px 20px rgba(15,23,42,.06); }
    .nt-item.unread { background: linear-gradient(90deg, #F5F7FF, #fff 70%); border-color: #C7D2FE; }
    .nt-item.unread::before {
      content: ''; position: absolute; left: 0; top: 14px; bottom: 14px; width: 4px; border-radius: 0 4px 4px 0;
      background: linear-gradient(180deg, #4F46E5, #0D9488);
    }

    .nt-ico { width: 44px; height: 44px; border-radius: 14px; display: grid; place-items: center; flex-shrink: 0; }
    .nt-ico svg { width: 21px; height: 21px; }
    .k-ticket  { background: #EEF2FF; color: #4F46E5; }
    .k-alert   { background: #FEE2E2; color: #DC2626; }
    .k-assign  { background: #E0F2FE; color: #0284C7; }
    .k-comment { background: #FEF3C7; color: #D97706; }
    .k-done    { background: #DCFCE7; color: #16A34A; }

    .nt-body { flex: 1; min-width: 0; }
    .nt-msg { font-size: 14px; line-height: 1.45; color: #1E293B; }
    .nt-item:not(.unread) .nt-msg { color: #64748B; }
    .nt-item.unread .nt-msg { font-weight: 600; color: #0F172A; }
    .nt-meta { display: flex; align-items: center; gap: 10px; margin-top: 5px; font-size: 12px; color: #94A3B8; }
    .nt-ref { padding: 2px 8px; border-radius: 7px; background: #EEF2FF; color: #3730A3; font-family: Consolas, monospace; font-size: 11.5px; font-weight: 700; }

    .nt-dot { width: 9px; height: 9px; border-radius: 50%; background: #4F46E5; box-shadow: 0 0 0 4px rgba(79,70,229,.15); flex-shrink: 0; }
    .nt-check {
      width: 34px; height: 34px; margin: 0; padding: 0; border: 0; border-radius: 10px; flex-shrink: 0;
      display: grid; place-items: center; background: #F1F5F9; color: #64748B; cursor: pointer;
      opacity: 0; transition: all .15s;
    }
    .nt-check svg { width: 16px; height: 16px; }
    .nt-item:hover .nt-check { opacity: 1; }
    .nt-check:hover { background: #16A34A; color: #fff; }
    @media (hover: none) { .nt-check { opacity: 1; } }

    /* ── États ── */
    .nt-state { padding: 60px 20px; text-align: center; color: #64748B; }
    .nt-state h3 { margin-top: 14px; font-size: 16px; color: #0F172A; }
    .nt-state p { margin-top: 4px; font-size: 13.5px; }
    .nt-empty-ico { width: 68px; height: 68px; margin: 0 auto; border-radius: 22px; display: grid; place-items: center; background: #EEF2FF; color: #6366F1; }
    .nt-empty-ico svg { width: 32px; height: 32px; }
    .nt-spinner { width: 30px; height: 30px; margin: 0 auto 10px; border-radius: 50%; border: 3px solid #E0E7FF; border-top-color: #4F46E5; animation: nt-spin .8s linear infinite; }
    @keyframes nt-spin { to { transform: rotate(360deg); } }
  `],
})
export class NotificationsComponent implements OnInit {
  private api = inject(TicketService);
  private router = inject(Router);

  items: NotificationItem[] = [];
  filter: 'all' | 'unread' = 'all';
  loading = true;

  get unreadCount() { return this.items.filter((n) => !n.lue).length; }

  /** Notifications filtrées puis regroupées par jour. */
  get groups(): Group[] {
    const list = this.filter === 'unread' ? this.items.filter((n) => !n.lue) : this.items;
    const map = new Map<string, Group>();
    for (const n of list) {
      const label = this.dayLabel(new Date(n.date));
      if (!map.has(label)) map.set(label, { label, items: [] });
      map.get(label)!.items.push(n);
    }
    return Array.from(map.values());
  }

  ngOnInit() { this.load(); }

  load() {
    this.api.getNotifications().subscribe({
      next: (r) => { this.items = r; this.loading = false; },
      error: () => { this.items = []; this.loading = false; },
    });
  }

  markRead(n: NotificationItem, e: Event) {
    e.stopPropagation();
    this.api.markNotificationRead(n.id).subscribe(() => (n.lue = true));
  }

  readAll() {
    this.api.markAllRead().subscribe(() => this.items.forEach((n) => (n.lue = true)));
  }

  open(n: NotificationItem) {
    if (!n.lue) this.api.markNotificationRead(n.id).subscribe(() => (n.lue = true));
    if (n.ticketId) this.router.navigate(['/tickets', n.ticketId]);
  }

  /** Choisit l'icône selon le contenu du message. */
  kind(msg: string): 'alert' | 'assign' | 'comment' | 'done' | 'ticket' {
    const m = msg.toLowerCase();
    if (m.includes('sla') || m.includes('critique')) return 'alert';
    if (m.includes('affect') || m.includes('pris en charge')) return 'assign';
    if (m.includes('commentaire')) return 'comment';
    if (m.includes('résolu') || m.includes('resolu') || m.includes('clotur') || m.includes('clôtur')) return 'done';
    return 'ticket';
  }

  private dayLabel(d: Date) {
    const today = new Date();
    const start = (x: Date) => new Date(x.getFullYear(), x.getMonth(), x.getDate()).getTime();
    const diff = Math.round((start(today) - start(d)) / 86400000);
    if (diff === 0) return 'Aujourd’hui';
    if (diff === 1) return 'Hier';
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric' });
  }
}