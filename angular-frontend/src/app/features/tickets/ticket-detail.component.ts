import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, RouterModule } from '@angular/router';
import { Observable } from 'rxjs';
import { AuthService } from '../../core/services/auth.service';
import { TicketService } from '../../core/services/ticket.service';
import { Intervention, TicketDetail, User } from '../../models/models';

@Component({
  selector: 'app-ticket-detail',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule],
  template: `
    <div class="td-error" *ngIf="error">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 8v4"/><path d="M12 16h.01"/></svg>
      {{ error }}
      <button class="td-error-x" (click)="error = ''" aria-label="Fermer">×</button>
    </div>

    <div class="td-state" *ngIf="!detail && !error">
      <div class="td-spinner"></div>
      <p>Chargement du ticket...</p>
    </div>

    <ng-container *ngIf="detail as d">
      <!-- En-tête -->
      <div class="td-head">
        <a routerLink="/tickets" class="td-back" aria-label="Retour">
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"><path d="m15 18-6-6 6-6"/></svg>
        </a>
        <div class="td-head-main">
          <div class="td-meta">
            <span class="td-ref">{{ d.ticket.reference }}</span>
            <span class="td-pill" [ngClass]="'s-' + d.ticket.statut"><i></i>{{ statutLabel(d.ticket.statut) }}</span>
            <span class="td-pill" [ngClass]="'p-' + d.ticket.priorite"><i></i>{{ prioLabel(d.ticket.priorite) }}</span>
            <span class="td-pill late" *ngIf="d.ticket.slaDepasse"><i></i>SLA dépassé</span>
          </div>
          <h1 class="td-title">{{ d.ticket.titre }}</h1>
        </div>
      </div>

      <div class="td-layout">
        <!-- ═════ Colonne gauche ═════ -->
        <div class="td-col">

          <!-- Détails -->
          <section class="td-card">
            <h2>Description</h2>
            <p class="td-desc">{{ d.ticket.description }}</p>

            <div class="td-info">
              <div class="td-info-item">
                <span class="td-info-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M12.586 2.586A2 2 0 0 0 11.172 2H4a2 2 0 0 0-2 2v7.172a2 2 0 0 0 .586 1.414l8.704 8.704a2.426 2.426 0 0 0 3.42 0l6.58-6.58a2.426 2.426 0 0 0 0-3.42z"/><circle cx="7.5" cy="7.5" r=".5" fill="currentColor"/></svg></span>
                <div><small>Catégorie</small><b>{{ d.ticket.categoryNom }}</b></div>
              </div>
              <div class="td-info-item">
                <span class="td-info-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21v-2a4 4 0 0 0-4-4H9a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></span>
                <div><small>Demandeur</small><b>{{ d.ticket.createurNom }}</b></div>
              </div>
              <div class="td-info-item">
                <span class="td-info-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.7 6.3a1 1 0 0 0 0 1.4l1.6 1.6a1 1 0 0 0 1.4 0l3.77-3.77a6 6 0 0 1-7.94 7.94l-6.91 6.91a2.12 2.12 0 0 1-3-3l6.91-6.91a6 6 0 0 1 7.94-7.94z"/></svg></span>
                <div><small>Technicien</small><b [class.muted]="!d.ticket.technicienNom">{{ d.ticket.technicienNom || 'Non affecté' }}</b></div>
              </div>
              <div class="td-info-item">
                <span class="td-info-ico" [class.warn]="d.ticket.slaDepasse"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 6v6l4 2"/></svg></span>
                <div><small>Échéance SLA</small><b>{{ d.ticket.dateEcheanceResolution ? (d.ticket.dateEcheanceResolution | date:'dd/MM/yyyy HH:mm') : '—' }}</b></div>
              </div>
              <div class="td-info-item">
                <span class="td-info-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="14" x="2" y="3" rx="2"/><path d="M8 21h8M12 17v4"/></svg></span>
                <div><small>Équipement</small><b [class.muted]="!d.ticket.assetCode">{{ d.ticket.assetCode || 'Aucun' }}</b></div>
              </div>
              <div class="td-info-item">
                <span class="td-info-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="18" x="3" y="4" rx="2"/><path d="M16 2v4M8 2v4M3 10h18"/></svg></span>
                <div><small>Créé le</small><b>{{ d.ticket.dateCreation | date:'dd/MM/yyyy HH:mm' }}</b></div>
              </div>
            </div>

            <div class="td-solution" *ngIf="d.ticket.solutionAppliquee">
              <div class="td-solution-h">
                <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="m9 12 2 2 4-4"/></svg>
                Solution appliquée
              </div>
              <p>{{ d.ticket.solutionAppliquee }}</p>
            </div>

            <div class="td-files" *ngIf="d.attachments.length">
              <h3>Pièces jointes ({{ d.attachments.length }})</h3>
              <div class="td-file" *ngFor="let a of d.attachments">
                <span class="td-file-ico"><svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"><path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"/><path d="M14 2v6h6"/></svg></span>
                <div class="td-file-info"><b>{{ a.nomFichier }}</b><small>{{ fileSize(a.taille) }}</small></div>
                <button class="td-btn-soft" (click)="download(a)">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4"/><path d="m7 10 5 5 5-5"/><path d="M12 15V3"/></svg>
                  Télécharger
                </button>
              </div>
            </div>
          </section>

          <!-- Commentaires -->
          <section class="td-card">
            <h2>Commentaires <i class="td-count">{{ d.comments.length }}</i></h2>

            <p class="td-none" *ngIf="!d.comments.length">Aucun commentaire pour le moment.</p>

            <div class="td-comment" *ngFor="let c of d.comments" [class.internal]="c.interne">
              <span class="td-avatar" [ngClass]="'av-' + c.auteurRole">{{ initials(c.auteurNom) }}</span>
              <div class="td-comment-body">
                <div class="td-comment-h">
                  <b>{{ c.auteurNom }}</b>
                  <span class="td-role">{{ roleLabel(c.auteurRole) }}</span>
                  <span class="td-note" *ngIf="c.interne">
                    <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="18" height="11" x="3" y="11" rx="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
                    Note interne
                  </span>
                  <small>{{ c.date | date:'dd/MM/yyyy HH:mm' }}</small>
                </div>
                <p>{{ c.contenu }}</p>
              </div>
            </div>

            <div class="td-compose" *ngIf="isOpen">
              <textarea [(ngModel)]="commentText" rows="3" placeholder="Écrire un commentaire..."></textarea>
              <div class="td-compose-bar">
                <label class="td-check" *ngIf="role !== 'EMPLOYE'">
                  <input type="checkbox" [(ngModel)]="isInternal" />
                  <span>Note interne <small>(invisible pour l'employé)</small></span>
                </label>
                <button class="td-btn-primary" (click)="postComment()" [disabled]="!commentText.trim()">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m22 2-7 20-4-9-9-4z"/><path d="M22 2 11 13"/></svg>
                  Envoyer
                </button>
              </div>
            </div>
          </section>

          <!-- Interventions -->
          <section class="td-card" *ngIf="role !== 'EMPLOYE'">
            <h2>Interventions <i class="td-count">{{ interventions.length }}</i></h2>

            <p class="td-none" *ngIf="!interventions.length">Aucune intervention enregistrée.</p>

            <div class="td-interv" *ngFor="let i of interventions">
              <div class="td-interv-h">
                <b>{{ i.technicienNom }}</b>
                <span class="td-time">{{ i.tempsPasseMinutes }} min</span>
                <small>{{ i.dateCreation | date:'dd/MM/yyyy HH:mm' }}</small>
              </div>
              <p><span>Diagnostic</span>{{ i.diagnostic }}</p>
              <p *ngIf="i.actions"><span>Actions</span>{{ i.actions }}</p>
            </div>

            <div class="td-form" *ngIf="isMyTech && (d.ticket.statut === 'EN_COURS' || d.ticket.statut === 'EN_ATTENTE')">
              <h3>Nouvelle intervention</h3>
              <div class="td-field">
                <label>Diagnostic <span class="req">*</span></label>
                <textarea [(ngModel)]="iv.diagnostic" rows="2" placeholder="Cause identifiée du problème..."></textarea>
              </div>
              <div class="td-cols">
                <div class="td-field">
                  <label>Actions réalisées</label>
                  <input [(ngModel)]="iv.actions" placeholder="Ex : remplacement du câble" />
                </div>
                <div class="td-field">
                  <label>Temps passé (min)</label>
                  <input type="number" min="0" [(ngModel)]="iv.tempsPasseMinutes" />
                </div>
              </div>
              <button class="td-btn-teal" (click)="addIntervention()" [disabled]="!iv.diagnostic.trim()">Enregistrer l'intervention</button>
            </div>
          </section>
        </div>

        <!-- ═════ Colonne droite ═════ -->
        <div class="td-col">

          <!-- Actions -->
          <section class="td-card td-actions" *ngIf="isOpen && hasActions">
            <h2>Actions</h2>

            <!-- Demandeur -->
            <ng-container *ngIf="isCreator">
              <button class="td-act danger" *ngIf="d.ticket.statut === 'OUVERT'" (click)="run(api.cancel(d.ticket.id))">Annuler le ticket</button>
              <ng-container *ngIf="d.ticket.statut === 'RESOLU'">
                <button class="td-act teal" (click)="run(api.confirm(d.ticket.id))">Confirmer la résolution</button>
                <div class="td-sep">ou</div>
                <input class="td-input" [(ngModel)]="reopenMotif" placeholder="Motif de réouverture..." />
                <button class="td-act warn" [disabled]="!reopenMotif.trim()" (click)="run(api.reopen(d.ticket.id, reopenMotif))">Rouvrir le ticket</button>
              </ng-container>
            </ng-container>

            <!-- Responsable IT / Admin -->
            <ng-container *ngIf="isSupervisor">
              <div *ngIf="d.ticket.statut !== 'RESOLU'" class="td-assign">
                <label>Affecter à un technicien</label>
                <select class="td-input" [(ngModel)]="selectedTechId">
                  <option [ngValue]="null">Sélectionner...</option>
                  <option *ngFor="let t of technicians" [ngValue]="t.id">{{ t.prenom }} {{ t.nom }}</option>
                </select>
                <button class="td-act primary" [disabled]="!selectedTechId" (click)="run(api.assign(d.ticket.id, selectedTechId, null))">Affecter / Réaffecter</button>
              </div>
              <button class="td-act teal" *ngIf="d.ticket.statut === 'RESOLU' && !isCreator" (click)="run(api.updateStatus(d.ticket.id, 'CLOTURE'))">Clôturer le ticket</button>
              <button class="td-act danger" *ngIf="canSupCancel" (click)="run(api.updateStatus(d.ticket.id, 'ANNULE'))">Annuler le ticket</button>
            </ng-container>

            <!-- Technicien affecté -->
            <ng-container *ngIf="isMyTech">
              <button class="td-act primary" *ngIf="d.ticket.statut === 'AFFECTE'" (click)="run(api.take(d.ticket.id))">Démarrer l'intervention</button>
              <ng-container *ngIf="d.ticket.statut === 'EN_COURS'">
                <button class="td-act warn" (click)="run(api.updateStatus(d.ticket.id, 'EN_ATTENTE'))">Mettre en attente</button>
                <div class="td-sep">résolution</div>
                <textarea class="td-input" [(ngModel)]="solution" rows="3" placeholder="Solution appliquée (obligatoire pour résoudre)..."></textarea>
                <button class="td-act teal" [disabled]="!solution.trim()" (click)="run(api.updateStatus(d.ticket.id, 'RESOLU', solution))">Marquer comme résolu</button>
              </ng-container>
              <button class="td-act primary" *ngIf="d.ticket.statut === 'EN_ATTENTE'" (click)="run(api.updateStatus(d.ticket.id, 'EN_COURS'))">Reprendre le traitement</button>
            </ng-container>
          </section>

          <!-- Historique -->
          <section class="td-card">
            <h2>Historique</h2>
            <p class="td-none" *ngIf="!d.history.length">Aucun événement.</p>
            <div class="td-timeline">
              <div class="td-step" *ngFor="let h of d.history">
                <span class="td-step-dot"></span>
                <div class="td-step-h">
                  <b>{{ h.action }}</b>
                  <small>{{ h.date | date:'dd/MM HH:mm' }}</small>
                </div>
                <div class="td-step-sub">
                  {{ h.auteurNom }}
                  <ng-container *ngIf="h.ancienStatut && h.nouveauStatut && h.ancienStatut !== h.nouveauStatut">
                    · {{ statutLabel(h.ancienStatut) }} → {{ statutLabel(h.nouveauStatut) }}
                  </ng-container>
                </div>
                <div class="td-step-det" *ngIf="h.details">{{ h.details }}</div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </ng-container>
  `,
  styles: [`
    :host { display: block; }

    /* ── Erreur / chargement ── */
    .td-error { display: flex; align-items: center; gap: 10px; padding: 12px 14px; margin-bottom: 16px; border-radius: 14px; background: #FFF1F2; border: 1px solid #FECDD3; color: #BE123C; font-size: 13.5px; }
    .td-error svg { width: 18px; height: 18px; flex-shrink: 0; }
    .td-error-x { margin: 0 0 0 auto; width: 24px; height: 24px; padding: 0; border: 0; border-radius: 50%; background: #FECDD3; color: #BE123C; cursor: pointer; font-size: 16px; line-height: 1; }
    .td-state { padding: 80px 20px; text-align: center; color: #64748B; }
    .td-spinner { width: 32px; height: 32px; margin: 0 auto 12px; border-radius: 50%; border: 3px solid #E0E7FF; border-top-color: #4F46E5; animation: td-spin .8s linear infinite; }
    @keyframes td-spin { to { transform: rotate(360deg); } }

    /* ── En-tête ── */
    .td-head { display: flex; align-items: flex-start; gap: 14px; margin-bottom: 20px; }
    .td-back { width: 40px; height: 40px; border-radius: 12px; border: 1px solid #E2E8F0; background: #fff; color: #475569; display: grid; place-items: center; flex-shrink: 0; transition: all .15s; }
    .td-back:hover { background: #4F46E5; border-color: #4F46E5; color: #fff; }
    .td-back svg { width: 18px; height: 18px; }
    .td-head-main { min-width: 0; }
    .td-meta { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 8px; }
    .td-ref { padding: 4px 10px; border-radius: 8px; background: #EEF2FF; color: #3730A3; font-family: Consolas, monospace; font-size: 12.5px; font-weight: 700; }
    .td-title { font-size: 25px; font-weight: 700; letter-spacing: -.3px; line-height: 1.25; color: #0F172A; overflow-wrap: anywhere; }

    .td-pill { display: inline-flex; align-items: center; gap: 6px; padding: 4px 11px; border-radius: 999px; font-size: 12px; font-weight: 600; white-space: nowrap; }
    .td-pill i { width: 7px; height: 7px; border-radius: 50%; background: currentColor; }
    .p-BASSE { background: #DCFCE7; color: #15803D; } .p-MOYENNE { background: #FEF3C7; color: #B45309; }
    .p-HAUTE { background: #FFEDD5; color: #C2410C; } .p-CRITIQUE { background: #FEE2E2; color: #B91C1C; }
    .s-OUVERT { background: #EEF2FF; color: #4338CA; } .s-AFFECTE { background: #E0F2FE; color: #0369A1; }
    .s-EN_COURS { background: #FEF3C7; color: #B45309; } .s-EN_ATTENTE { background: #F1F5F9; color: #475569; }
    .s-RESOLU { background: #CCFBF1; color: #0F766E; } .s-CLOTURE { background: #DCFCE7; color: #15803D; }
    .s-ANNULE, .late { background: #FEE2E2; color: #B91C1C; }

    /* ── Grille ── */
    .td-layout { display: grid; grid-template-columns: minmax(0, 1fr) 340px; gap: 18px; align-items: start; }
    @media (max-width: 1100px) { .td-layout { grid-template-columns: 1fr; } }
    .td-col { display: flex; flex-direction: column; gap: 18px; min-width: 0; }

    .td-card { background: #fff; border: 1px solid #E2E8F0; border-radius: 20px; padding: 22px; box-shadow: 0 1px 2px rgba(15,23,42,.04); }
    .td-card h2 { display: flex; align-items: center; gap: 10px; margin-bottom: 14px; font-size: 16px; font-weight: 700; color: #0F172A; }
    .td-card h3 { margin-bottom: 10px; font-size: 13.5px; font-weight: 700; color: #334155; }
    .td-count { font-style: normal; padding: 1px 9px; border-radius: 999px; background: #EEF2FF; color: #4F46E5; font-size: 12px; font-weight: 700; }
    .td-none { padding: 6px 0 10px; color: #94A3B8; font-size: 13.5px; }
    .muted { color: #94A3B8 !important; font-weight: 500 !important; }

    /* ── Détails ── */
    .td-desc { white-space: pre-wrap; line-height: 1.65; color: #334155; font-size: 14.5px; margin-bottom: 20px; overflow-wrap: anywhere; }
    .td-info { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
    @media (max-width: 800px) { .td-info { grid-template-columns: 1fr 1fr; } }
    @media (max-width: 480px) { .td-info { grid-template-columns: 1fr; } }
    .td-info-item { display: flex; align-items: center; gap: 12px; padding: 12px; border-radius: 14px; background: #F8FAFC; border: 1px solid #F1F5F9; min-width: 0; }
    .td-info-item small { display: block; font-size: 11.5px; color: #94A3B8; }
    .td-info-item b { display: block; font-size: 13.5px; color: #0F172A; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-info-item > div { min-width: 0; }
    .td-info-ico { width: 36px; height: 36px; border-radius: 11px; display: grid; place-items: center; background: #EEF2FF; color: #4F46E5; flex-shrink: 0; }
    .td-info-ico.warn { background: #FEE2E2; color: #DC2626; }
    .td-info-ico svg { width: 18px; height: 18px; }

    .td-solution { margin-top: 18px; padding: 16px; border-radius: 16px; background: #F0FDFA; border: 1px solid #99F6E4; }
    .td-solution-h { display: flex; align-items: center; gap: 8px; font-size: 13.5px; font-weight: 700; color: #0F766E; margin-bottom: 6px; }
    .td-solution-h svg { width: 18px; height: 18px; }
    .td-solution p { color: #134E4A; line-height: 1.6; font-size: 14px; white-space: pre-wrap; }

    .td-files { margin-top: 20px; }
    .td-file { display: flex; align-items: center; gap: 12px; padding: 10px 12px; margin-bottom: 8px; border: 1px solid #E2E8F0; border-radius: 14px; background: #F8FAFC; }
    .td-file-ico { width: 38px; height: 38px; border-radius: 11px; background: #fff; color: #4F46E5; display: grid; place-items: center; flex-shrink: 0; }
    .td-file-ico svg { width: 19px; height: 19px; }
    .td-file-info { flex: 1; min-width: 0; }
    .td-file-info b { display: block; font-size: 13.5px; color: #1E293B; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }
    .td-file-info small { color: #94A3B8; font-size: 12px; }
    .td-btn-soft { display: inline-flex; align-items: center; gap: 7px; width: auto; margin: 0; padding: 8px 13px; border: 0; border-radius: 10px; background: #EEF2FF; color: #4338CA; font: inherit; font-size: 12.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .td-btn-soft svg { width: 15px; height: 15px; }
    .td-btn-soft:hover { background: #4F46E5; color: #fff; }

    /* ── Commentaires ── */
    .td-comment { display: flex; gap: 12px; margin-bottom: 14px; }
    .td-avatar { width: 38px; height: 38px; border-radius: 50%; display: grid; place-items: center; color: #fff; font-size: 12px; font-weight: 700; flex-shrink: 0; }
    .av-ADMIN { background: linear-gradient(135deg, #E11D48, #F97316); }
    .av-IT_MANAGER { background: linear-gradient(135deg, #7C3AED, #4F46E5); }
    .av-TECHNICIEN { background: linear-gradient(135deg, #0D9488, #0284C7); }
    .av-EMPLOYE { background: linear-gradient(135deg, #64748B, #94A3B8); }
    .td-comment-body { flex: 1; min-width: 0; padding: 12px 14px; border-radius: 4px 16px 16px 16px; background: #F8FAFC; border: 1px solid #E2E8F0; }
    .td-comment.internal .td-comment-body { background: #FFFBEB; border-color: #FDE68A; }
    .td-comment-h { display: flex; flex-wrap: wrap; align-items: center; gap: 8px; margin-bottom: 5px; font-size: 13px; }
    .td-comment-h b { color: #0F172A; }
    .td-comment-h small { margin-left: auto; color: #94A3B8; font-size: 11.5px; }
    .td-role { padding: 1px 8px; border-radius: 999px; background: #E2E8F0; color: #475569; font-size: 11px; font-weight: 600; }
    .td-note { display: inline-flex; align-items: center; gap: 4px; padding: 1px 8px; border-radius: 999px; background: #FEF3C7; color: #B45309; font-size: 11px; font-weight: 700; }
    .td-note svg { width: 11px; height: 11px; }
    .td-comment-body p { font-size: 14px; line-height: 1.55; color: #334155; white-space: pre-wrap; overflow-wrap: anywhere; }

    .td-compose { margin-top: 8px; padding-top: 16px; border-top: 1px solid #F1F5F9; }
    .td-compose textarea, .td-form textarea, .td-form input, .td-input {
      width: 100%; padding: 11px 14px; border-radius: 14px; border: 1px solid #E2E8F0; background: #F8FAFC;
      font: inherit; font-size: 14px; color: #0F172A; outline: none; resize: vertical; line-height: 1.5;
      transition: border-color .15s, box-shadow .15s, background .15s;
    }
    .td-compose textarea:focus, .td-form textarea:focus, .td-form input:focus, .td-input:focus {
      background: #fff; border-color: #818CF8; box-shadow: 0 0 0 4px rgba(99,102,241,.13);
    }
    .td-compose-bar { display: flex; align-items: center; justify-content: space-between; gap: 12px; flex-wrap: wrap; margin-top: 10px; }
    .td-check { display: inline-flex; align-items: center; gap: 9px; margin: 0; font-size: 13px; font-weight: 600; color: #334155; cursor: pointer; }
    .td-check input { width: 17px; height: 17px; accent-color: #D97706; }
    .td-check small { font-weight: 500; color: #94A3B8; }
    .td-btn-primary { display: inline-flex; align-items: center; gap: 8px; width: auto; margin: 0 0 0 auto; padding: 10px 18px; border: 0; border-radius: 12px; font: inherit; font-size: 13.5px; font-weight: 600; color: #fff; cursor: pointer; background: linear-gradient(120deg, #4F46E5, #0D9488); box-shadow: 0 6px 14px rgba(79,70,229,.25); transition: transform .15s; }
    .td-btn-primary svg { width: 15px; height: 15px; }
    .td-btn-primary:hover:not(:disabled) { transform: translateY(-1px); }
    .td-btn-primary:disabled { opacity: .45; cursor: not-allowed; box-shadow: none; }

    /* ── Interventions ── */
    .td-interv { padding: 14px 16px; margin-bottom: 12px; border-radius: 16px; border: 1px solid #E2E8F0; border-left: 4px solid #0D9488; background: #F8FAFC; }
    .td-interv-h { display: flex; align-items: center; gap: 10px; flex-wrap: wrap; margin-bottom: 8px; font-size: 13.5px; }
    .td-interv-h small { margin-left: auto; color: #94A3B8; font-size: 11.5px; }
    .td-time { padding: 2px 9px; border-radius: 999px; background: #CCFBF1; color: #0F766E; font-size: 11.5px; font-weight: 700; }
    .td-interv p { font-size: 13.5px; line-height: 1.55; color: #334155; margin-top: 4px; }
    .td-interv p span { display: block; font-size: 11px; font-weight: 700; letter-spacing: .5px; text-transform: uppercase; color: #94A3B8; }

    .td-form { margin-top: 10px; padding: 18px; border-radius: 16px; background: linear-gradient(180deg, #F8F9FF, #fff); border: 1px solid #C7D2FE; }
    .td-field { margin-bottom: 14px; }
    .td-field label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #1E293B; }
    .req { color: #E11D48; }
    .td-cols { display: grid; grid-template-columns: 1fr 1fr; gap: 14px; }
    @media (max-width: 600px) { .td-cols { grid-template-columns: 1fr; } }
    .td-btn-teal { width: auto; margin: 0; padding: 10px 18px; border: 0; border-radius: 12px; font: inherit; font-size: 13.5px; font-weight: 600; color: #fff; cursor: pointer; background: #0D9488; transition: all .15s; }
    .td-btn-teal:hover:not(:disabled) { background: #0F766E; }
    .td-btn-teal:disabled { opacity: .45; cursor: not-allowed; }

    /* ── Actions ── */
    .td-actions { border-color: #C7D2FE; background: linear-gradient(180deg, #F8F9FF, #fff); }
    .td-actions label { display: block; margin-bottom: 6px; font-size: 13px; font-weight: 600; color: #1E293B; }
    .td-assign { margin-bottom: 4px; }
    .td-input { margin-bottom: 10px; }
    select.td-input {
      appearance: none; -webkit-appearance: none; cursor: pointer; padding-right: 40px;
      background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      background-repeat: no-repeat; background-position: right 12px center; background-size: 16px;
    }
    .td-act { display: block; width: 100%; margin: 0 0 10px; padding: 11px 16px; border: 0; border-radius: 12px; font: inherit; font-size: 13.5px; font-weight: 600; cursor: pointer; transition: all .15s; }
    .td-act:disabled { opacity: .45; cursor: not-allowed; }
    .td-act.primary { color: #fff; background: linear-gradient(120deg, #4F46E5, #6366F1); box-shadow: 0 6px 14px rgba(79,70,229,.25); }
    .td-act.teal { color: #fff; background: #0D9488; }
    .td-act.warn { color: #92400E; background: #FEF3C7; }
    .td-act.danger { color: #B91C1C; background: #FEE2E2; }
    .td-act:hover:not(:disabled) { transform: translateY(-1px); filter: brightness(.96); }
    .td-sep { display: flex; align-items: center; gap: 10px; margin: 6px 0 12px; color: #94A3B8; font-size: 11.5px; font-weight: 700; letter-spacing: .6px; text-transform: uppercase; }
    .td-sep::before, .td-sep::after { content: ''; flex: 1; height: 1px; background: #E2E8F0; }

    /* ── Chronologie ── */
    .td-timeline { position: relative; padding-left: 22px; }
    .td-timeline::before { content: ''; position: absolute; left: 6px; top: 6px; bottom: 6px; width: 2px; background: linear-gradient(180deg, #C7D2FE, #99F6E4); border-radius: 2px; }
    .td-step { position: relative; padding-bottom: 16px; }
    .td-step:last-child { padding-bottom: 0; }
    .td-step-dot { position: absolute; left: -22px; top: 3px; width: 14px; height: 14px; border-radius: 50%; background: #fff; border: 3px solid #4F46E5; }
    .td-step:first-child .td-step-dot { background: #4F46E5; box-shadow: 0 0 0 4px rgba(79,70,229,.15); }
    .td-step-h { display: flex; justify-content: space-between; gap: 8px; font-size: 13px; }
    .td-step-h b { color: #0F172A; }
    .td-step-h small { color: #94A3B8; font-size: 11.5px; white-space: nowrap; }
    .td-step-sub { margin-top: 2px; font-size: 12px; color: #64748B; }
    .td-step-det { margin-top: 5px; padding: 7px 10px; border-radius: 10px; background: #F8FAFC; color: #475569; font-size: 12.5px; line-height: 1.45; overflow-wrap: anywhere; }
  `],
})
export class TicketDetailComponent implements OnInit {
  private route = inject(ActivatedRoute);
  api = inject(TicketService);
  auth = inject(AuthService);

