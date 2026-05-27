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
import { environment } from '../../../../environments/environment';

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

  // Change password variables
  changePasswordForm!: FormGroup;
  isChangingPassword = false;
  isPasswordFormExpanded = false;

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
        this.initChangePasswordForm();
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

  initChangePasswordForm(): void {
    this.changePasswordForm = this.fb.group({
      currentPassword: ['', [Validators.required]],
      newPassword: ['', [
        Validators.required,
        Validators.minLength(8),
        Validators.pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&()\-#_+=/\\\[\]{}])[A-Za-z\d@$!%*?&()\-#_+=/\\\[\]{}]{8,}$/)
      ]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  passwordMatchValidator(g: FormGroup) {
    const newPassword = g.get('newPassword')?.value;
    const confirmPassword = g.get('confirmPassword')?.value;
    return newPassword === confirmPassword ? null : { mismatch: true };
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
      this.imageUploadProgress = 20;

      this.employeeService.uploadProfileImage(this.employee.employeeId, file).subscribe({
        next: (res) => {
          this.imageUploadProgress = 100;
          setTimeout(() => {
            this.isImageUploading = false;
            this.loadEmployeeDetails(this.employee!.employeeId);
            
            // Dynamic update of current user profile picture if editing self
            if (this.isSelf) {
              this.authService.updateCurrentUserProfileImage(res.imageUrl);
            }
            this.toastService.success('Profile avatar uploaded successfully!');
          }, 400);
        },
        error: () => {
          this.isImageUploading = false;
          this.toastService.error('Failed to upload profile photo.');
        }
      });
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
      this.cvUploadProgress = 30;

      this.employeeService.uploadCV(this.employee.employeeId, file).subscribe({
        next: (res) => {
          this.cvUploadProgress = 100;
          setTimeout(() => {
            this.isCvUploading = false;
            this.loadEmployeeDetails(this.employee!.employeeId);
            this.toastService.success('CV file uploaded and bound to profile successfully!');
          }, 400);
        },
        error: () => {
          this.isCvUploading = false;
          this.toastService.error('Failed to upload CV.');
        }
      });
    }
  }

  getProfileImageUrl(profileImage: string | undefined): string {
    if (!profileImage) {
      return this.isHRProfile 
        ? 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=150' 
        : 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=150';
    }
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) return profileImage;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`;
  }

  getCvUrl(cvPath: string | undefined): string {
    if (!cvPath) return '#';
    if (cvPath.startsWith('http://') || cvPath.startsWith('https://')) return cvPath;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${cvPath.startsWith('/') ? '' : '/'}${cvPath}`;
  }

  getCvFileName(cvPath: string | undefined): string {
    if (!cvPath) return '';
    return cvPath.substring(cvPath.lastIndexOf('/') + 1);
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '??';
    const parts = fullName.trim().split(/[.\s_-]+/);
    const initials = parts.filter(p => p.length > 0).map(p => p[0]).join('').toUpperCase();
    return initials.substring(0, 2);
  }

  canChangePassword(): boolean {
    if (!this.employee || !this.employee.lastPasswordChangedAt) {
      return true;
    }
    const lastChange = new Date(this.employee.lastPasswordChangedAt);
    const now = new Date();
    const diffTime = now.getTime() - lastChange.getTime();
    const diffDays = diffTime / (1000 * 60 * 60 * 24);
    return diffDays >= 30;
  }

  getPasswordChangeRemainingDays(): number {
    if (!this.employee || !this.employee.lastPasswordChangedAt) {
      return 0;
    }
    const lastChange = new Date(this.employee.lastPasswordChangedAt);
    const nextAllowedDate = new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000);
    const now = new Date();
    const diffTime = nextAllowedDate.getTime() - now.getTime();
    if (diffTime <= 0) return 0;
    return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  }

  getNextAllowedPasswordChangeDate(): Date | null {
    if (!this.employee || !this.employee.lastPasswordChangedAt) {
      return null;
    }
    const lastChange = new Date(this.employee.lastPasswordChangedAt);
    return new Date(lastChange.getTime() + 30 * 24 * 60 * 60 * 1000);
  }

  togglePasswordForm(): void {
    this.isPasswordFormExpanded = !this.isPasswordFormExpanded;
    if (!this.isPasswordFormExpanded) {
      this.changePasswordForm.reset();
    }
  }

  onChangePassword(): void {
    if (this.changePasswordForm.invalid) {
      this.toastService.warning('Please satisfy all password complexity rules and ensure they match.');
      return;
    }

    if (!this.canChangePassword()) {
      const remainingDays = this.getPasswordChangeRemainingDays();
      this.toastService.error(`You can only change your password once a month. Please wait ${remainingDays} more day(s).`);
      return;
    }

    this.isChangingPassword = true;
    const { currentPassword, newPassword } = this.changePasswordForm.value;

    this.authService.changePassword({ currentPassword, newPassword }).subscribe({
      next: (res: any) => {
        this.isChangingPassword = false;
        this.isPasswordFormExpanded = false;
        this.toastService.success(res.message || 'Password updated successfully!');
        this.changePasswordForm.reset();
        
        // Reload details to lock the form immediately
        if (this.employee) {
          this.loadEmployeeDetails(this.employee.employeeId);
        }
      },
      error: (err) => {
        this.isChangingPassword = false;
        const errMsg = err?.error?.message || 'Failed to change password. Please check your current password.';
        this.toastService.error(errMsg);
      }
    });
  }
}
