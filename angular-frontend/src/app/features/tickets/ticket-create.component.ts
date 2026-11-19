import { Component, OnInit, inject } from "@angular/core";
import { CommonModule } from "@angular/common";
import { FormBuilder, ReactiveFormsModule, Validators } from "@angular/forms";
import { Router, RouterModule } from "@angular/router";
import { TicketService } from "../../core/services/ticket.service";
import { Asset, Category } from "../../models/models";

@Component({
  selector: "app-ticket-create",
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterModule],
  template: `
    <!-- En-tête -->
    <div class="tc-head">
      <a routerLink="/tickets" class="tc-back" aria-label="Retour">
        <svg
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          stroke-width="2.2"
          stroke-linecap="round"
          stroke-linejoin="round"
        >
          <path d="m15 18-6-6 6-6" />
        </svg>
      </a>
      <div>
        <h1 class="tc-title">Créer un ticket d'incident</h1>
        <p class="tc-sub">
          Décrivez le problème : le service informatique le prendra en charge.
        </p>
      </div>
    </div>

    <div class="tc-layout">
      <!-- Formulaire -->
      <form class="tc-card" [formGroup]="form" (ngSubmit)="submit()">
        <div class="tc-error" *ngIf="error">
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            stroke-width="2"
            stroke-linecap="round"
            stroke-linejoin="round"
          >
            <circle cx="12" cy="12" r="10" />
            <path d="M12 8v4" />
            <path d="M12 16h.01" />
          </svg>
          {{ error }}
        </div>

        <!-- Titre -->
        <div class="tc-field">
          <label>Titre <span class="req">*</span></label>
          <input
            formControlName="titre"
            maxlength="150"
            placeholder="Ex : L'ordinateur portable ne démarre plus"
            [class.invalid]="invalid('titre')"
          />
          <div class="tc-row">
            <small class="tc-err" *ngIf="invalid('titre')"
              >Le titre est obligatoire.</small
            >
            <small class="tc-counter"
              >{{ form.value.titre?.length || 0 }}/150</small
            >
          </div>
        </div>

        <!-- Catégorie + équipement -->
        <div class="tc-cols">
          <div class="tc-field">
            <label>Catégorie <span class="req">*</span></label>
            <select formControlName="categoryId">
              <option *ngFor="let c of categories" [ngValue]="c.id">
                {{ c.nom }}
              </option>
            </select>
          </div>
          <div class="tc-field" *ngIf="assets.length">
            <label
              >Équipement concerné <span class="opt">(optionnel)</span></label
            >
            <select formControlName="assetId">
              <option [ngValue]="null">Aucun</option>
              <option *ngFor="let a of assets" [ngValue]="a.id">
                {{ a.codeInventaire }} · {{ a.nom }}
              </option>
            </select>
          </div>
        </div>

        <!-- Priorité (cartes cliquables) -->
        <div class="tc-field">
          <label>Priorité <span class="req">*</span></label>
          <div class="tc-prios">
            <button
              type="button"
              *ngFor="let p of priorites"
              class="tc-prio"
              [ngClass]="'pr-' + p.value"
              [class.on]="form.value.priorite === p.value"
              (click)="form.patchValue({ priorite: p.value })"
            >
              <span class="tc-dot"></span>
              <b>{{ p.label }}</b>
              <small>{{ p.hint }}</small>
            </button>
          </div>
        </div>

        <!-- Description -->
        <div class="tc-field">
          <label>Description <span class="req">*</span></label>
          <textarea
            formControlName="description"
            rows="6"
            maxlength="2000"
            placeholder="Que s'est-il passé ? Depuis quand ? Messages d'erreur éventuels..."
            [class.invalid]="invalid('description')"
          ></textarea>
          <div class="tc-row">
            <small class="tc-err" *ngIf="invalid('description')"
              >La description est obligatoire.</small
            >
            <small class="tc-counter"
              >{{ form.value.description?.length || 0 }}/2000</small
            >
          </div>
        </div>

        <!-- Pièce jointe -->
        <div class="tc-field">
          <label>Pièce jointe <span class="opt">(optionnel)</span></label>

          <label
            class="tc-drop"
            *ngIf="!file"
            [class.drag]="dragging"
            (dragover)="$event.preventDefault(); dragging = true"
            (dragleave)="dragging = false"
            (drop)="onDrop($event)"
          >
            <input
              type="file"
              hidden
              (change)="onFile($event)"
              accept=".png,.jpg,.jpeg,.pdf,.txt,.log,.docx,.xlsx"
            />
            <div class="tc-drop-ico">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path d="M21 15v4a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2v-4" />
                <path d="m17 8-5-5-5 5" />
                <path d="M12 3v12" />
              </svg>
            </div>
            <div><b>Cliquez pour choisir</b> ou glissez un fichier ici</div>
            <small>PNG, JPG, PDF, TXT, LOG, DOCX, XLSX</small>
          </label>

          <div class="tc-file" *ngIf="file">
            <div class="tc-file-ico">
              <svg
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                stroke-width="1.8"
                stroke-linecap="round"
                stroke-linejoin="round"
              >
                <path
                  d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5z"
                />
                <path d="M14 2v6h6" />
              </svg>
            </div>
            <div class="tc-file-info">
              <b>{{ file.name }}</b>
              <small>{{ size(file.size) }}</small>
            </div>
            <button
              type="button"
              class="tc-file-x"
              (click)="removeFile()"
              aria-label="Retirer"
            >
              ×
            </button>
          </div>
        </div>

        <!-- Actions -->
        <div class="tc-actions">
          <a routerLink="/tickets" class="tc-cancel">Annuler</a>
          <button
            type="submit"
            class="tc-submit"
            [disabled]="form.invalid || sending"
          >
            <span class="tc-spin" *ngIf="sending"></span>
            {{ sending ? "Envoi en cours..." : "Soumettre le ticket" }}
          </button>
        </div>
      </form>

      <!-- Panneau d'aide -->
      <aside class="tc-aside">
        <div class="tc-tip">
          <h3>Pour un traitement rapide</h3>
          <ul>
            <li>Soyez précis dans le titre.</li>
            <li>Indiquez depuis quand le problème existe.</li>
            <li>Joignez une capture d'écran de l'erreur.</li>
            <li>Choisissez la priorité selon l'impact réel.</li>
          </ul>
        </div>
        <div class="tc-sla">
          <h3>Délais de résolution cibles</h3>
          <div><span class="tc-dot d-c"></span>Critique<b>4 h</b></div>
          <div><span class="tc-dot d-h"></span>Haute<b>8 h</b></div>
          <div><span class="tc-dot d-m"></span>Moyenne<b>24 h</b></div>
          <div><span class="tc-dot d-b"></span>Basse<b>72 h</b></div>
        </div>
      </aside>
    </div>
  `,
  styles: [
    `
      :host {
        display: block;
      }

      /* ── En-tête ── */
      .tc-head {
        display: flex;
        align-items: center;
        gap: 14px;
        margin-bottom: 20px;
      }
      .tc-back {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        border: 1px solid #e2e8f0;
        background: #fff;
        color: #475569;
        display: grid;
        place-items: center;
        transition: all 0.15s;
        flex-shrink: 0;
      }
      .tc-back:hover {
        background: #4f46e5;
        border-color: #4f46e5;
        color: #fff;
      }
      .tc-back svg {
        width: 18px;
        height: 18px;
      }
      .tc-title {
        font-size: 26px;
        font-weight: 700;
        letter-spacing: -0.3px;
        color: #0f172a;
      }
      .tc-sub {
        margin-top: 3px;
        font-size: 13.5px;
        color: #64748b;
      }

      .tc-layout {
        display: grid;
        grid-template-columns: minmax(0, 1fr) 320px;
        gap: 20px;
        align-items: start;
      }
      @media (max-width: 1050px) {
        .tc-layout {
          grid-template-columns: 1fr;
        }
      }

      /* ── Carte formulaire ── */
      .tc-card {
        background: #fff;
        border: 1px solid #e2e8f0;
        border-radius: 22px;
        padding: 26px;
        box-shadow: 0 1px 2px rgba(15, 23, 42, 0.04);
      }
      .tc-error {
        display: flex;
        align-items: center;
        gap: 10px;
        padding: 12px 14px;
        margin-bottom: 18px;
        border-radius: 14px;
        background: #fff1f2;
        border: 1px solid #fecdd3;
        color: #be123c;
        font-size: 13.5px;
      }
      .tc-error svg {
        width: 18px;
        height: 18px;
        flex-shrink: 0;
      }

      .tc-field {
        margin-bottom: 20px;
      }
      .tc-field > label {
        display: block;
        margin-bottom: 7px;
        font-size: 13px;
        font-weight: 600;
        color: #1e293b;
      }
      .req {
        color: #e11d48;
      }
      .opt {
        color: #94a3b8;
        font-weight: 500;
      }
      .tc-cols {
        display: grid;
        grid-template-columns: 1fr 1fr;
        gap: 16px;
      }
      @media (max-width: 700px) {
        .tc-cols {
          grid-template-columns: 1fr;
        }
      }

      .tc-field input:not([type="file"]),
      .tc-field select,
      .tc-field textarea {
        width: 100%;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid #e2e8f0;
        background: #f8fafc;
        font: inherit;
        font-size: 14px;
        color: #0f172a;
        outline: none;
        transition:
          border-color 0.15s,
          box-shadow 0.15s,
          background 0.15s;
      }
      /* Flèche personnalisée des listes déroulantes */
      .tc-field select {
        appearance: none;
        -webkit-appearance: none;
        -moz-appearance: none;
        cursor: pointer;
        padding-right: 40px;
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%2364748B' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
        background-repeat: no-repeat;
        background-position: right 12px center;
        background-size: 16px;
      }
      .tc-field select:focus {
        background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='16' viewBox='0 0 24 24' fill='none' stroke='%234F46E5' stroke-width='2.4' stroke-linecap='round' stroke-linejoin='round'%3E%3Cpath d='m6 9 6 6 6-6'/%3E%3C/svg%3E");
      }
      .tc-field textarea {
        resize: vertical;
        min-height: 130px;
        line-height: 1.5;
      }
      .tc-field input::placeholder,
      .tc-field textarea::placeholder {
        color: #94a3b8;
      }
      .tc-field input:focus,
      .tc-field select:focus,
      .tc-field textarea:focus {
        background: #fff;
        border-color: #818cf8;
        box-shadow: 0 0 0 4px rgba(99, 102, 241, 0.13);
      }
      .tc-field .invalid {
        border-color: #fda4af;
        background: #fff8f8;
      }
      .tc-row {
        display: flex;
        justify-content: space-between;
        margin-top: 5px;
        min-height: 16px;
      }
      .tc-err {
        color: #e11d48;
        font-size: 12px;
      }
      .tc-counter {
        margin-left: auto;
        color: #94a3b8;
        font-size: 12px;
      }

      /* ── Priorité ── */
      .tc-prios {
        display: grid;
        grid-template-columns: repeat(4, 1fr);
        gap: 10px;
      }
      @media (max-width: 700px) {
        .tc-prios {
          grid-template-columns: 1fr 1fr;
        }
      }
      .tc-prio {
        display: flex;
        flex-direction: column;
        align-items: flex-start;
        gap: 3px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1.5px solid #e2e8f0;
        background: #fff;
        font: inherit;
        text-align: left;
        cursor: pointer;
        transition: all 0.15s;
        margin: 0;
        width: auto;
      }
      .tc-prio b {
        font-size: 13.5px;
        color: #1e293b;
      }
      .tc-prio small {
        font-size: 11.5px;
        color: #94a3b8;
      }
      .tc-prio:hover {
        border-color: #c7d2fe;
        transform: translateY(-1px);
      }
      .tc-dot {
        width: 9px;
        height: 9px;
        border-radius: 50%;
        display: inline-block;
      }
      .pr-BASSE .tc-dot,
      .d-b {
        background: #22c55e;
      }
      .pr-MOYENNE .tc-dot,
      .d-m {
        background: #f59e0b;
      }
      .pr-HAUTE .tc-dot,
      .d-h {
        background: #f97316;
      }
      .pr-CRITIQUE .tc-dot,
      .d-c {
        background: #e11d48;
      }
      .pr-BASSE.on {
        border-color: #22c55e;
        background: #f0fdf4;
      }
      .pr-MOYENNE.on {
        border-color: #f59e0b;
        background: #fffbeb;
      }
      .pr-HAUTE.on {
        border-color: #f97316;
        background: #fff7ed;
      }
      .pr-CRITIQUE.on {
        border-color: #e11d48;
        background: #fff1f2;
      }

      /* ── Zone de dépôt ── */
      .tc-drop {
        display: flex;
        flex-direction: column;
        align-items: center;
        gap: 4px;
        text-align: center;
        padding: 26px 16px;
        border: 2px dashed #cbd5e1;
        border-radius: 16px;
        background: #f8fafc;
        color: #475569;
        font-size: 13.5px;
        cursor: pointer;
        transition: all 0.15s;
      }
      .tc-drop b {
        color: #4f46e5;
      }
      .tc-drop small {
        color: #94a3b8;
        font-size: 12px;
      }
      .tc-drop:hover,
      .tc-drop.drag {
        border-color: #818cf8;
        background: #f5f7ff;
      }
      .tc-drop-ico {
        width: 46px;
        height: 46px;
        border-radius: 14px;
        background: #eef2ff;
        color: #4f46e5;
        display: grid;
        place-items: center;
        margin-bottom: 4px;
      }
      .tc-drop-ico svg {
        width: 22px;
        height: 22px;
      }

      .tc-file {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px 14px;
        border-radius: 14px;
        border: 1px solid #c7d2fe;
        background: #f5f7ff;
      }
      .tc-file-ico {
        width: 40px;
        height: 40px;
        border-radius: 12px;
        background: #fff;
        color: #4f46e5;
        display: grid;
        place-items: center;
        flex-shrink: 0;
      }
      .tc-file-ico svg {
        width: 20px;
        height: 20px;
      }
      .tc-file-info {
        flex: 1;
        min-width: 0;
        display: flex;
        flex-direction: column;
      }
      .tc-file-info b {
        font-size: 13.5px;
        color: #1e293b;
        overflow: hidden;
        text-overflow: ellipsis;
        white-space: nowrap;
      }
      .tc-file-info small {
        color: #64748b;
        font-size: 12px;
      }
      .tc-file-x {
        width: 28px;
        height: 28px;
        padding: 0;
        margin: 0;
        border: 0;
        border-radius: 50%;
        background: #e2e8f0;
        color: #475569;
        font-size: 17px;
        line-height: 1;
        cursor: pointer;
      }
      .tc-file-x:hover {
        background: #fecdd3;
        color: #be123c;
      }

      /* ── Actions ── */
      .tc-actions {
        display: flex;
        justify-content: flex-end;
        align-items: center;
        gap: 12px;
        margin-top: 8px;
        padding-top: 20px;
        border-top: 1px solid #f1f5f9;
      }
      .tc-cancel {
        padding: 11px 18px;
        border-radius: 14px;
        font-weight: 600;
        font-size: 13.5px;
        color: #475569;
        background: #f1f5f9;
      }
      .tc-cancel:hover {
        background: #e2e8f0;
      }
      .tc-submit {
        display: inline-flex;
        align-items: center;
        gap: 9px;
        width: auto;
        margin: 0;
        padding: 11px 22px;
        border: 0;
        border-radius: 14px;
        font: inherit;
        font-size: 13.5px;
        font-weight: 600;
        color: #fff;
        cursor: pointer;
        background: linear-gradient(120deg, #4f46e5, #0d9488);
        box-shadow: 0 8px 18px rgba(79, 70, 229, 0.28);
        transition:
          transform 0.15s,
          box-shadow 0.15s;
      }
      .tc-submit:hover:not(:disabled) {
        transform: translateY(-1px);
        box-shadow: 0 10px 22px rgba(79, 70, 229, 0.35);
      }
      .tc-submit:disabled {
        opacity: 0.5;
        cursor: not-allowed;
        box-shadow: none;
      }
      .tc-spin {
        width: 14px;
        height: 14px;
        border-radius: 50%;
        border: 2px solid rgba(255, 255, 255, 0.4);
        border-top-color: #fff;
        animation: tc-spin 0.7s linear infinite;
      }
      @keyframes tc-spin {
        to {
          transform: rotate(360deg);
        }
      }

      /* ── Panneau d'aide ── */
      .tc-aside {
        display: flex;
        flex-direction: column;
        gap: 14px;
      }
      .tc-tip,
      .tc-sla {
        border-radius: 20px;
        padding: 20px;
      }
      .tc-tip {
        background: linear-gradient(135deg, #3730a3, #0d9488);
        color: #fff;
      }
      .tc-tip h3,
      .tc-sla h3 {
        font-size: 14.5px;
        font-weight: 700;
        margin-bottom: 12px;
      }
      .tc-tip ul {
        margin: 0;
        padding-left: 18px;
        font-size: 13px;
        line-height: 1.7;
        color: #e0e7ff;
      }
      .tc-sla {
        background: #fef3e2;
        border: 1px solid #fbe3c0;
        color: #0f172a;
      }
      .tc-sla div {
        display: flex;
        align-items: center;
        gap: 9px;
        padding: 7px 0;
        font-size: 13px;
        border-bottom: 1px dashed #f3d5a5;
      }
      .tc-sla div:last-child {
        border-bottom: 0;
      }
      .tc-sla b {
        margin-left: auto;
      }
    `,
  ],
})
export class TicketCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private api = inject(TicketService);
  private router = inject(Router);

  categories: Category[] = [];
  assets: Asset[] = [];
  file?: File;
  dragging = false;
  error = "";
  sending = false;

  priorites = [
    { value: "BASSE", label: "Basse", hint: "Pas urgent" },
    { value: "MOYENNE", label: "Moyenne", hint: "Gêne partielle" },
    { value: "HAUTE", label: "Haute", hint: "Travail bloqué" },
    { value: "CRITIQUE", label: "Critique", hint: "Service à l’arrêt" },
  ];

  form = this.fb.group({
    titre: ["", Validators.required],
    categoryId: [null as number | null, Validators.required],
    priorite: ["MOYENNE", Validators.required],
    assetId: [null as number | null],
    description: ["", Validators.required],
  });

  ngOnInit() {
    this.api.getCategories().subscribe((c) => {
      this.categories = c;
      if (c.length) this.form.patchValue({ categoryId: c[0].id });
    });
    this.api
      .getMyAssets()
      .subscribe({ next: (a) => (this.assets = a), error: () => {} });
  }

  invalid(name: string) {
    const c = this.form.get(name);
    return !!c && c.invalid && c.touched;
  }

  onFile(e: Event) {
    const input = e.target as HTMLInputElement;
    this.setFile(input.files?.[0]);
    input.value = "";
  }

  onDrop(e: DragEvent) {
    e.preventDefault();
    this.dragging = false;
    this.setFile(e.dataTransfer?.files?.[0]);
  }

  private setFile(f?: File) {
    if (!f) return;
    if (f.size > 8 * 1024 * 1024) {
      this.error = "Le fichier dépasse 8 Mo.";
      return;
    }
    this.error = "";
    this.file = f;
  }

  removeFile() {
    this.file = undefined;
  }

  size(bytes: number) {
    return bytes < 1024 * 1024
      ? `${Math.max(1, Math.round(bytes / 1024))} Ko`
      : `${(bytes / 1048576).toFixed(1)} Mo`;
  }

  submit() {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.value;
    this.sending = true;
    this.error = "";
    this.api
      .createTicket(
        {
          titre: v.titre!.trim(),
          description: v.description!.trim(),
          categoryId: v.categoryId!,
          priorite: v.priorite!,
          assetId: v.assetId,
        },
        this.file,
      )
      .subscribe({
        next: (t) => this.router.navigate(["/tickets", t.id]),
        error: (e) => {
          this.sending = false;
          this.error = e.error?.message || "Création impossible.";
        },
      });
  }
}
