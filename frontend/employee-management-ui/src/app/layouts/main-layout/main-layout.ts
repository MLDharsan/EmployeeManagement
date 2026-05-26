import { Component, OnInit, OnDestroy, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatSidenav, MatSidenavModule } from '@angular/material/sidenav';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatBadgeModule } from '@angular/material/badge';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { Subscription, interval, EMPTY } from 'rxjs';
import { catchError } from 'rxjs/operators';
import { AuthService, UserSession } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { Notification } from '../../core/models/notification.model';
import { ToastService } from '../../core/services/toast.service';

interface NavItem {
  label: string;
  icon: string;
  route: string;
  roles?: string[];
}

@Component({
  selector: 'app-main-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatSidenavModule,
    MatToolbarModule,
    MatListModule,
    MatButtonModule,
    MatBadgeModule,
    MatMenuModule,
    MatDividerModule
  ],
  templateUrl: './main-layout.html',
  styleUrls: ['./main-layout.css']
})
export class MainLayoutComponent implements OnInit, OnDestroy {
  @ViewChild('sidenav') sidenav!: MatSidenav;
  
  currentUser: UserSession | null = null;
  unreadCount = 0;
  notifications: Notification[] = [];
  isDarkMode = false;
  isMobile = false;
  private pollSubscription?: Subscription;
  private notifSubscription?: Subscription;

  // Sidebar menus matching the user's specific instruction
  navigationItems: NavItem[] = [
    { label: 'Dashboard', icon: 'bi-grid-1x2-fill', route: '/dashboard' },
    { label: 'Employees', icon: 'bi-people-fill', route: '/employees', roles: ['HR'] },
    { label: 'Departments', icon: 'bi-building-fill', route: '/departments', roles: ['HR'] },
    { label: 'Employee Levels', icon: 'bi-sliders', route: '/levels', roles: ['HR'] },
    { label: 'Attendance', icon: 'bi-clock-history', route: '/attendance' },
    { label: 'Leave Management', icon: 'bi-calendar-range-fill', route: '/leave-management' },
    { label: 'Announcements', icon: 'bi-megaphone-fill', route: '/announcements' }
  ];

  constructor(
    private authService: AuthService,
    private notificationService: NotificationService,
    private toastService: ToastService,
    private router: Router
  ) {}

  ngOnInit(): void {
    // 1. Subscribe to auth session changes
    this.authService.currentUser$.subscribe(user => {
      this.currentUser = user;
      if (user) {
        // Immediately fetch notifications on login/session restore
        this.fetchNotifications();
      } else {
        // Clear notifications on logout
        this.notifications = [];
        this.unreadCount = 0;
      }
    });

    // 2. Subscribe to the notification BehaviorSubject for real-time UI updates
    this.notifSubscription = this.notificationService.notifications$.subscribe(notifs => {
      this.notifications = notifs.sort((a, b) => b.notificationId - a.notificationId);
      this.unreadCount = notifs.filter(n => !n.isRead).length;
    });

    // 3. Background polling every 5 seconds for near-real-time notifications
    this.pollSubscription = interval(5000).subscribe(() => {
      if (this.currentUser) {
        this.fetchNotifications();
      }
    });

    // Check responsive screen width
    this.checkViewport();
    window.addEventListener('resize', () => this.checkViewport());
    
    // Check saved theme preference
    const savedTheme = localStorage.getItem('theme');
    if (savedTheme === 'dark') {
      this.isDarkMode = true;
      document.body.classList.add('dark-theme');
    }
  }

  private fetchNotifications(): void {
    if (!this.currentUser) return;
    this.notificationService.getUserNotifications(this.currentUser.userId).pipe(
      catchError(() => EMPTY) // Silently ignore errors (401 handled globally by interceptor)
    ).subscribe();
  }

  ngOnDestroy(): void {
    if (this.pollSubscription) {
      this.pollSubscription.unsubscribe();
    }
    if (this.notifSubscription) {
      this.notifSubscription.unsubscribe();
    }
  }

  checkViewport(): void {
    this.isMobile = window.innerWidth < 992;
  }

  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
      localStorage.setItem('theme', 'dark');
      this.toastService.info('Dark mode activated');
    } else {
      document.body.classList.remove('dark-theme');
      localStorage.setItem('theme', 'light');
      this.toastService.info('Light mode activated');
    }
  }

  markAsRead(notificationId: number, event: Event): void {
    event.stopPropagation(); // Avoid closing the menu
    this.notificationService.markAsRead(notificationId).subscribe();
  }

  markAllAsRead(): void {
    if (this.currentUser) {
      this.notificationService.markAllAsRead(this.currentUser.userId).subscribe(() => {
        this.toastService.success('All notifications marked as read');
      });
    }
  }

  logout(): void {
    this.authService.logout();
    this.toastService.success('Logged out successfully');
    this.router.navigate(['/login']);
  }

  // Filter items by active user role
  get filteredNavItems(): NavItem[] {
    if (!this.currentUser) return [];
    return this.navigationItems.filter(item => 
      !item.roles || item.roles.includes(this.currentUser!.role)
    );
  }
}
