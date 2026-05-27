import { Component, OnInit, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { RouterModule } from '@angular/router';
import {
  ChartComponent,
  NgApexchartsModule,
  ApexNonAxisChartSeries,
  ApexResponsive,
  ApexChart,
  ApexXAxis,
  ApexYAxis,
  ApexDataLabels,
  ApexTheme,
  ApexTitleSubtitle,
  ApexFill,
  ApexGrid,
  ApexPlotOptions,
  ApexStroke,
  ApexLegend
} from 'ng-apexcharts';

import { EmployeeService } from '../../core/services/employee.service';
import { LeaveService } from '../../core/services/leave.service';
import { AttendanceService } from '../../core/services/attendance.service';
import { AuthService } from '../../core/services/auth.service';
import { DepartmentService } from '../../core/services/department.service';
import { Employee, Department } from '../../core/models/employee.model';
import { LeaveRequest } from '../../core/models/leave.model';
import { Attendance } from '../../core/models/attendance.model';
import { forkJoin } from 'rxjs';

export type DonutChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  responsive: ApexResponsive[];
  labels: any;
  colors: string[];
  legend: ApexLegend;
};

export type BarChartOptions = {
  series: any;
  chart: ApexChart;
  xaxis: ApexXAxis;
  yaxis: ApexYAxis;
  dataLabels: ApexDataLabels;
  colors: string[];
  grid: ApexGrid;
  plotOptions: ApexPlotOptions;
  stroke: ApexStroke;
  legend: ApexLegend;
};

export type RadialChartOptions = {
  series: ApexNonAxisChartSeries;
  chart: ApexChart;
  labels: string[];
  colors: string[];
  plotOptions: ApexPlotOptions;
};

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    RouterModule,
    NgApexchartsModule
  ],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.css']
})
export class DashboardComponent implements OnInit {
  // Counts
  totalEmployees = 0;
  totalDepartments = 0; // Dynamic count
  pendingLeaves = 0;
  presentToday = 0;

  // Active user session info
  userName = '';
  userRole = '';

  // Charts
  @ViewChild('donutChart') donutChart!: ChartComponent;
  @ViewChild('barChart') barChart!: ChartComponent;
  @ViewChild('radialChart') radialChart!: ChartComponent;

  public deptChartOptions!: Partial<DonutChartOptions>;
  public attendanceChartOptions!: Partial<BarChartOptions>;
  public leaveChartOptions!: Partial<RadialChartOptions>;

  approvedLeavePercentage = 0; // Dynamic rate

  constructor(
    private employeeService: EmployeeService,
    private leaveService: LeaveService,
    private attendanceService: AttendanceService,
    private authService: AuthService,
    private departmentService: DepartmentService
  ) {
    this.userName = this.authService.currentUserValue?.username || '';
    this.userRole = this.authService.currentUserValue?.role || '';
  }

  ngOnInit(): void {
    // Only fetch corporate KPI counts and initialize charts if the logged-in user is HR
    if (this.userRole === 'HR') {
      forkJoin({
        employees: this.employeeService.getAllEmployees(),
        departments: this.departmentService.getAllDepartments(),
        leaves: this.leaveService.getAllLeaveRequests(),
        attendance: this.attendanceService.getAllAttendance()
      }).subscribe(({ employees, departments, leaves, attendance }) => {
        this.totalEmployees = employees.length;
        this.totalDepartments = departments.length;
        this.pendingLeaves = leaves.filter(l => l.status === 'Pending').length;

        // Find logs with today's date
        const todayStr = new Date().toISOString().split('T')[0];
        this.presentToday = attendance.filter(l => l.date.split('T')[0] === todayStr && (l.status === 'Present' || l.status === 'Late')).length;

        // Initialize analytic charts with dynamic DB data
        this.initDeptChart(employees, departments);
        this.initAttendanceChart(attendance, employees.length);
        this.initLeaveChart(leaves);
      });
    }
  }

  private initDeptChart(employees: Employee[], departments: Department[]): void {
    // Count employees in each department
    const deptCounts = departments.map(dept => {
      return employees.filter(emp => emp.departmentId === dept.departmentId).length;
    });

    const deptLabels = departments.map(dept => dept.departmentName);

    // Premium color palette for departments
    const colorsPalette = ['#2563eb', '#10b981', '#f59e0b', '#8b5cf6', '#ec4899', '#3b82f6'];
    const deptColors = departments.map((_, index) => colorsPalette[index % colorsPalette.length]);

    // Chart 1: Employees by Department (Donut)
    this.deptChartOptions = {
      series: deptCounts,
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      labels: deptLabels,
      colors: deptColors,
      legend: {
        position: 'bottom',
        fontSize: '12px',
        fontWeight: 500,
        labels: {
          colors: 'var(--text-secondary)'
        }
      },
      responsive: [
        {
          breakpoint: 480,
          options: {
            chart: {
              width: 200
            },
            legend: {
              position: 'bottom'
            }
          }
        }
      ]
    };
  }

