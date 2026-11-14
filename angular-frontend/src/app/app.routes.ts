import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  {
    path: 'login',
    loadComponent: () => import('./features/auth/login.component').then(m => m.LoginComponent),
  },
  {
    path: 'dashboard',
    canActivate: [authGuard, roleGuard(['ADMIN', 'TECHNICIEN'])],
    loadComponent: () => import('./features/dashboard/dashboard.component').then(m => m.DashboardComponent),
  },
  {
    path: 'tickets',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-list.component').then(m => m.TicketListComponent),
  },
  {
    path: 'tickets/new',
    canActivate: [authGuard, roleGuard(['EMPLOYE'])],
    loadComponent: () => import('./features/tickets/ticket-create.component').then(m => m.TicketCreateComponent),
  },
  {
    path: 'tickets/:id',
    canActivate: [authGuard],
    loadComponent: () => import('./features/tickets/ticket-detail.component').then(m => m.TicketDetailComponent),
  },
  {
    path: 'admin',
    canActivate: [authGuard, roleGuard(['ADMIN'])],
    loadComponent: () => import('./features/admin/admin.component').then(m => m.AdminComponent),
  },
  {
    path: 'notifications',
    canActivate: [authGuard],
    loadComponent: () => import('./features/notifications/notifications.component').then(m => m.NotificationsComponent),
  },
  { path: '', redirectTo: 'tickets', pathMatch: 'full' },
];
