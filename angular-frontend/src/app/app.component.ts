import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { AuthService } from './core/services/auth.service';
import { TicketService } from './core/services/ticket.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="min-h-screen flex bg-[#F6F8FA]" *ngIf="auth.currentUser() as user; else authOutlet">
      <aside class="w-64 bg-white border-r border-slate-200 flex flex-col justify-between shrink-0">
        <div>
          <div class="h-16 px-5 border-b border-slate-200/80 flex items-center gap-2.5">
            <div class="w-8 h-8 rounded-xl bg-indigo-600 flex items-center justify-center text-white font-bold text-sm">DF</div>
            <span class="font-semibold text-base tracking-tight text-slate-900">DeskFlow IT</span>
          </div>

          <nav class="p-3 space-y-1 text-sm font-medium">
            <a *ngIf="user.role !== 'EMPLOYE'" routerLink="/dashboard" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="block px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Tableau de bord</a>
            <a routerLink="/tickets" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="block px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100">
              {{ user.role === 'EMPLOYE' ? 'Mes tickets' : 'Gestion des tickets' }}
            </a>
            <a *ngIf="user.role === 'EMPLOYE'" routerLink="/tickets/new" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="block px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Nouveau ticket</a>
            <a *ngIf="user.role === 'ADMIN'" routerLink="/admin" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="block px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100">Administration</a>
            <a routerLink="/notifications" routerLinkActive="bg-indigo-50 text-indigo-700"
               class="flex items-center justify-between px-3 py-2 rounded-xl text-slate-600 hover:bg-slate-100">
              <span>Notifications</span>
              <span *ngIf="unreadCount > 0" class="px-1.5 py-0.5 text-xs font-mono bg-indigo-600 text-white rounded">{{ unreadCount }}</span>
            </a>
          </nav>
        </div>

        <div class="p-4 border-t border-slate-200 space-y-3">
          <div>
            <p class="text-sm font-medium text-slate-900">{{ user.prenom }} {{ user.nom }}</p>
            <p class="text-xs text-slate-500">{{ user.role }}</p>
          </div>
          <button (click)="auth.logout()" class="w-full py-2 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-xl">
            Déconnexion
          </button>
        </div>
      </aside>

      <main class="flex-1 p-8 max-w-7xl mx-auto w-full">
        <router-outlet></router-outlet>
      </main>
    </div>

    <ng-template #authOutlet>
      <router-outlet></router-outlet>
    </ng-template>
  `,
})
export class AppComponent implements OnInit {
  auth = inject(AuthService);
  private ticketService = inject(TicketService);
  unreadCount = 0;

  ngOnInit() {
    if (this.auth.getToken()) {
      this.ticketService.getNotifications().subscribe({
        next: (list) => (this.unreadCount = list.filter((n) => !n.lue).length),
        error: () => {},
      });
    }
  }
}
