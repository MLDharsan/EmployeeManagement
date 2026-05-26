import { Component, OnInit, AfterViewInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatProgressSpinnerModule,
    MatDialogModule
  ],
  templateUrl: './login.html',
  styleUrls: ['./login.css']
})
export class LoginComponent implements OnInit, AfterViewInit {
  loginForm!: FormGroup;
  forgotPasswordForm!: FormGroup;
  isLoading = false;
  hidePassword = true;
  returnUrl = '/dashboard';

  activeRole: 'admin' | 'employee' = 'admin';

  @ViewChild('forgotPasswordDialog') forgotPasswordDialog!: TemplateRef<any>;
  dialogRef: MatDialogRef<any> | null = null;

  constructor(
    private fb: FormBuilder,
    private authService: AuthService,
    private toastService: ToastService,
    private router: Router,
    private route: ActivatedRoute,
    private dialog: MatDialog,
    private cdr: ChangeDetectorRef
  ) {
    // Redirect immediately if already logged in
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/dashboard']);
    }
  }

  ngOnInit(): void {
    this.loginForm = this.fb.group({
      username: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(4)]]
    });

    this.forgotPasswordForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]]
    });

    // Default to admin role and credentials
    this.selectRole('admin');

    // Get return url from route parameters or default to '/dashboard'
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/dashboard';
  }

  ngAfterViewInit(): void {
    this.cdr.detectChanges();
  }

  togglePasswordVisibility(): void {
    this.hidePassword = !this.hidePassword;
  }

  onSubmit(): void {
    if (this.loginForm.invalid) {
      this.toastService.warning('Please fill in the required fields correctly.');
      return;
    }

    this.isLoading = true;
    const { username, password } = this.loginForm.value;

    this.authService.login(username, password).subscribe({
      next: () => {
        this.isLoading = false;
        this.toastService.success(`Welcome back, ${username}!`);
        this.router.navigateByUrl(this.returnUrl);
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.message || 'Login failed. Please try again.');
      }
    });
  }

  openForgotPasswordDialog(event: Event): void {
    event.preventDefault();
    this.forgotPasswordForm.reset();
    this.dialogRef = this.dialog.open(this.forgotPasswordDialog, {
      width: '400px',
      disableClose: true
    });
  }

  closeForgotPasswordDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
      this.dialogRef = null;
    }
  }

  sendRecoveryLink(): void {
    if (this.forgotPasswordForm.invalid) {
      this.toastService.warning('Please provide a valid email address.');
      return;
    }

    const { email } = this.forgotPasswordForm.value;
    this.isLoading = true;

    this.authService.forgotPassword(email).subscribe({
      next: (res: any) => {
        this.isLoading = false;
        this.toastService.success(res.message || 'A password recovery link has been simulated & dispatched to your email.');
        this.closeForgotPasswordDialog();
      },
      error: (err) => {
        this.isLoading = false;
        this.toastService.error(err.error?.message || 'Failed to request password reset. Email may not exist.');
      }
    });
  }

  // Toggle login panel according to role and load demo credentials
  selectRole(role: 'admin' | 'employee'): void {
    this.activeRole = role;
    if (role === 'admin') {
      this.loginForm.patchValue({ username: 'admin', password: 'Admin@1234' });
    } else {
      this.loginForm.patchValue({ username: 'employee', password: 'Employee@1234' });
    }
  }
}
