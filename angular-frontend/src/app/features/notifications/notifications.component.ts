import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { TicketService } from '../../core/services/ticket.service';
import { NotificationItem } from '../../models/models';

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="space-y-4">
      <h1 class="text-2xl font-semibold">Centre de notifications</h1>
      <div *ngFor="let n of items" class="p-4 bg-white border rounded-xl flex justify-between items-center">
        <span class="text-sm">{{ n.message }}</span>
        <button *ngIf="!n.lue" (click)="markRead(n.id)" class="text-xs text-blue-600">Marquer lue</button>
      </div>
    </div>
  `,
})
export class NotificationsComponent implements OnInit {
  private ticketService = inject(TicketService);
  items: NotificationItem[] = [];

  ngOnInit() {
    this.ticketService.getNotifications().subscribe((res) => (this.items = res));
  }

  markRead(id: number) {
    this.ticketService.markNotificationRead(id).subscribe(() => this.ngOnInit());
  }
}
