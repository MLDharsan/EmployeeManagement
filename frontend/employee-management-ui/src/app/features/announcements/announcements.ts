import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { forkJoin } from 'rxjs';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { MatIconModule } from '@angular/material/icon';
import { MatSelectModule } from '@angular/material/select';
import { MatRadioModule } from '@angular/material/radio';
import { MatTabsModule } from '@angular/material/tabs';
import { AnnouncementService } from '../../core/services/announcement.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { EmployeeService } from '../../core/services/employee.service';
import { NotificationService } from '../../core/services/notification.service';
import { Announcement } from '../../core/models/announcement.model';
import { Employee } from '../../core/models/employee.model';
import { Notification } from '../../core/models/notification.model';

@Component({
  selector: 'app-announcements',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule,
    MatIconModule,
    MatSelectModule,
    MatRadioModule,
    MatTabsModule
  ],
  templateUrl: './announcements.html',
  styleUrls: ['./announcements.css']
})
export class AnnouncementsComponent implements OnInit {
  isHR = false;
  announcements: Announcement[] = [];
  dismissedNoticeIds: number[] = [];
  
  // Direct Messages & Private Notifications
  privateNotifications: Notification[] = [];
  employees: Employee[] = [];
  dmSearchQuery = '';
  activeTab = 0; // 0 for Notice Board, 1 for Direct Messages

  get filteredPrivateNotifications(): Notification[] {
    if (!this.dmSearchQuery) {
      return this.privateNotifications;
    }
    const query = this.dmSearchQuery.toLowerCase();
    return this.privateNotifications.filter(n => 
      (n.recipientName && n.recipientName.toLowerCase().includes(query)) ||
      (n.title && n.title.toLowerCase().includes(query)) ||
      (n.message && n.message.toLowerCase().includes(query))
    );
  }
  
  // Notice Form state for HR
  announcementForm!: FormGroup;
  isPublishing = false;

  constructor(
    private fb: FormBuilder,
    private announcementService: AnnouncementService,
    private authService: AuthService,
    private toastService: ToastService,
    private employeeService: EmployeeService,
    private notificationService: NotificationService,
    private cdr: ChangeDetectorRef
  ) {
    this.isHR = this.authService.hasRole('HR');
    this.initForm();
  }

  ngOnInit(): void {
    this.loadAnnouncements();
    this.loadPrivateNotifications();
    if (this.isHR) {
      this.loadEmployees();
    }
  }

  initForm(): void {
    this.announcementForm = this.fb.group({
      title: ['', [Validators.required, Validators.minLength(5), Validators.maxLength(80)]],
      message: ['', [Validators.required, Validators.minLength(10), Validators.maxLength(500)]],
      recipientType: ['all', Validators.required],
      selectedUserIds: [[]]
    });
  }

  loadAnnouncements(): void {
    this.loadDismissedNotices();
    this.announcementService.getAnnouncements().subscribe(data => {
      // Filter out dismissed notices and sort chronologically descending
      this.announcements = data
        .filter(notice => !this.dismissedNoticeIds.includes(notice.announcementId))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
      this.cdr.detectChanges();
    });
  }

  loadDismissedNotices(): void {
    const userId = this.authService.currentUserValue?.userId || 0;
    const stored = localStorage.getItem(`dismissed_notices_${userId}`);
    this.dismissedNoticeIds = stored ? JSON.parse(stored) : [];
  }

  dismissNotice(id: number, event: Event): void {
    event.stopPropagation();
    this.dismissedNoticeIds.push(id);
    const userId = this.authService.currentUserValue?.userId || 0;
    localStorage.setItem(`dismissed_notices_${userId}`, JSON.stringify(this.dismissedNoticeIds));
    this.toastService.success('Notice dismissed locally.');
    this.loadAnnouncements();
  }

  clearAllNotices(): void {
    if (this.announcements.length === 0) return;

    if (this.isHR) {
      if (confirm('Are you sure you want to delete all corporate notices permanently from the database?')) {
        this.isPublishing = true;
        const requests = this.announcements.map(a => 
          this.announcementService.deleteAnnouncement(a.announcementId)
        );
        forkJoin(requests).subscribe({
          next: () => {
            this.isPublishing = false;
            this.toastService.success('All corporate notices deleted permanently.');
            this.loadAnnouncements();
          },
          error: () => {
            this.isPublishing = false;
            this.toastService.error('Failed to delete all announcements.');
          }
        });
      }
    } else {
      const allIds = this.announcements.map(n => n.announcementId);
      this.dismissedNoticeIds.push(...allIds);
      const userId = this.authService.currentUserValue?.userId || 0;
      localStorage.setItem(`dismissed_notices_${userId}`, JSON.stringify(this.dismissedNoticeIds));
      this.toastService.success('All notices cleared locally.');
      this.loadAnnouncements();
    }
  }

