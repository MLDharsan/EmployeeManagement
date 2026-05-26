import { Routes } from '@angular/router';
import { authGuard } from './core/guards/auth.guard';
import { roleGuard } from './core/guards/role.guard';

export const routes: Routes = [
  // Authentication Routes
  {
    path: '',
    loadComponent: () => import('./layouts/auth-layout/auth-layout').then(m => m.AuthLayoutComponent),
    children: [
      { path: '', redirectTo: 'login', pathMatch: 'full' },
      {
        path: 'login',
        loadComponent: () => import('./features/auth/login/login').then(m => m.LoginComponent)
      },
      {
        path: 'reset-password',
        loadComponent: () => import('./features/auth/reset-password/reset-password').then(m => m.ResetPasswordComponent)
      }
    ]
  },

  // Main Application Shell Routes
  {
    path: '',
    loadComponent: () => import('./layouts/main-layout/main-layout').then(m => m.MainLayoutComponent),
    canActivate: [authGuard],
    children: [
      { path: '', redirectTo: 'dashboard', pathMatch: 'full' },
      {
        path: 'dashboard',
        loadComponent: () => import('./features/dashboard/dashboard').then(m => m.DashboardComponent)
      },
      // HR/Admin Only Routes
      {
        path: 'employees',
        loadComponent: () => import('./features/employees/employee-list/employee-list').then(m => m.EmployeeListComponent),
        canActivate: [roleGuard],
        data: { roles: ['HR'] }
      },
      {
        path: 'departments',
        loadComponent: () => import('./features/departments/department-list/department-list').then(m => m.DepartmentListComponent),
        canActivate: [roleGuard],
        data: { roles: ['HR'] }
      },
      {
        path: 'levels',
        loadComponent: () => import('./features/levels/level-list/level-list').then(m => m.LevelListComponent),
        canActivate: [roleGuard],
        data: { roles: ['HR'] }
      },
      // Specific employee profile route (accessible to both roles)
      {
        path: 'employees/profile',
        loadComponent: () => import('./features/employees/employee-details/employee-details').then(m => m.EmployeeDetailsComponent)
      },
      {
        path: 'employees/:id',
        loadComponent: () => import('./features/employees/employee-details/employee-details').then(m => m.EmployeeDetailsComponent),
        canActivate: [roleGuard],
        data: { roles: ['HR'] }
      },
      // Shared Routes
      {
        path: 'attendance',
        loadComponent: () => import('./features/attendance/attendance').then(m => m.AttendanceComponent)
      },
      {
        path: 'leave-management',
        loadComponent: () => import('./features/leave-management/leave-management').then(m => m.LeaveManagementComponent)
      },
      {
        path: 'announcements',
        loadComponent: () => import('./features/announcements/announcements').then(m => m.AnnouncementsComponent)
      }
    ]
  },

  // Fallback Route
  { path: '**', redirectTo: 'dashboard' }
];
