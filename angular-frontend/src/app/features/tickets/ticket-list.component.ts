import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { Category, Ticket } from '../../models/models';

@Component({
  selector: 'app-ticket-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="space-y-4">
      <div class="flex justify-between items-center">
        <h1 class="text-2xl font-semibold">Liste des tickets</h1>
        <input [(ngModel)]="search" (ngModelChange)="load()" placeholder="Rechercher..." class="px-3 py-2 border rounded-lg text-sm" />
      </div>
      <table class="w-full bg-white border rounded-xl text-sm">
        <thead>
          <tr class="border-b bg-slate-50 text-left">
            <th class="p-3">Réf</th>
            <th class="p-3">Titre</th>
            <th class="p-3">Catégorie</th>
            <th class="p-3">Priorité</th>
            <th class="p-3">Statut</th>
          </tr>
        </thead>
        <tbody>
          <tr *ngFor="let t of tickets" [routerLink]="['/tickets', t.id]" class="border-b hover:bg-slate-50 cursor-pointer">
            <td class="p-3 font-mono">{{ t.reference }}</td>
            <td class="p-3 font-medium">{{ t.titre }}</td>
            <td class="p-3">{{ t.categoryNom }}</td>
            <td class="p-3">{{ t.priorite }}</td>
            <td class="p-3">{{ t.statut }}</td>
          </tr>
        </tbody>
      </table>
    </div>
  `,
})
export class TicketListComponent implements OnInit {
  private auth = inject(AuthService);
  private ticketService = inject(TicketService);
  tickets: Ticket[] = [];
  categories: Category[] = [];
  search = '';

  ngOnInit() {
    this.ticketService.getCategories().subscribe((c) => (this.categories = c));
    this.load();
  }

  load() {
    const role = this.auth.currentUser()?.role;
    const obs = role === 'EMPLOYE'
      ? this.ticketService.getMyTickets(0, 20)
      : this.ticketService.getAllTickets({ q: this.search, page: 0, size: 20 });
    obs.subscribe((res) => (this.tickets = res.content));
  }
}
