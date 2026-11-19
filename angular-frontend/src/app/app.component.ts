import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { catchError, of, switchMap, timer } from 'rxjs';
import { AuthService } from './core/services/auth.service';
import { TicketService } from './core/services/ticket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="shell" *ngIf="auth.currentUser() as user; else bare">
      <nav class="rail">
        <div class="logo">DF</div>

        <!-- Dashboard -->
        <a *ngIf="user.role !== 'EMPLOYE'" routerLink="/dashboard" routerLinkActive="active"
           data-tip="Dashboard" aria-label="Dashboard">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <rect width="7" height="9" x="3" y="3" rx="1"/><rect width="7" height="5" x="14" y="3" rx="1"/>
            <rect width="7" height="9" x="14" y="12" rx="1"/><rect width="7" height="5" x="3" y="16" rx="1"/>
          </svg>
        </a>

        <!-- Tickets -->
        <a routerLink="/tickets" routerLinkActive="active" [routerLinkActiveOptions]="{ exact: true }"
           data-tip="Tickets" aria-label="Tickets">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M2 9a3 3 0 0 1 0 6v2a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-2a3 3 0 0 1 0-6V7a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2Z"/>
            <path d="M13 5v2"/><path d="M13 11v2"/><path d="M13 17v2"/>
          </svg>
        </a>

        <!-- Nouveau ticket -->
        <a *ngIf="user.role !== 'TECHNICIEN'" routerLink="/tickets/new" routerLinkActive="active"
           data-tip="Nouveau ticket" aria-label="Nouveau ticket">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <circle cx="12" cy="12" r="10"/><path d="M8 12h8"/><path d="M12 8v8"/>
          </svg>
        </a>

        <!-- Admin -->
        <a *ngIf="user.role === 'ADMIN' || user.role === 'IT_MANAGER'" routerLink="/admin" routerLinkActive="active"
           data-tip="Administration" aria-label="Administration">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M20 13c0 5-3.5 7.5-7.66 8.95a1 1 0 0 1-.67-.01C7.5 20.5 4 18 4 13V6a1 1 0 0 1 1-1c2 0 4.5-1.2 6.24-2.72a1.17 1.17 0 0 1 1.52 0C14.51 3.81 17 5 19 5a1 1 0 0 1 1 1z"/>
          </svg>
        </a>

        <!-- Alertes -->
        <a routerLink="/notifications" routerLinkActive="active" data-tip="Alertes" aria-label="Alertes">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>
          </svg>
          <span class="n-badge" *ngIf="unreadCount > 0">{{ unreadCount > 9 ? '9+' : unreadCount }}</span>
        </a>

        <div class="spacer"></div>

        <!-- Déconnexion -->
        <button (click)="auth.logout()" data-tip="Déconnexion" aria-label="Déconnexion">
          <svg class="icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round">
            <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/>
            <polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/>
          </svg>
        </button>
      </nav>

      <main class="panel">
        <div class="topbar">{{ user.prenom }} {{ user.nom }} · {{ roleLabel(user.role) }}</div>
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #bare><router-outlet></router-outlet></ng-template>
  `,
  styles: [`
    /* ── Sidebar : tout est centré horizontalement ── */
    .shell .rail {
      display: flex;
      flex-direction: column;
      align-items: center;      /* centre les icônes */
      justify-content: flex-start;
      gap: 12px;
      width: 84px;
      padding: 20px 0;
      overflow: visible;        /* laisse l'infobulle sortir de la barre */
      position: relative;
      z-index: 30;              /* l'infobulle passe au-dessus du contenu */
    }
    .shell .rail .logo { margin: 0 auto 18px; }
    .shell .rail .spacer { flex: 1; }

    /* ── Boutons-icônes ── */
    .shell .rail a,
    .shell .rail button {
      position: relative;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 48px;
      height: 48px;
      padding: 0;
      margin: 0;
      border: 0;
      border-radius: 14px;
      background: transparent;
      color: #c7d2fe;
      cursor: pointer;
      text-decoration: none;
      transition: background .18s ease, color .18s ease, transform .18s ease;
    }
    .shell .rail a:hover,
    .shell .rail button:hover {
      background: rgba(255, 255, 255, .14);
      color: #fff;
      transform: translateY(-1px);
    }
    .shell .rail a.active {
      background: #fff;
      color: #3730a3;
      box-shadow: 0 8px 18px rgba(0, 0, 0, .2);
    }
    .icon { width: 22px; height: 22px; display: block; }

    /* ── Infobulle stylée ── */
    .shell .rail [data-tip]::after {
      content: attr(data-tip);
      position: absolute;
      left: calc(100% + 14px);
      top: 50%;
      transform: translate(-6px, -50%);
      padding: 7px 12px;
      border-radius: 10px;
      background: #1e1b4b;
      color: #fff;
      font-size: 12.5px;
      font-weight: 600;
      letter-spacing: .2px;
      white-space: nowrap;
      box-shadow: 0 10px 24px rgba(30, 27, 75, .35);
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease, transform .18s ease;
    }
    /* petite flèche */
    .shell .rail [data-tip]::before {
      content: '';
      position: absolute;
      left: calc(100% + 8px);
      top: 50%;
      transform: translate(-6px, -50%);
      border: 6px solid transparent;
      border-right-color: #1e1b4b;
      opacity: 0;
      pointer-events: none;
      transition: opacity .18s ease, transform .18s ease;
    }
    .shell .rail [data-tip]:hover::after,
    .shell .rail [data-tip]:hover::before,
    .shell .rail [data-tip]:focus-visible::after,
    .shell .rail [data-tip]:focus-visible::before {
      opacity: 1;
      transform: translate(0, -50%);
    }

    /* ── Badge notifications ── */
    .shell .rail .n-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      min-width: 18px;
      height: 18px;
      padding: 0 4px;
      border-radius: 9px;
      display: grid;
      place-items: center;
      background: #e11d48;
      color: #fff;
      font-size: 11px;
      font-weight: 700;
      line-height: 1;
      border: 2px solid #4338ca;
      box-sizing: content-box;
    }
      /* ── Petits écrans : la sidebar devient une barre horizontale en haut ── */
