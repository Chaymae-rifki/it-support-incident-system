import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router } from '@angular/router';
import { TicketService } from '../../core/services/ticket.service';
import { Category } from '../../models/models';

@Component({
  selector: 'app-ticket-create',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  template: `
    <div class="max-w-xl bg-white border rounded-xl p-6 space-y-4">
      <h1 class="text-xl font-semibold">Créer un ticket d'incident</h1>
      <form [formGroup]="form" (ngSubmit)="submit()" class="space-y-4">
        <div>
          <label class="block text-sm font-medium mb-1">Titre *</label>
          <input formControlName="titre" class="w-full px-3 py-2 border rounded-lg" />
        </div>
        <div class="grid grid-cols-2 gap-4">
          <div>
            <label class="block text-sm font-medium mb-1">Catégorie *</label>
            <select formControlName="categoryId" class="w-full px-3 py-2 border rounded-lg">
              <option *ngFor="let c of categories" [value]="c.id">{{ c.nom }}</option>
            </select>
          </div>
          <div>
            <label class="block text-sm font-medium mb-1">Priorité *</label>
            <select formControlName="priorite" class="w-full px-3 py-2 border rounded-lg">
              <option value="BASSE">Basse</option>
              <option value="MOYENNE">Moyenne</option>
              <option value="HAUTE">Haute</option>
              <option value="CRITIQUE">Critique</option>
            </select>
          </div>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Description *</label>
          <textarea formControlName="description" rows="4" class="w-full px-3 py-2 border rounded-lg"></textarea>
        </div>
        <div>
          <label class="block text-sm font-medium mb-1">Pièce jointe (optionnelle)</label>
          <input type="file" (change)="onFileSelected($event)" class="text-sm" />
        </div>
        <button type="submit" [disabled]="form.invalid" class="px-4 py-2 bg-blue-600 text-white rounded-lg">
          Soumettre
        </button>
      </form>
    </div>
  `,
})
export class TicketCreateComponent implements OnInit {
  private fb = inject(FormBuilder);
  private ticketService = inject(TicketService);
  private router = inject(Router);
  categories: Category[] = [];
  selectedFile?: File;

  form = this.fb.group({
    titre: ['', Validators.required],
    categoryId: [1, Validators.required],
    priorite: ['MOYENNE', Validators.required],
    description: ['', Validators.required],
  });

  ngOnInit() {
    this.ticketService.getCategories().subscribe((cats) => (this.categories = cats));
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    this.selectedFile = input.files?.[0];
  }

  submit() {
    if (this.form.invalid) return;
    const val = this.form.value;
    this.ticketService
      .createTicket(
        {
          titre: val.titre!,
          description: val.description!,
          categoryId: Number(val.categoryId),
          priorite: val.priorite!,
        },
        this.selectedFile
      )
      .subscribe((created) => this.router.navigate(['/tickets', created.id]));
  }
}
