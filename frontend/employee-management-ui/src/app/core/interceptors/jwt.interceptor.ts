import { inject } from '@angular/core';
import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const jwtInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const token = authService.getToken();

  // Attach JWT token to every outgoing request if available
  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
  }

  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      // If backend responds with 401 Unauthorized, token is expired or invalid.
      // Auto-logout the user and redirect them to login.
      if (error.status === 401) {
        authService.logout();
        router.navigate(['/login']);
      }
      // Re-throw so individual components can still handle other errors
      return throwError(() => error);
    })
  );
};
