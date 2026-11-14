import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap } from 'rxjs';
import { environment } from '../../../environments/environment';
import { User, UserRole } from '../../models/models';

export type { UserRole };

@Injectable({ providedIn: 'root' })
export class AuthService {
  private readonly TOKEN_KEY = 'itsm_jwt';
  currentUser = signal<User | null>(null);

  constructor(private http: HttpClient, private router: Router) {
    const saved = localStorage.getItem('itsm_user');
    if (saved) {
      this.currentUser.set(JSON.parse(saved));
    }
  }

  login(email: string, motDePasse: string) {
    return this.http
      .post<{ token: string; user: User }>(`${environment.apiUrl}/auth/login`, { email, motDePasse })
      .pipe(
        tap((res) => {
          localStorage.setItem(this.TOKEN_KEY, res.token);
          localStorage.setItem('itsm_user', JSON.stringify(res.user));
          this.currentUser.set(res.user);
        })
      );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  logout(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem('itsm_user');
    this.currentUser.set(null);
    this.router.navigate(['/login']);
  }
}
