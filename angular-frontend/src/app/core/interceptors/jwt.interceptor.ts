import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const auth = inject(AuthService);
  const token = auth.getToken();
  const request = token ? req.clone({ setHeaders: { Authorization: `Bearer ${token}` } }) : req;

  return next(request).pipe(
    catchError((err) => {
      // Jeton expiré ou invalide → retour à la connexion
      if (err.status === 401 && !req.url.includes('/auth/login')) auth.logout();
      return throwError(() => err);
    })
  );
};