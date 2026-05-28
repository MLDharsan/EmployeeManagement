import { Component, Inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators, AbstractControl, AsyncValidatorFn, ValidationErrors } from '@angular/forms';
import { MatDialogRef, MAT_DIALOG_DATA, MatDialogModule } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatButtonModule } from '@angular/material/button';
import { Observable, timer, of } from 'rxjs';
import { map, switchMap, catchError, take } from 'rxjs/operators';
import { Employee, EmployeeLevel } from '../../../core/models/employee.model';
import { DepartmentService } from '../../../core/services/department.service';
import { LevelService } from '../../../core/services/level.service';
import { EmployeeService } from '../../../core/services/employee.service';

@Component({
  selector: 'app-employee-form',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule,
    MatButtonModule
  ],
  templateUrl: './employee-form.html',
  styleUrls: ['./employee-form.css']
})
export class EmployeeFormComponent implements OnInit {
  employeeForm!: FormGroup;
  isEditMode = false;
  isAiParsed = false;

  // Dynamic Dropdown list mapped to backend
  departments: { id: number; name: string }[] = [];
  levels: EmployeeLevel[] = [];

  constructor(
    private fb: FormBuilder,
    private departmentService: DepartmentService,
    private levelService: LevelService,
    private employeeService: EmployeeService,
    private dialogRef: MatDialogRef<EmployeeFormComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { employee?: Employee; parsedData?: any }
  ) {}

  ngOnInit(): void {
    this.isEditMode = !!this.data?.employee;
    this.isAiParsed = !!this.data?.parsedData;
    this.loadDepartments();
    this.loadLevels();
    const emp = this.data?.employee;
    const parsed = this.data?.parsedData;

    this.employeeForm = this.fb.group({
      employeeCode: [
        { value: emp?.employeeCode || '', disabled: this.isEditMode },
        [Validators.required, Validators.pattern(/^EMP\d{3,}$/)],
        [this.uniqueEmployeeCodeValidator()]
      ],
      firstName: [emp?.firstName || parsed?.firstName || '', [Validators.required, Validators.minLength(2)]],
      lastName: [emp?.lastName || parsed?.lastName || '', [Validators.required, Validators.minLength(2)]],
      email: [emp?.email || parsed?.email || '', [Validators.required, Validators.email]],
      recoveryEmail: [emp?.recoveryEmail || '', [Validators.email]],
      phone: [emp?.phone || parsed?.phone || '', [Validators.required, Validators.pattern(/^\+94\s?\d{2}\s?\d{7}$/)]],
      address: [emp?.address || parsed?.address || '', [Validators.required, Validators.maxLength(100)]],
      dob: [emp?.dob ? emp.dob.split('T')[0] : (parsed?.dob ? parsed.dob.split('T')[0] : ''), [Validators.required]],
      gender: [emp?.gender || parsed?.gender || 'Male', [Validators.required]],
      joiningDate: [{ value: emp?.joiningDate ? emp.joiningDate.split('T')[0] : new Date().toISOString().split('T')[0], disabled: this.isEditMode }, [Validators.required]],
      departmentId: [emp?.departmentId || 2, [Validators.required]],
      levelId: [emp?.levelId || 1, [Validators.required]]
    });

    if (!this.isEditMode) {
      const passwordPattern = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[^a-zA-Z0-9]).{8,}$/;
      this.employeeForm.addControl('username', this.fb.control('', [Validators.required, Validators.minLength(3)]));
      this.employeeForm.addControl('password', this.fb.control('', [
        Validators.required,
        Validators.pattern(passwordPattern)
      ]));
    }
  }

  onSubmit(): void {
    if (this.employeeForm.invalid) {
      return;
    }
    
    // Return form values (combining disabled/enabled values for consistency)
    const result = this.employeeForm.getRawValue();
    this.dialogRef.close(result);
  }

  uniqueEmployeeCodeValidator(): AsyncValidatorFn {
    return (control: AbstractControl): Observable<ValidationErrors | null> => {
      if (!control.value || this.isEditMode) {
        return of(null);
      }
      return timer(300).pipe(
        switchMap(() => this.employeeService.checkEmployeeCodeExists(control.value)),
        map(exists => (exists ? { codeExists: true } : null)),
        catchError(() => of(null)),
        take(1)
      );
    };
  }

  onCancel(): void {
    this.dialogRef.close(null);
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe(depts => {
      this.departments = depts.map(d => ({ id: d.departmentId, name: d.departmentName }));
    });
  }

  loadLevels(): void {
    this.levelService.getAllLevels().subscribe(lvls => {
      this.levels = lvls;
    });
  }
}
