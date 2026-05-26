import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDividerModule } from '@angular/material/divider';
import { AttendanceService } from '../../core/services/attendance.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { Attendance } from '../../core/models/attendance.model';

@Component({
  selector: 'app-attendance',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatFormFieldModule,
    MatInputModule,
    MatDividerModule
  ],
  templateUrl: './attendance.html',
  styleUrls: ['./attendance.css']
})
export class AttendanceComponent implements OnInit {
  isHR = false;
  currentUserId = 101; // John Doe default
  currentUserName = 'John Doe';
  
  // State for Employees
  todayLog: Attendance | undefined = undefined;
  personalHistory: Attendance[] = [];
  personalColumns: string[] = ['date', 'checkIn', 'checkOut', 'hours', 'status'];

  // State for HR Admin
  hrAllLogs: Attendance[] = [];
  hrFilteredLogs: Attendance[] = [];
  hrColumns: string[] = ['employeeName', 'date', 'checkIn', 'checkOut', 'hours', 'status'];
  
  // Filter state
  filterDate = '';
  searchQuery = '';

  // KPI Metrics
  totalPresent = 0;
  totalLate = 0;
  totalAbsent = 0;

  constructor(
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    const currentUser = this.authService.currentUserValue;
    if (currentUser) {
      this.isHR = currentUser.role === 'HR';
      this.currentUserId = currentUser.employeeId || 101;
      this.currentUserName = (currentUser.username === 'admin' || currentUser.username.startsWith('admin@')) ? 'Admin User' : 'John Doe';
    }
  }

  ngOnInit(): void {
    // Set default filter date to today's date in local ISO format (YYYY-MM-DD)
    const todayStr = new Date().toISOString().split('T')[0];
    this.filterDate = todayStr;

    if (this.isHR) {
      this.loadAllAttendance();
    } else {
      this.loadEmployeeAttendance();
    }
  }

  // ==========================================
  // EMPLOYEE METHODS
  // ==========================================
  loadEmployeeAttendance(): void {
    this.attendanceService.getTodayStatus(this.currentUserId).subscribe(log => {
      this.todayLog = log;
      this.cdr.detectChanges();
    });

    this.attendanceService.getEmployeeAttendance(this.currentUserId).subscribe(history => {
      // Sort history descending by date
      this.personalHistory = history.sort((a, b) => b.date.localeCompare(a.date));
      this.cdr.detectChanges();
    });
  }

  onClockIn(): void {
    this.attendanceService.checkIn(this.currentUserId, this.currentUserName).subscribe({
      next: (log) => {
        this.todayLog = log;
        this.loadEmployeeAttendance();
        this.toastService.success('Clocked in successfully! Have a great day.');
      },
      error: () => {
        this.toastService.error('Failed to register clock-in.');
      }
    });
  }

  onClockOut(): void {
    this.attendanceService.checkOut(this.currentUserId).subscribe({
      next: (success) => {
        if (success) {
          this.loadEmployeeAttendance();
          this.toastService.success('Clocked out successfully! Rest well.');
        } else {
          this.toastService.warning('Failed to clock out. Please check if you have an active session.');
        }
      },
      error: () => {
        this.toastService.error('An error occurred during clock-out.');
      }
    });
  }

  // ==========================================
  // HR ADMIN METHODS
  // ==========================================
  loadAllAttendance(): void {
    this.attendanceService.getAllAttendance().subscribe(data => {
      this.hrAllLogs = data;
      this.applyHrFilters();
      this.cdr.detectChanges();
    });
  }

  applyHrFilters(): void {
    let filtered = [...this.hrAllLogs];

    // Filter by Date
    if (this.filterDate) {
      filtered = filtered.filter(l => l.date.split('T')[0] === this.filterDate);
    }

    // Filter by Search Query (Employee Name)
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l => l.employeeName?.toLowerCase().includes(q));
    }

    this.hrFilteredLogs = filtered;
    this.calculateKpis(filtered);
  }

  calculateKpis(logs: Attendance[]): void {
    this.totalPresent = logs.filter(l => l.status === 'Present').length;
    this.totalLate = logs.filter(l => l.status === 'Late').length;
    
    // Simulate active employees count subtraction
    // In a real environment, we'd compare present employees against active user base.
    // For mock, total absent is: (5 total database employees) - Present - Late
    const totalPossible = 5;
    this.totalAbsent = Math.max(0, totalPossible - (this.totalPresent + this.totalLate));
  }

  resetFilters(): void {
    this.filterDate = new Date().toISOString().split('T')[0];
    this.searchQuery = '';
    this.applyHrFilters();
  }
}
