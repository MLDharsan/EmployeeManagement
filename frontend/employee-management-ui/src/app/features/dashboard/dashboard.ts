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
  totalDepartments = 3; // Mock fixed count
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

  constructor(
    private employeeService: EmployeeService,
    private leaveService: LeaveService,
    private attendanceService: AttendanceService,
    private authService: AuthService
  ) {
    this.userName = this.authService.currentUserValue?.username || '';
    this.userRole = this.authService.currentUserValue?.role || '';
  }

  ngOnInit(): void {
    // Only fetch corporate KPI counts and initialize charts if the logged-in user is HR
    if (this.userRole === 'HR') {
      this.employeeService.getAllEmployees().subscribe(emps => {
        this.totalEmployees = emps.length;
      });

      this.leaveService.getAllLeaveRequests().subscribe(leaves => {
        this.pendingLeaves = leaves.filter(l => l.status === 'Pending').length;
      });

      this.attendanceService.getAllAttendance().subscribe(logs => {
        // Find logs with today's date
        const todayStr = new Date().toISOString().split('T')[0];
        this.presentToday = logs.filter(l => l.date.split('T')[0] === todayStr && (l.status === 'Present' || l.status === 'Late')).length;
      });

      // Initialize analytic charts
      this.initDeptChart();
      this.initAttendanceChart();
      this.initLeaveChart();
    }
  }

  private initDeptChart(): void {
    // Chart 1: Employees by Department (Donut)
    this.deptChartOptions = {
      series: [2, 2, 1], // HR, Software Engineering, Product Design matching mock DB
      chart: {
        type: 'donut',
        height: 280,
        fontFamily: 'Plus Jakarta Sans, sans-serif'
      },
      labels: ['Human Resources', 'Software Engineering', 'Product & Design'],
      colors: ['#2563eb', '#10b981', '#f59e0b'], // Sleek professional Hex codes
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

  private initAttendanceChart(): void {
    // Chart 2: Weekly Attendance statistics (Clustered column bar chart)
    this.attendanceChartOptions = {
      series: [
        {
          name: 'Present',
          data: [15, 18, 14, 16, 17] // Mock values for Mon-Fri
        },
        {
          name: 'Late',
          data: [2, 1, 3, 2, 1]
        },
        {
          name: 'Absent',
          data: [1, 0, 2, 1, 0]
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

  private initLeaveChart(): void {
    // Chart 3: Leave Requests overview (Radial Bar)
    this.leaveChartOptions = {
      series: [75], // Consolidated leaves percentage
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
              formatter: function (w) {
                return '75%';
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
