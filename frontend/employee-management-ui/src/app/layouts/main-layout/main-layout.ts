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
import { environment } from '../../../environments/environment';

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
  ) { }

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
      // Only show received notifications in the bell dropdown (UserId must match current logged-in user)
      const receivedNotifs = notifs.filter(n => n.userId === this.currentUser?.userId);
      this.notifications = receivedNotifs.sort((a, b) => b.notificationId - a.notificationId);
      this.unreadCount = receivedNotifs.filter(n => !n.isRead).length;
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

  onNotificationClick(notif: Notification): void {
    // Mark as read if it is unread
    if (!notif.isRead) {
      this.notificationService.markAsRead(notif.notificationId).subscribe();
    }

    // Determine target route based on title or message content
    const title = notif.title ? notif.title.toLowerCase() : '';
    const message = notif.message ? notif.message.toLowerCase() : '';

    if (title.includes('leave')) {
      this.router.navigate(['/leave-management']);
    } else if (title.includes('announcement') || title.includes('notice') || notif.senderName || title.includes('message') || message.includes('message')) {
      this.router.navigate(['/announcements']);
    } else {
      // Fallback path
      this.router.navigate(['/dashboard']);
    }
  }

  deleteNotification(notificationId: number, event: Event): void {
    event.stopPropagation(); // Avoid triggering navigation or closing menu
    this.notificationService.deleteNotification(notificationId).subscribe({
      next: () => {
        this.toastService.success('Notification removed');
      },
      error: () => {
        this.toastService.error('Failed to remove notification');
      }
    });
  }

  markAllAsRead(): void {
    if (this.currentUser) {
      this.notificationService.markAllAsRead(this.currentUser.userId).subscribe(() => {
        this.toastService.success('All notifications marked as read');
      });
    }
  }

  clearAllNotifications(): void {
    if (this.currentUser) {
      if (confirm('Are you sure you want to clear all your notifications?')) {
        this.notificationService.deleteAllNotifications(this.currentUser.userId).subscribe({
          next: () => {
            this.toastService.success('All notifications cleared');
          },
          error: () => {
            this.toastService.error('Failed to clear notifications');
          }
        });
      }
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

  getProfileImageUrl(profileImage: string | undefined, role: string): string {
    if (!profileImage) {
      return role === 'HR'
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=100'
        : 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=100';
    }
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) return profileImage;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`;
  }

  getInitials(username: string | undefined): string {
    if (!username) return '??';
    const parts = username.trim().split(/[.\s_-]+/);
    const initials = parts.filter(p => p.length > 0).map(p => p[0]).join('').toUpperCase();
    return initials.substring(0, 2);
  }
}