  private initAttendanceChart(attendance: Attendance[], totalEmployeesCount: number): void {
    // Generate dates for current week (Monday to Friday)
    const today = new Date();
    const currentDay = today.getDay(); // 0 is Sunday, 1 is Monday, etc.
    const mondayOffset = currentDay === 0 ? -6 : 1 - currentDay;
    const monday = new Date(today);
    monday.setDate(today.getDate() + mondayOffset);

    const weekDates = Array.from({ length: 5 }, (_, i) => {
      const d = new Date(monday);
      d.setDate(monday.getDate() + i);
      return d.toISOString().split('T')[0];
    });

    const presentData: number[] = [];
    const lateData: number[] = [];
    const absentData: number[] = [];

    weekDates.forEach(dateStr => {
      const dailyLogs = attendance.filter(log => log.date.split('T')[0] === dateStr);
      const presentCount = dailyLogs.filter(log => log.status === 'Present').length;
      const lateCount = dailyLogs.filter(log => log.status === 'Late').length;
      
      // Calculate absent count: totalEmployeesCount - (presentCount + lateCount)
      // Capped at 0 to avoid negative numbers if data is slightly inconsistent
      const absentCount = Math.max(0, totalEmployeesCount - (presentCount + lateCount));

      presentData.push(presentCount);
      lateData.push(lateCount);
      absentData.push(absentCount);
    });

    // Chart 2: Weekly Attendance statistics (Clustered column bar chart)
    this.attendanceChartOptions = {
      series: [
        {
          name: 'Present',
          data: presentData
        },
        {
          name: 'Late',
          data: lateData
        },
        {
          name: 'Absent',
          data: absentData
        }
      ],
      chart: {
        type: 'bar',
        height: 280,
        toolbar: { show: false },
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      plotOptions: {
        bar: {
          horizontal: false,
          columnWidth: '55%',
          borderRadius: 4
        }
      },
      dataLabels: {
        enabled: false
      },
      stroke: {
        show: true,
        width: 2,
        colors: ['transparent']
      },
      xaxis: {
        categories: ['Mon', 'Tue', 'Wed', 'Thu', 'Fri'],
        labels: {
          style: {
            colors: 'var(--text-secondary)',
            fontSize: '11px',
            fontWeight: 500
          }
        }
      },
      yaxis: {
        labels: {
          style: {
            colors: 'var(--text-secondary)'
          }
        }
      },
      colors: ['#10b981', '#f59e0b', '#ef4444'], // Emerald (Present), Amber (Late), Red (Absent)
      grid: {
        borderColor: 'var(--surface-border)',
        strokeDashArray: 4
      },
      legend: {
        position: 'top',
        fontSize: '12px',
        fontWeight: 500,
        labels: {
          colors: 'var(--text-secondary)'
        }
      }
    };
  }

  private initLeaveChart(leaves: LeaveRequest[]): void {
    const totalLeaves = leaves.length;
    const approvedLeaves = leaves.filter(l => l.status === 'Approved').length;
    
    this.approvedLeavePercentage = totalLeaves > 0 ? (approvedLeaves / totalLeaves) * 100 : 0;

    // Chart 3: Leave Requests overview (Radial Bar)
    this.leaveChartOptions = {
      series: [Math.round(this.approvedLeavePercentage)],
      chart: {
        type: 'radialBar',
        height: 280,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      plotOptions: {
        radialBar: {
          hollow: {
            size: '70%',
          },
          dataLabels: {
            name: {
              fontSize: '16px',
              fontFamily: 'Outfit, sans-serif',
              color: 'var(--text-primary)'
            },
            value: {
              fontSize: '14px',
              color: 'var(--text-secondary)'
            },
            total: {
              show: true,
              label: 'Approved Leaves',
              color: 'var(--text-primary)',
              formatter: () => {
                return Math.round(this.approvedLeavePercentage) + '%';
              }
            }
          }
        }
      },
      labels: ['Approved Leaves'],
      colors: ['#2563eb'] // Azure Blue
    };
  }
}
