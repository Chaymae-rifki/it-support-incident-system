import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import {
  Category,
  DashboardStats,
  NotificationItem,
  Team,
  Ticket,
  TicketDetail,
  User,
} from '../../models/models';

@Injectable({ providedIn: 'root' })
export class TicketService {
  private api = environment.apiUrl;

  constructor(private http: HttpClient) {}

  createTicket(payload: { titre: string; description: string; categoryId: number; priorite: string }, file?: File) {
    const form = new FormData();
    form.append('ticket', new Blob([JSON.stringify(payload)], { type: 'application/json' }));
    if (file) form.append('attachment', file);
    return this.http.post<Ticket>(`${this.api}/tickets`, form);
  }

  getMyTickets(page = 0, size = 10) {
    return this.http.get<{ content: Ticket[]; totalElements: number }>(`${this.api}/tickets/my`, {
      params: new HttpParams().set('page', page).set('size', size),
    });
  }

  getAllTickets(filters: Record<string, string | number>) {
    let params = new HttpParams();
    Object.entries(filters).forEach(([k, v]) => {
      if (v !== '' && v !== null && v !== undefined) params = params.set(k, String(v));
    });
    return this.http.get<{ content: Ticket[]; totalElements: number }>(`${this.api}/tickets`, { params });
  }

  getById(id: number) {
    return this.http.get<TicketDetail>(`${this.api}/tickets/${id}`);
  }

  assign(id: number, technicienId: number | null, teamId: number | null) {
    return this.http.put<Ticket>(`${this.api}/tickets/${id}/assign`, { technicienId, teamId });
  }

  take(id: number) {
    return this.http.put<Ticket>(`${this.api}/tickets/${id}/take`, {});
  }

  updateStatus(id: number, statut: string, solutionAppliquee?: string) {
    return this.http.put<Ticket>(`${this.api}/tickets/${id}/status`, { statut, solutionAppliquee });
  }

  cancel(id: number) {
    return this.http.put<Ticket>(`${this.api}/tickets/${id}/cancel`, {});
  }

  confirm(id: number) {
    return this.http.put<Ticket>(`${this.api}/tickets/${id}/confirm`, {});
  }

  reopen(id: number, motif: string) {
    return this.http.put<Ticket>(`${this.api}/tickets/${id}/reopen`, { motif });
  }

  addComment(id: number, contenu: string, interne: boolean) {
    return this.http.post(`${this.api}/tickets/${id}/comments`, { contenu, interne });
  }

  getDashboardStats() {
    return this.http.get<DashboardStats>(`${this.api}/dashboard/stats`);
  }

  getNotifications() {
    return this.http.get<NotificationItem[]>(`${this.api}/notifications`);
  }

  markNotificationRead(id: number) {
    return this.http.put<NotificationItem>(`${this.api}/notifications/${id}/read`, {});
  }

  getCategories() {
    return this.http.get<Category[]>(`${this.api}/categories`);
  }

  getUsers() {
    return this.http.get<User[]>(`${this.api}/users`);
  }

  getTeams() {
    return this.http.get<Team[]>(`${this.api}/teams`);
  }
}