  clearAllDMs(): void {
    if (this.privateNotifications.length === 0) return;

    if (confirm('Are you sure you want to delete all direct messages permanently?')) {
      this.isPublishing = true;
      const requests = this.privateNotifications.map(n => 
        this.notificationService.deleteNotification(n.notificationId)
      );
      forkJoin(requests).subscribe({
        next: () => {
          this.isPublishing = false;
          this.toastService.success('All direct messages deleted permanently.');
          this.loadPrivateNotifications();
        },
        error: () => {
          this.isPublishing = false;
          this.toastService.error('Failed to delete all direct messages.');
        }
      });
    }
  }

  deleteNotice(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this notice globally for all employees?')) {
      this.announcementService.deleteAnnouncement(id).subscribe({
        next: () => {
          this.toastService.success('Notice deleted globally.');
          this.loadAnnouncements();
        },
        error: () => {
          this.toastService.error('Failed to delete notice.');
        }
      });
    }
  }

  publishNotice(): void {
    if (this.announcementForm.invalid) {
      this.toastService.warning('Please fill in all required fields.');
      return;
    }

    const { title, message, recipientType, selectedUserIds } = this.announcementForm.value;

    if (!this.isHR) {
      // Standard Employee sending a message to HR Support
      this.isPublishing = true;
      const senderName = this.authService.currentUserValue?.username || 'Employee';
      this.notificationService.createNotification(title, message, 0, senderName).subscribe({
        next: () => {
          this.isPublishing = false;
          this.toastService.success('Your message has been sent directly to HR!');
          this.announcementForm.reset({ recipientType: 'all', selectedUserIds: [] });
          this.loadPrivateNotifications();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isPublishing = false;
          this.toastService.error('Failed to send message to HR.');
        }
      });
      return;
    }

    // HR Admin Flow
    if (recipientType === 'specific') {
      if (!selectedUserIds || selectedUserIds.length === 0) {
        this.toastService.warning('Please select at least one employee.');
        return;
      }

      this.isPublishing = true;
      const requests = selectedUserIds.map((userId: number) => 
        this.notificationService.createNotification(title, message, userId, 'HR Administrator')
      );

      forkJoin(requests).subscribe({
        next: () => {
          this.isPublishing = false;
          this.toastService.success('Private message(s) sent successfully!');
          this.announcementForm.reset({ recipientType: 'all', selectedUserIds: [] });
          this.loadPrivateNotifications();
          this.cdr.detectChanges();
        },
        error: () => {
          this.isPublishing = false;
          this.toastService.error('Failed to send private message(s).');
        }
      });
    } else {
      this.isPublishing = true;
      this.announcementService.createAnnouncement(title, message).subscribe({
        next: () => {
          this.loadAnnouncements();
          this.announcementForm.reset({ recipientType: 'all', selectedUserIds: [] });
          this.isPublishing = false;
          this.toastService.success('Corporate notice published successfully!');
        },
        error: () => {
          this.isPublishing = false;
          this.toastService.error('Failed to publish corporate notice.');
        }
      });
    }
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe({
      next: (data) => {
        this.employees = data.filter(e => e.userId != null);
        this.cdr.detectChanges();
      },
      error: () => {
        this.toastService.error('Failed to load employees list.');
      }
    });
  }

  loadPrivateNotifications(): void {
    const userId = this.authService.currentUserValue?.userId;
    if (userId) {
      this.notificationService.getUserNotifications(userId).subscribe({
        next: (data) => {
          this.privateNotifications = data
            .filter(n => n.title !== 'New Announcement Published')
            .sort((a, b) => b.notificationId - a.notificationId);
          this.cdr.detectChanges();
        }
      });
    }
  }

  markNotificationAsRead(id: number, event: Event): void {
    event.stopPropagation();
    this.notificationService.markAsRead(id).subscribe({
      next: () => {
        this.toastService.success('Message marked as read.');
        this.loadPrivateNotifications();
      }
    });
  }

  deleteNotification(id: number, event: Event): void {
    event.stopPropagation();
    if (confirm('Are you sure you want to delete this direct message?')) {
      this.notificationService.deleteNotification(id).subscribe({
        next: () => {
          this.toastService.success('Message deleted.');
          this.loadPrivateNotifications();
        },
        error: () => {
          this.toastService.error('Failed to delete message.');
        }
      });
    }
  }
}
