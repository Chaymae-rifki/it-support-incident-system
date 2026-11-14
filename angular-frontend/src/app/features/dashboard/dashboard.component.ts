import { AfterViewInit, Component, ElementRef, OnInit, ViewChild, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Chart, registerables } from 'chart.js';
import { TicketService } from '../../core/services/ticket.service';
import { DashboardStats } from '../../models/models';

Chart.register(...registerables);

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div *ngIf="stats" class="space-y-6">
      <div>
        <h1 class="text-2xl font-semibold text-slate-900">
          {{ stats.scope === 'GLOBAL' ? 'Supervision du service informatique' : 'Activité personnelle' }}
        </h1>
        <p class="text-sm text-slate-500 mt-1">Indicateurs de performance et répartition des incidents.</p>
      </div>

      <section class="bg-white border border-slate-200 rounded-2xl grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 divide-y sm:divide-y-0 sm:divide-x divide-slate-100">
        <div class="p-6">
          <span class="text-xs font-medium text-slate-500">Incidents ouverts</span>
          <div class="mt-2 font-mono text-3xl font-semibold text-slate-900">{{ stats.ouverts }}</div>
          <p class="mt-2 text-xs text-slate-500">{{ stats.enCours }} en cours de traitement</p>
        </div>
        <div class="p-6">
          <span class="text-xs font-medium text-slate-500">Résolus & clôturés</span>
          <div class="mt-2 font-mono text-3xl font-semibold text-teal-700">{{ stats.resolus + stats.clotures }}</div>
          <p class="mt-2 text-xs text-slate-500">Sur {{ stats.total }} tickets créés</p>
        </div>
        <div class="p-6">
          <span class="text-xs font-medium text-slate-500">Temps moyen résolution</span>
          <div class="mt-2 font-mono text-3xl font-semibold text-indigo-700">{{ stats.tempsMoyenResolutionHeures }} h</div>
          <p class="mt-2 text-xs text-slate-500">Calculé entre création et résolution</p>
        </div>
        <div class="p-6">
          <span class="text-xs font-medium text-slate-500">Taux de résolution</span>
          <div class="mt-2 font-mono text-3xl font-semibold text-slate-900">{{ stats.tauxResolutionPourcent }}%</div>
          <div class="mt-3 h-1.5 bg-slate-100 rounded-full overflow-hidden">
            <div class="h-full bg-teal-600" [style.width.%]="stats.tauxResolutionPourcent"></div>
          </div>
        </div>
      </section>

      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 class="font-semibold text-slate-900 mb-4">Répartition par catégorie</h2>
          <canvas #catCanvas height="220"></canvas>
        </div>
        <div class="bg-white border border-slate-200 rounded-2xl p-6">
          <h2 class="font-semibold text-slate-900 mb-4">Répartition par priorité</h2>
          <canvas #prioCanvas height="220"></canvas>
        </div>
      </div>
    </div>
  `,
})
export class DashboardComponent implements OnInit, AfterViewInit {
  private ticketService = inject(TicketService);
  @ViewChild('catCanvas') catCanvas?: ElementRef<HTMLCanvasElement>;
  @ViewChild('prioCanvas') prioCanvas?: ElementRef<HTMLCanvasElement>;
  stats?: DashboardStats;

  ngOnInit() {
    this.ticketService.getDashboardStats().subscribe((data) => {
      this.stats = data;
      setTimeout(() => this.renderCharts(), 0);
    });
  }

  ngAfterViewInit() {
    this.renderCharts();
  }

  private renderCharts() {
    if (!this.stats || !this.catCanvas || !this.prioCanvas) return;

    new Chart(this.catCanvas.nativeElement, {
      type: 'doughnut',
      data: {
        labels: this.stats.parCategorie.map((c) => c.label),
        datasets: [
          {
            data: this.stats.parCategorie.map((c) => c.count),
            backgroundColor: ['#4F46E5', '#0D9488', '#D97706', '#0284C7', '#64748B'],
          },
        ],
      },
      options: { cutout: '68%' },
    });

    new Chart(this.prioCanvas.nativeElement, {
      type: 'bar',
      data: {
        labels: this.stats.parPriorite.map((p) => p.label),
        datasets: [
          {
            label: 'Tickets',
            data: this.stats.parPriorite.map((p) => p.count),
            backgroundColor: ['#94A3B8', '#4F46E5', '#F59E0B', '#E11D48'],
            borderRadius: 6,
          },
        ],
      },
    });
  }
}