@media (max-width: 1000px) {
  .shell {
    flex-direction: column;
    gap: 12px;
    padding: 12px;
  }

  .shell .rail {
    flex-direction: row;
    flex-wrap: wrap;
    justify-content: flex-start;
    align-items: center;
    width: 100%;
    padding: 8px 12px;
    gap: 8px;
    background: rgba(255, 255, 255, .12);
    border-radius: 20px;
    backdrop-filter: blur(6px);
  }

  .shell .rail .logo { margin: 0 8px 0 0; width: 42px; height: 42px; }

  /* pousse la déconnexion à droite */
  .shell .rail .spacer { display: block; flex: 1; min-width: 0; }

  .shell .rail a,
  .shell .rail button { width: 44px; height: 44px; }

  /* l'infobulle s'affiche sous l'icône au lieu de la droite */
  .shell .rail [data-tip]::after {
    left: 50%;
    top: calc(100% + 12px);
    transform: translate(-50%, -6px);
  }
  .shell .rail [data-tip]::before {
    left: 50%;
    top: calc(100% + 6px);
    transform: translate(-50%, -6px);
    border-right-color: transparent;
    border-bottom-color: #1e1b4b;
  }
  .shell .rail [data-tip]:hover::after,
  .shell .rail [data-tip]:hover::before,
  .shell .rail [data-tip]:focus-visible::after,
  .shell .rail [data-tip]:focus-visible::before {
    transform: translate(-50%, 0);
  }

  .shell .panel { padding: 18px 16px; border-radius: 22px; }
}

/* Très petits écrans (téléphone) */
@media (max-width: 520px) {
  .shell { padding: 8px; }
  .shell .rail { gap: 4px; padding: 6px 8px; }
  .shell .rail a,
  .shell .rail button { width: 40px; height: 40px; }
  .shell .rail .logo { width: 38px; height: 38px; font-size: 14px; }
  .icon { width: 20px; height: 20px; }
}
  `],
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  private api = inject(TicketService);
  unreadCount = 0;

  ngOnInit() {
    // Rafraîchit la pastille de notifications toutes les 30 secondes
    timer(0, 30000)
      .pipe(
        switchMap(() =>
          this.auth.getToken()
            ? this.api.getUnreadCount().pipe(catchError(() => of({ count: 0 })))
            : of({ count: 0 })
        )
      )
      .subscribe((r) => (this.unreadCount = r.count));
  }

  roleLabel(role: string) {
    return ({ EMPLOYE: 'Employé', TECHNICIEN: 'Technicien', IT_MANAGER: 'Responsable IT', ADMIN: 'Administrateur' } as Record<string, string>)[role] ?? role;
  }
  
}
