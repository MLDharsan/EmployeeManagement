import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatDividerModule } from '@angular/material/divider';
import { LeaveService } from '../../core/services/leave.service';
import { EmployeeService } from '../../core/services/employee.service';
import { AuthService } from '../../core/services/auth.service';
import { ToastService } from '../../core/services/toast.service';
import { LeaveRequest, LeaveBalance } from '../../core/models/leave.model';

@Component({
  selector: 'app-leave-management',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatDividerModule
  ],
  templateUrl: './leave-management.html',
  styleUrls: ['./leave-management.css']
})
export class LeaveManagementComponent implements OnInit {
  isHR = false;
  currentUserId = 101; // John Doe default
  currentUserName = 'John Doe';
  remainingDays = 14;

  // Data Collections
  leaveBalances: LeaveBalance[] = [];
  employeeHistory: LeaveRequest[] = [];
  hrPendingQueue: LeaveRequest[] = [];

  // Table Columns
  employeeColumns: string[] = ['leaveType', 'startDate', 'endDate', 'days', 'reason', 'status'];
  hrColumns: string[] = ['employeeName', 'leaveType', 'startDate', 'endDate', 'days', 'reason', 'actions'];

  // Form & Dialog controls
  leaveForm!: FormGroup;
  dialogRef: MatDialogRef<any> | null = null;
  @ViewChild('applyLeaveDialog') applyLeaveDialog!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private leaveService: LeaveService,
    private employeeService: EmployeeService,
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
    this.initForm();
  }

  ngOnInit(): void {
    if (this.isHR) {
      this.loadHrQueue();
    } else {
      this.loadEmployeePortal();
    }
  }

  initForm(): void {
    // Current date string for min date boundary
    const todayStr = new Date().toISOString().split('T')[0];

    this.leaveForm = this.fb.group({
      leaveType: ['Leaves', [Validators.required]],
      startDate: [todayStr, [Validators.required]],
      endDate: [todayStr, [Validators.required]],
      reason: ['', [Validators.required, Validators.maxLength(150), Validators.minLength(5)]]
    });
  }

  // ==========================================
  // EMPLOYEE VIEW LOGIC
  // ==========================================
  loadEmployeePortal(): void {
    // 1. Get Employee Record to read remainingLeaveDays
    this.employeeService.getEmployeeById(this.currentUserId).subscribe(emp => {
      if (emp) {
        this.remainingDays = emp.remainingLeaveDays;
        // 2. Map Leave Balances
        this.leaveBalances = this.leaveService.getLeaveBalances(
          emp.remainingLeaveDays,
          emp.allowedLeaveDays
        );
        this.cdr.detectChanges();
      }
    });

    // 3. Load Employee Applied History
    this.leaveService.getEmployeeLeaveRequests(this.currentUserId).subscribe(history => {
      this.employeeHistory = history;
      this.cdr.detectChanges();
    });
  }

  openApplyDialog(): void {
    this.initForm();
    this.dialogRef = this.dialog.open(this.applyLeaveDialog, {
      width: '450px',
      disableClose: true
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  submitLeaveApplication(): void {
    if (this.leaveForm.invalid) {
      this.toastService.warning('Please complete the application form correctly.');
      return;
    }

    const { leaveType, startDate, endDate, reason } = this.leaveForm.value;
    
    // Validate Start Date is before End Date
    if (new Date(startDate) > new Date(endDate)) {
      this.toastService.error('Start Date cannot be later than End Date.');
      return;
    }

    // Calculate applied days
    const start = new Date(startDate);
    const end = new Date(endDate);
    const timeDiff = end.getTime() - start.getTime();
    const days = timeDiff >= 0 ? Math.ceil(timeDiff / (1000 * 3600 * 24)) + 1 : 0;

    // Check if employee has enough remaining leave days
    if (leaveType === 'Leaves' && days > this.remainingDays) {
      this.toastService.error(`Insufficient Leave Balance. You only have ${this.remainingDays} days remaining.`);
      return;
    }

    const newDto = {
      employeeId: this.currentUserId,
      leaveType,
      startDate,
      endDate,
      reason
    };

    this.leaveService.createLeaveRequest(newDto, this.currentUserName).subscribe({
      next: () => {
        this.loadEmployeePortal();
        this.toastService.success('Your leave application has been submitted as Pending.');
        this.closeDialog();
      },
      error: () => {
        this.toastService.error('Failed to submit leave application.');
      }
    });
  }

  // ==========================================
  // HR ADMIN VIEW LOGIC
  // ==========================================
  loadHrQueue(): void {
    this.leaveService.getAllLeaveRequests().subscribe(all => {
      // Show pending requests on top
      this.hrPendingQueue = all.sort((a, b) => {
        if (a.status === 'Pending' && b.status !== 'Pending') return -1;
        if (a.status !== 'Pending' && b.status === 'Pending') return 1;
        return b.leaveRequestId - a.leaveRequestId;
      });
      this.cdr.detectChanges();
    });
  }

  approveLeave(id: number): void {
    this.leaveService.approveLeaveRequest(id).subscribe({
      next: (success) => {
        if (success) {
          this.loadHrQueue();
          this.toastService.success('Leave application approved! Balance updated.');
        } else {
          this.toastService.error('Failed to approve request.');
        }
      },
      error: () => {
        this.toastService.error('An error occurred.');
      }
    });
  }

  rejectLeave(id: number): void {
    this.leaveService.rejectLeaveRequest(id).subscribe({
      next: (success) => {
        if (success) {
          this.loadHrQueue();
          this.toastService.success('Leave application rejected.');
        } else {
          this.toastService.error('Failed to reject request.');
        }
      },
      error: () => {
        this.toastService.error('An error occurred.');
      }
    });
  }
}
