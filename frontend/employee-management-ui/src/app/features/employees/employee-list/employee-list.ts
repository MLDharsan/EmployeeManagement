import { Component, OnInit, ViewChild, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterModule } from '@angular/router';
import { MatTableModule, MatTableDataSource } from '@angular/material/table';
import { MatCardModule } from '@angular/material/card';
import { MatPaginator, MatPaginatorModule } from '@angular/material/paginator';
import { MatSort, MatSortModule } from '@angular/material/sort';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { EmployeeService } from '../../../core/services/employee.service';
import { DepartmentService } from '../../../core/services/department.service';
import { ToastService } from '../../../core/services/toast.service';
import { Employee } from '../../../core/models/employee.model';
import { environment } from '../../../../environments/environment';
import { EmployeeFormComponent } from '../employee-form/employee-form';
import { CredentialsDialogComponent } from '../credentials-dialog/credentials-dialog';

@Component({
  selector: 'app-employee-list',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    MatTableModule,
    MatCardModule,
    MatPaginatorModule,
    MatSortModule,
    MatDialogModule,
    MatButtonModule,
    MatFormFieldModule,
    MatInputModule,
    MatSelectModule
  ],
  templateUrl: './employee-list.html',
  styleUrls: ['./employee-list.css']
})
export class EmployeeListComponent implements OnInit {
  displayedColumns: string[] = ['employeeCode', 'fullName', 'email', 'departmentName', 'levelName', 'actions'];
  dataSource = new MatTableDataSource<Employee>([]);
  
  @ViewChild(MatPaginator) paginator!: MatPaginator;
  @ViewChild(MatSort) sort!: MatSort;

  // Filter properties
  searchQuery = '';
  selectedDepartmentId = 0;

  departments: { id: number; name: string }[] = [
    { id: 0, name: 'All Departments' }
  ];

  constructor(
    private employeeService: EmployeeService,
    private departmentService: DepartmentService,
    private toastService: ToastService,
    private dialog: MatDialog,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.loadEmployees();
    this.loadDepartments();
    
    // Set custom filter logic for MatTableDataSource
    this.dataSource.filterPredicate = (data: Employee, filter: string) => {
      const parsedFilter = JSON.parse(filter);
      const search = parsedFilter.search.toLowerCase();
      const deptId = parsedFilter.deptId;

      // Filter by search query
      const matchesSearch = 
        data.firstName.toLowerCase().includes(search) ||
        data.lastName.toLowerCase().includes(search) ||
        data.employeeCode.toLowerCase().includes(search) ||
        data.email.toLowerCase().includes(search);

      // Filter by department ID
      const matchesDept = deptId === 0 || data.departmentId === deptId;

      return matchesSearch && matchesDept;
    };
  }

  loadEmployees(): void {
    this.employeeService.getAllEmployees().subscribe(emps => {
      this.dataSource.data = emps;
      this.dataSource.paginator = this.paginator;
      this.dataSource.sort = this.sort;
      this.cdr.detectChanges();
    });
  }

  loadDepartments(): void {
    this.departmentService.getAllDepartments().subscribe(depts => {
      this.departments = [
        { id: 0, name: 'All Departments' },
        ...depts.map(d => ({ id: d.departmentId, name: d.departmentName }))
      ];
      this.cdr.detectChanges();
    });
  }

  applyFilter(): void {
    const filterObj = {
      search: this.searchQuery,
      deptId: this.selectedDepartmentId
    };
    this.dataSource.filter = JSON.stringify(filterObj);
  }

  onSearch(event: Event): void {
    this.searchQuery = (event.target as HTMLInputElement).value.trim();
    this.applyFilter();
  }

  onDeptFilter(deptId: number): void {
    this.selectedDepartmentId = deptId;
    this.applyFilter();
  }

  openAddDialog(): void {
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      data: {}
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeeService.createEmployee(result).subscribe({
          next: (newEmp) => {
            this.loadEmployees();
            this.toastService.success(`Registered ${newEmp.fullName} successfully!`);
            
            // Open beautiful credentials dispatch modal popup
            this.dialog.open(CredentialsDialogComponent, {
              width: '450px',
              data: {
                fullName: newEmp.fullName || `${newEmp.firstName} ${newEmp.lastName}`,
                email: newEmp.email,
                username: result.username,
                password: result.password
              },
              disableClose: true
            });
          },
          error: (err) => {
            const errMsg = err?.error?.message || 'Failed to register new employee.';
            this.toastService.error(errMsg);
          }
        });
      }
    });
  }

  openEditDialog(employee: Employee, event: Event): void {
    event.stopPropagation(); // Avoid triggering row clicks
    const dialogRef = this.dialog.open(EmployeeFormComponent, {
      width: '600px',
      data: { employee }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.employeeService.updateEmployee(employee.employeeId, result).subscribe(success => {
          if (success) {
            this.loadEmployees();
            this.toastService.success('Employee profile updated successfully.');
          } else {
            this.toastService.error('Failed to update employee details.');
          }
        });
      }
    });
  }

  deleteEmployee(id: number, name: string, event: Event): void {
    event.stopPropagation(); // Avoid row click redirection
    
    if (confirm(`Are you sure you want to delete ${name}? This action cannot be undone.`)) {
      this.employeeService.deleteEmployee(id).subscribe(success => {
        if (success) {
          this.loadEmployees();
          this.toastService.error(`Removed ${name} from organization records.`);
        } else {
          this.toastService.error('Failed to delete employee records.');
        }
      });
    }
  }

  viewDetails(employeeId: number, event?: Event): void {
    if (event) {
      event.stopPropagation();
    }
    this.router.navigate(['/employees', employeeId]);
  }

  getProfileImageUrl(profileImage: string | undefined): string {
    if (!profileImage) {
      return 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?auto=format&fit=crop&q=80&w=60';
    }
    if (profileImage.startsWith('http://') || profileImage.startsWith('https://')) return profileImage;
    const baseUrl = environment.apiUrl.replace('/api', '');
    return `${baseUrl}${profileImage.startsWith('/') ? '' : '/'}${profileImage}`;
  }

  getInitials(fullName: string | undefined): string {
    if (!fullName) return '??';
    const parts = fullName.trim().split(/[.\s_-]+/);
    const initials = parts.filter(p => p.length > 0).map(p => p[0]).join('').toUpperCase();
    return initials.substring(0, 2);
  }
}
