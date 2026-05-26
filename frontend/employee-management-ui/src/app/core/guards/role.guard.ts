import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../services/auth.service';
import { ToastService } from '../services/toast.service';

export const roleGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);
  const toastService = inject(ToastService);

  const expectedRoles = route.data['roles'] as Array<string>;
  const currentUser = authService.currentUserValue;

  if (currentUser && expectedRoles.includes(currentUser.role)) {
    return true;
  }

  // Not authorized
  toastService.error('Access Denied. You do not have permission to view this resource.');
  router.navigate(['/dashboard']);
  return false;
};