  detail?: TicketDetail;
  interventions: Intervention[] = [];
  technicians: User[] = [];
  error = '';

  commentText = '';
  isInternal = false;
  solution = '';
  reopenMotif = '';
  selectedTechId: number | null = null;
  iv = { diagnostic: '', actions: '', tempsPasseMinutes: 0 };

  private statutLabels: Record<string, string> = {
    OUVERT: 'Ouvert', AFFECTE: 'Affecté', EN_COURS: 'En cours', EN_ATTENTE: 'En attente',
    RESOLU: 'Résolu', CLOTURE: 'Clôturé', ANNULE: 'Annulé',
  };
  private prioLabels: Record<string, string> = { BASSE: 'Basse', MOYENNE: 'Moyenne', HAUTE: 'Haute', CRITIQUE: 'Critique' };
  private roleLabels: Record<string, string> = {
    EMPLOYE: 'Employé', TECHNICIEN: 'Technicien', IT_MANAGER: 'Responsable IT', ADMIN: 'Administrateur',
  };

  get role() { return this.auth.currentUser()?.role; }
  get me() { return this.auth.currentUser(); }
  get isOpen() { const s = this.detail?.ticket.statut; return s !== 'CLOTURE' && s !== 'ANNULE'; }
  get isCreator() { return this.detail?.ticket.createurId === this.me?.id; }
  get isSupervisor() { return this.role === 'IT_MANAGER' || this.role === 'ADMIN'; }
  get isMyTech() { return this.role === 'TECHNICIEN' && this.detail?.ticket.technicienId === this.me?.id; }
  get canSupCancel() {
    const s = this.detail?.ticket.statut;
    return s === 'AFFECTE' || (s === 'OUVERT' && !this.isCreator);
  }
  /** Évite d'afficher une carte « Actions » vide (ex. employé sur un ticket en cours). */
  get hasActions() {
    const s = this.detail?.ticket.statut;
    if (this.isSupervisor) return true;
    if (this.isCreator && (s === 'OUVERT' || s === 'RESOLU')) return true;
    if (this.isMyTech && (s === 'AFFECTE' || s === 'EN_COURS' || s === 'EN_ATTENTE')) return true;
    return false;
  }

