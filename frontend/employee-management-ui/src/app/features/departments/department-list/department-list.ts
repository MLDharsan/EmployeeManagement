import { Component, OnInit, TemplateRef, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatTableModule } from '@angular/material/table';
import { MatDialog, MatDialogModule, MatDialogRef } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { ToastService } from '../../../core/services/toast.service';
import { Department, Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-department-list',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatTableModule,
    MatDialogModule,
    MatFormFieldModule,
    MatInputModule
  ],
  templateUrl: './department-list.html',
  styleUrls: ['./department-list.css']
})
export class DepartmentListComponent implements OnInit {
  departments: Department[] = [];
  employees: Employee[] = [];
  displayedColumns: string[] = ['name', 'description', 'headcount', 'actions'];
  
  departmentForm!: FormGroup;
  isEditMode = false;
  editingDeptId: number | null = null;
  dialogRef: MatDialogRef<any> | null = null;

  @ViewChild('deptDialog') deptDialog!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadDepartments();
    this.loadEmployees();
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe(data => {
      this.departments = data;
      this.cdr.detectChanges();
    });
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe(data => {
      this.employees = data;
      this.cdr.detectChanges();
    });
  }

  initForm(): void {
    this.departmentForm = this.fb.group({
      departmentName: ['', [Validators.required, Validators.maxLength(50)]],
      description: ['', [Validators.maxLength(150)]]
    });
  }

  getHeadcount(deptId: number): number {
    return this.employees.filter(e => e.departmentId === deptId).length;
  }

  openDeptDialog(dept?: Department, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (dept) {
      this.isEditMode = true;
      this.editingDeptId = dept.departmentId;
      this.departmentForm.patchValue({
        departmentName: dept.departmentName,
        description: dept.description || ''
      });
    } else {
      this.isEditMode = false;
      this.editingDeptId = null;
      this.departmentForm.reset({ departmentName: '', description: '' });
    }

    this.dialogRef = this.dialog.open(this.deptDialog, {
      width: '450px',
      disableClose: true
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  saveDepartment(): void {
    if (this.departmentForm.invalid) {
      this.toastService.warning('Please enter valid department details.');
      return;
    }

    const { departmentName, description } = this.departmentForm.value;

    if (this.isEditMode && this.editingDeptId !== null) {
      this.departmentService.updateDepartment(this.editingDeptId, { departmentName, description }).subscribe(success => {
        if (success) {
          this.toastService.success(`Department "${departmentName}" updated successfully.`);
          this.loadDepartments();
        } else {
          this.toastService.error('Failed to update department.');
        }
      });
    } else {
      this.departmentService.createDepartment({ departmentName, description }).subscribe(newDept => {
        if (newDept) {
          this.toastService.success(`New department "${departmentName}" registered successfully.`);
          this.loadDepartments();
        } else {
          this.toastService.error('Failed to create department.');
        }
      });
    }

    this.closeDialog();
  }

  deleteDepartment(dept: Department, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const headcount = this.getHeadcount(dept.departmentId);
    if (headcount > 0) {
      this.toastService.error(`Cannot delete "${dept.departmentName}" because it has ${headcount} active employee(s).`);
      return;
    }

    if (confirm(`Are you sure you want to delete the department "${dept.departmentName}"?`)) {
      this.departmentService.deleteDepartment(dept.departmentId).subscribe(success => {
        if (success) {
          this.toastService.success(`Department "${dept.departmentName}" deleted successfully.`);
          this.loadDepartments();
        } else {
          this.toastService.error('Failed to delete department.');
        }
      });
    }
  }
}
