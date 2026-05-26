import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Attendance } from '../models/attendance.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AttendanceService {
  constructor(private http: HttpClient) { }

  getAllAttendance(): Observable<Attendance[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/attendances`).pipe(
      map(logs => logs.map(l => this.mapDtoToModel(l)))
    );
  }

  getEmployeeAttendance(employeeId: number): Observable<Attendance[]> {
    return this.http.get<any[]>(`${environment.apiUrl}/attendances/employee/${employeeId}`).pipe(
      map(logs => logs.map(l => this.mapDtoToModel(l)))
    );
  }

  getTodayStatus(employeeId: number): Observable<Attendance | undefined> {
    const today = new Date().toISOString().split('T')[0];
    return this.getEmployeeAttendance(employeeId).pipe(
      map(logs => logs.find(l => {
        const logDateStr = l.date.split('T')[0];
        return logDateStr === today;
      }))
    );
  }

  checkIn(employeeId: number, employeeName: string = ''): Observable<Attendance> {
    return this.http.post<any>(`${environment.apiUrl}/attendances/check-in/${employeeId}`, {}).pipe(
      map(log => this.mapDtoToModel(log))
    );
  }

  checkOut(employeeId: number): Observable<boolean> {
    return this.http.post<any>(`${environment.apiUrl}/attendances/check-out/${employeeId}`, {}).pipe(
      map(() => true)
    );
  }

  private mapDtoToModel(dto: any): Attendance {
    return {
      attendanceId: dto.attendanceId,
      date: dto.date,
      checkInTime: dto.checkInTime,
      checkOutTime: dto.checkOutTime,
      workingHours: dto.workingHours,
      employeeId: dto.employeeId,
      status: dto.status,
      employeeName: dto.employeeName
    };
  }
}
