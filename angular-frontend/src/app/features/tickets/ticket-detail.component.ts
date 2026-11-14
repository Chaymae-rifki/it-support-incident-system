import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { Team, TicketDetail, TicketStatus, User } from '../../models/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div *ngIf="detail as d" class="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start">
      <div class="lg:col-span-8 space-y-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <div class="flex flex-wrap items-center gap-2 text-xs text-slate-500">
            <span class="font-mono font-semibold text-indigo-700">{{ d.ticket.reference }}</span>
            <span>·</span>
            <span>{{ d.ticket.categoryNom }}</span>
            <span>·</span>
            <span class="font-medium text-slate-800">{{ d.ticket.priorite }}</span>
            <span>·</span>
            <span class="px-2 py-0.5 rounded bg-slate-100 text-slate-800 font-medium">{{ d.ticket.statut }}</span>
          </div>
          <h1 class="text-xl font-semibold text-slate-900">{{ d.ticket.titre }}</h1>
          <p class="text-sm text-slate-700 whitespace-pre-wrap">{{ d.ticket.description }}</p>

          <div *ngIf="d.ticket.solutionAppliquee" class="p-4 bg-teal-50 border border-teal-200 rounded-xl text-sm">
            <p class="font-semibold text-teal-900 text-xs mb-1">Solution appliquée</p>
            <p class="text-teal-950">{{ d.ticket.solutionAppliquee }}</p>
          </div>
        </div>

        <div class="bg-white border border-slate-200 rounded-2xl p-6 space-y-4">
          <h2 class="font-semibold text-slate-900">Commentaires ({{ d.comments.length }})</h2>
          <div *ngFor="let c of d.comments" class="p-4 rounded-xl border"
               [ngClass]="c.interne ? 'bg-amber-50 border-amber-200' : 'bg-slate-50 border-slate-200'">
            <div class="flex justify-between text-xs mb-1">
              <span class="font-semibold">{{ c.auteurNom }} <span *ngIf="c.interne" class="text-amber-700">· Note interne</span></span>
              <span class="font-mono text-slate-400">{{ c.date | date:'short' }}</span>
            </div>
            <p class="text-sm text-slate-800">{{ c.contenu }}</p>
          </div>

          <div *ngIf="d.ticket.statut !== 'CLOTURE' && d.ticket.statut !== 'ANNULE'" class="space-y-3 pt-2">
            <textarea [(ngModel)]="commentText" rows="3" placeholder="Écrire un commentaire..."
                      class="w-full border border-slate-300 rounded-xl p-3 text-sm"></textarea>
            <div class="flex items-center justify-between">
              <label *ngIf="auth.currentUser()?.role !== 'EMPLOYE'" class="inline-flex items-center gap-2 text-xs text-slate-700">
                <input type="checkbox" [(ngModel)]="isInternal" />
                <span>Note interne (masquée pour l'employé)</span>
              </label>
              <button (click)="postComment()" class="px-4 py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium ml-auto">
                Envoyer
              </button>
            </div>
          </div>
        </div>
      </div>

      <div class="lg:col-span-4 space-y-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3"
             *ngIf="d.ticket.statut !== 'CLOTURE' && d.ticket.statut !== 'ANNULE'">
          <h3 class="font-semibold text-sm text-slate-900">Actions métier</h3>

          <!-- Employé -->
          <ng-container *ngIf="auth.currentUser()?.role === 'EMPLOYE'">
            <button *ngIf="d.ticket.statut === 'OUVERT'" (click)="cancelTicket()"
                    class="w-full py-2 bg-rose-50 text-rose-700 border border-rose-200 rounded-xl text-sm font-medium">
              Annuler le ticket
            </button>
            <ng-container *ngIf="d.ticket.statut === 'RESOLU'">
              <button (click)="confirmTicket()"
                      class="w-full py-2 bg-teal-600 text-white rounded-xl text-sm font-medium">
                Confirmer la résolution
              </button>
              <input [(ngModel)]="reopenMotif" placeholder="Motif de réouverture..." class="w-full px-3 py-2 border rounded-xl text-xs" />
              <button (click)="reopenTicket()" class="w-full py-2 bg-amber-50 text-amber-800 border border-amber-200 rounded-xl text-sm font-medium">
                Rouvrir le ticket
              </button>
            </ng-container>
          </ng-container>

          <!-- Technicien / Admin -->
          <ng-container *ngIf="auth.currentUser()?.role !== 'EMPLOYE'">
            <button *ngIf="auth.currentUser()?.role === 'TECHNICIEN' && !d.ticket.technicienId" (click)="takeTicket()"
                    class="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium">
              Prendre en charge
            </button>

            <div *ngIf="auth.currentUser()?.role === 'ADMIN'" class="space-y-2 pt-2 border-t">
              <label class="block text-xs font-medium">Affecter à un technicien</label>
              <select [(ngModel)]="selectedTechId" class="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                <option [ngValue]="null">— Sélectionner —</option>
                <option *ngFor="let tech of technicians" [ngValue]="tech.id">{{ tech.prenom }} {{ tech.nom }}</option>
              </select>
              <button (click)="assignTicket()" class="w-full py-2 bg-slate-900 text-white rounded-xl text-xs font-medium">
                Affecter / Réaffecter
              </button>
            </div>

            <div class="space-y-2 pt-2 border-t">
              <label class="block text-xs font-medium">Modifier le statut</label>
              <select [(ngModel)]="nextStatus" class="w-full px-3 py-2 border rounded-xl text-sm bg-white">
                <option value="EN_COURS">En cours</option>
                <option value="EN_ATTENTE">En attente</option>
                <option value="RESOLU">Résolu</option>
              </select>
              <textarea *ngIf="nextStatus === 'RESOLU'" [(ngModel)]="solution" rows="2" placeholder="Solution appliquée..."
                        class="w-full px-3 py-2 border rounded-xl text-xs"></textarea>
              <button (click)="updateStatus()" class="w-full py-2 bg-indigo-600 text-white rounded-xl text-xs font-medium">
                Enregistrer le statut
              </button>
            </div>
          </ng-container>
        </div>

        <!-- Historique -->
        <div class="bg-white border border-slate-200 rounded-2xl p-5 space-y-3">
          <h3 class="font-semibold text-sm text-slate-900">Historique horodaté</h3>
          <div *ngFor="let h of d.history" class="text-xs pb-2 border-b border-slate-100 last:border-0">
            <div class="flex justify-between font-medium text-slate-900">
              <span>{{ h.action }}</span>
              <span class="font-mono text-slate-400">{{ h.date | date:'short' }}</span>
            </div>
            <p class="text-slate-600 mt-0.5">{{ h.details }}</p>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private ticketService = inject(TicketService);
  auth = inject(AuthService);

  detail?: TicketDetail;
  technicians: User[] = [];
  teams: Team[] = [];

  commentText = '';
  isInternal = false;
  nextStatus: TicketStatus = 'EN_COURS';
  solution = '';
  reopenMotif = '';
  selectedTechId: number | null = null;

  ngOnInit() {
    this.load();
    if (this.auth.currentUser()?.role === 'ADMIN') {
      this.ticketService.getUsers().subscribe((u) => (this.technicians = u.filter((x) => x.role === 'TECHNICIEN')));
      this.ticketService.getTeams().subscribe((t) => (this.teams = t));
    }
  }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.ticketService.getById(id).subscribe((d) => {
      this.detail = d;
      this.selectedTechId = d.ticket.technicienId ?? null;
      this.solution = d.ticket.solutionAppliquee ?? '';
    });
  }

  postComment() {
    if (!this.detail || !this.commentText.trim()) return;
    this.ticketService.addComment(this.detail.ticket.id, this.commentText, this.isInternal).subscribe(() => {
      this.commentText = '';
      this.isInternal = false;
      this.load();
    });
  }

  takeTicket() {
    if (this.detail) this.ticketService.take(this.detail.ticket.id).subscribe(() => this.load());
  }

  assignTicket() {
    if (this.detail) this.ticketService.assign(this.detail.ticket.id, this.selectedTechId, null).subscribe(() => this.load());
  }

  updateStatus() {
    if (this.detail) this.ticketService.updateStatus(this.detail.ticket.id, this.nextStatus, this.solution).subscribe(() => this.load());
  }

  cancelTicket() {
    if (this.detail) this.ticketService.cancel(this.detail.ticket.id).subscribe(() => this.load());
  }

  confirmTicket() {
    if (this.detail) this.ticketService.confirm(this.detail.ticket.id).subscribe(() => this.load());
  }

  reopenTicket() {
    if (this.detail) this.ticketService.reopen(this.detail.ticket.id, this.reopenMotif).subscribe(() => this.load());
  }
}