  statutLabel(s: string) { return this.statutLabels[s] ?? s; }
  prioLabel(p: string) { return this.prioLabels[p] ?? p; }
  roleLabel(r: string) { return this.roleLabels[r] ?? r; }
  initials(name: string) {
    return name.split(' ').filter(Boolean).slice(0, 2).map((w) => w[0].toUpperCase()).join('');
  }
  fileSize(bytes: number) {
    if (!bytes) return '';
    return bytes < 1024 * 1024 ? `${Math.max(1, Math.round(bytes / 1024))} Ko` : `${(bytes / 1048576).toFixed(1)} Mo`;
  }

  ngOnInit() {
    this.load();
    if (this.isSupervisor) {
      this.api.getUsers().subscribe((u) => (this.technicians = u.filter((x) => x.role === 'TECHNICIEN' && x.actif)));
    }
  }

  load() {
    const id = Number(this.route.snapshot.paramMap.get('id'));
    this.api.getById(id).subscribe({
      next: (d) => {
        this.detail = d;
        this.selectedTechId = d.ticket.technicienId ?? null;
        this.solution = d.ticket.solutionAppliquee ?? '';
      },
      error: (e) => (this.error = e.error?.message || 'Ticket introuvable.'),
    });
    if (this.role !== 'EMPLOYE') {
      this.api.getInterventions(id).subscribe({ next: (l) => (this.interventions = l), error: () => (this.interventions = []) });
    }
  }

  /** Exécute une action puis recharge le ticket ; affiche le message du backend en cas de refus. */
  run(action: Observable<unknown>) {
    this.error = '';
    action.subscribe({
      next: () => this.load(),
      error: (e) => (this.error = e.error?.message || 'Action impossible.'),
    });
  }

  postComment() {
    if (!this.detail) return;
    this.run(this.api.addComment(this.detail.ticket.id, this.commentText, this.isInternal));
    this.commentText = '';
    this.isInternal = false;
  }

  addIntervention() {
    if (!this.detail) return;
    this.run(this.api.addIntervention(this.detail.ticket.id, { ...this.iv, tempsPasseMinutes: Number(this.iv.tempsPasseMinutes) || 0 }));
    this.iv = { diagnostic: '', actions: '', tempsPasseMinutes: 0 };
  }

  download(a: { id: number; nomFichier: string }) {
    this.api.downloadAttachment(a.id).subscribe((blob) => {
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.download = a.nomFichier;
      link.click();
      URL.revokeObjectURL(url);
    });
  }
}