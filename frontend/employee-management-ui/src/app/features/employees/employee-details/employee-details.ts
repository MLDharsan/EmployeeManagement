import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatProgressBarModule } from '@angular/material/progress-bar';
import { MatDividerModule } from '@angular/material/divider';
import { EmployeeService } from '../../../core/services/employee.service';
import { LeaveService } from '../../../core/services/leave.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { Employee } from '../../../core/models/employee.model';
import { LeaveBalance } from '../../../core/models/leave.model';

@Component({
  selector: 'app-employee-details',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatProgressBarModule,
    MatDividerModule
  ],
  templateUrl: './employee-details.html',
  styleUrls: ['./employee-details.css']
})
export class EmployeeDetailsComponent implements OnInit {
  employee: Employee | null = null;
  leaveBalances: LeaveBalance[] = [];
  
  // Inline profile editing variables
  profileForm!: FormGroup;
  isEditMode = false;
  isSaving = false;

  // Role status checkers
  isHR = false;
  isSelf = false;
  isHRProfile = false;

  // File upload simulation progress variables
  imageUploadProgress = 0;
  isImageUploading = false;
  cvUploadProgress = 0;
  isCvUploading = false;

  constructor(
    private fb: FormBuilder,
    private route: ActivatedRoute,
    private router: Router,
    private employeeService: EmployeeService,
    private leaveService: LeaveService,
    private authService: AuthService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.isHR = this.authService.hasRole('HR');
  }

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      let targetId = +params['id'];
      const currentUser = this.authService.currentUserValue;

      if (!currentUser) {
        this.router.navigate(['/login']);
        return;
      }

      // Security check: If standard employee tries to view someone else, redirect to self profile
      if (!this.isHR && targetId && targetId !== currentUser.employeeId) {
        this.toastService.warning('Unauthorized Access. Redirected to your own profile.');
        this.router.navigate(['/employees/profile']);
        return;
      }

      // Default to logged-in user's employee ID if none provided
      if (!targetId) {
        targetId = currentUser.employeeId || 101;
      }

      this.isSelf = targetId === currentUser.employeeId;
      this.loadEmployeeDetails(targetId);
    });
  }

  loadEmployeeDetails(id: number): void {
    this.employeeService.getEmployeeById(id).subscribe(emp => {
      if (emp) {
        this.employee = emp;
        this.leaveBalances = this.leaveService.getLeaveBalances(
          emp.remainingLeaveDays,
          emp.allowedLeaveDays
        );
        this.isHRProfile = emp.departmentName === 'Human Resources' || emp.levelName === 'Senior Manager' || emp.employeeCode === 'EMP001';
        this.initProfileForm(emp);
        this.cdr.markForCheck();
      } else {
        this.toastService.error('Employee details not found.');
        this.router.navigate(['/dashboard']);
      }
    });
  }

  initProfileForm(emp: Employee): void {
    this.profileForm = this.fb.group({
      phone: [emp.phone, [Validators.required, Validators.pattern(/^\+?[\d\s\-()]{7,15}$/)]],
      address: [emp.address, [Validators.required, Validators.maxLength(100)]],
      email: [emp.email, [Validators.required, Validators.email]]
    });
  }

  toggleEditMode(): void {
    this.isEditMode = !this.isEditMode;
    if (!this.isEditMode && this.employee) {
      // Reset form values to current DB values on cancel
      this.profileForm.patchValue({
        phone: this.employee.phone,
        address: this.employee.address,
        email: this.employee.email
      });
    }
  }

  saveProfileChanges(): void {
    if (this.profileForm.invalid || !this.employee) {
      this.toastService.warning('Please correct validation errors before saving.');
      return;
    }

    this.isSaving = true;
    const { phone, address, email } = this.profileForm.value;

    this.employeeService.updateProfile(this.employee.employeeId, phone, address, email).subscribe({
      next: (updatedEmp) => {
        this.employee = updatedEmp;
        this.isSaving = false;
        this.isEditMode = false;
        this.toastService.success('Your contact details have been updated successfully.');
      },
      error: () => {
        this.isSaving = false;
        this.toastService.error('Failed to update contact details. Please try again.');
      }
    });
  }

  // Simulated Profile Image Upload with progress indicator
  onImageSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && this.employee) {
      const file = input.files[0];
      this.isImageUploading = true;
      this.imageUploadProgress = 0;

      const interval = setInterval(() => {
        this.imageUploadProgress += 20;
        if (this.imageUploadProgress >= 100) {
          clearInterval(interval);
          this.employeeService.uploadProfileImage(this.employee!.employeeId, file).subscribe(() => {
            this.isImageUploading = false;
            this.loadEmployeeDetails(this.employee!.employeeId);
            this.toastService.success('Profile avatar uploaded successfully!');
          });
        }
      }, 150);
    }
  }

  // Simulated CV File Upload (PDF) with progress indicator
  onCvSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0] && this.employee) {
      const file = input.files[0];
      
      if (file.type !== 'application/pdf') {
        this.toastService.error('Invalid format. Please select a PDF file.');
        return;
      }

      this.isCvUploading = true;
      this.cvUploadProgress = 0;

      const interval = setInterval(() => {
        this.cvUploadProgress += 10;
        if (this.cvUploadProgress >= 100) {
          clearInterval(interval);
          this.employeeService.uploadCV(this.employee!.employeeId, file).subscribe(() => {
            this.isCvUploading = false;
            this.loadEmployeeDetails(this.employee!.employeeId);
            this.toastService.success('CV file uploaded and bound to profile successfully!');
          });
        }
      }, 100);
    }
  }
}
