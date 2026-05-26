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
import { LevelService } from '../../../core/services/level.service';
import { ToastService } from '../../../core/services/toast.service';
import { EmployeeLevel, Employee } from '../../../core/models/employee.model';

@Component({
  selector: 'app-level-list',
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
  templateUrl: './level-list.html',
  styleUrls: ['./level-list.css']
})
export class LevelListComponent implements OnInit {
  levels: EmployeeLevel[] = [];
  employees: Employee[] = [];
  displayedColumns: string[] = ['name', 'allowedLeaveDays', 'headcount', 'actions'];

  levelForm!: FormGroup;
  isEditMode = false;
  editingLevelId: number | null = null;
  dialogRef: MatDialogRef<any> | null = null;

  @ViewChild('levelDialog') levelDialog!: TemplateRef<any>;

  constructor(
    private fb: FormBuilder,
    private dialog: MatDialog,
    private employeeService: EmployeeService,
    private levelService: LevelService,
    private toastService: ToastService,
    private cdr: ChangeDetectorRef
  ) {
    this.initForm();
  }

  ngOnInit(): void {
    this.loadLevels();
    this.loadEmployees();
  }

  loadLevels(): void {
    this.levelService.getAllLevels().subscribe(data => {
      this.levels = data;
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
    this.levelForm = this.fb.group({
      levelName: ['', [Validators.required, Validators.maxLength(50)]],
      allowedLeaveDays: [14, [Validators.required, Validators.min(0), Validators.max(100)]]
    });
  }

  getHeadcount(levelId: number): number {
    return this.employees.filter(e => e.levelId === levelId).length;
  }

  openLevelDialog(level?: EmployeeLevel, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    if (level) {
      this.isEditMode = true;
      this.editingLevelId = level.levelId;
      this.levelForm.patchValue({
        levelName: level.levelName,
        allowedLeaveDays: level.allowedLeaveDays
      });
    } else {
      this.isEditMode = false;
      this.editingLevelId = null;
      this.levelForm.reset({
        levelName: '',
        allowedLeaveDays: 14
      });
    }

    this.dialogRef = this.dialog.open(this.levelDialog, {
      width: '450px',
      disableClose: true
    });
  }

  closeDialog(): void {
    if (this.dialogRef) {
      this.dialogRef.close();
    }
  }

  saveLevel(): void {
    if (this.levelForm.invalid) {
      this.toastService.warning('Please enter valid employee level details.');
      return;
    }

    const { levelName, allowedLeaveDays } = this.levelForm.value;

    if (this.isEditMode && this.editingLevelId !== null) {
      this.levelService.updateLevel(this.editingLevelId, { levelName, allowedLeaveDays }).subscribe(success => {
        if (success) {
          this.toastService.success(`Employee Level "${levelName}" updated successfully.`);
          this.loadLevels();
        } else {
          this.toastService.error('Failed to update employee level.');
        }
      });
    } else {
      this.levelService.createLevel({ levelName, allowedLeaveDays }).subscribe(newLvl => {
        if (newLvl) {
          this.toastService.success(`New employee level "${levelName}" registered successfully.`);
          this.loadLevels();
        } else {
          this.toastService.error('Failed to create employee level.');
        }
      });
    }

    this.closeDialog();
  }

  deleteLevel(level: EmployeeLevel, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    const headcount = this.getHeadcount(level.levelId);
    if (headcount > 0) {
      this.toastService.error(`Cannot delete "${level.levelName}" because it has ${headcount} active employee(s).`);
      return;
    }

    if (confirm(`Are you sure you want to delete the employee level "${level.levelName}"?`)) {
      this.levelService.deleteLevel(level.levelId).subscribe(success => {
        if (success) {
          this.toastService.success(`Employee Level "${level.levelName}" deleted successfully.`);
          this.loadLevels();
        } else {
          this.toastService.error('Failed to delete employee level. Ensure no dependencies exist.');
        }
      });
    }
  }
}
