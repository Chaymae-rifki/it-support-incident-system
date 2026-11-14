import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../core/services/ticket.service';
import { Team, User } from '../../models/models';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-6">
      <h1 class="text-2xl font-semibold">Administration IT</h1>
      <div class="grid grid-cols-2 gap-6">
        <div class="bg-white border rounded-xl p-4">
          <h2 class="font-semibold mb-3">Utilisateurs ({{ users.length }})</h2>
          <div *ngFor="let u of users" class="py-2 border-b text-sm flex justify-between">
            <span>{{ u.prenom }} {{ u.nom }}</span>
            <span class="font-mono text-xs">{{ u.role }}</span>
          </div>
        </div>
        <div class="bg-white border rounded-xl p-4">
          <h2 class="font-semibold mb-3">Équipes ({{ teams.length }})</h2>
          <div *ngFor="let t of teams" class="py-2 border-b text-sm">
            <div class="font-medium">{{ t.nom }}</div>
            <div class="text-xs text-slate-500">{{ t.description }}</div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class AdminComponent implements OnInit {
  private ticketService = inject(TicketService);
  users: User[] = [];
  teams: Team[] = [];

  ngOnInit() {
    this.ticketService.getUsers().subscribe((u) => (this.users = u));
    this.ticketService.getTeams().subscribe((t) => (this.teams = t));
  }
}
