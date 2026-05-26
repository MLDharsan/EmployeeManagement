import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http'; 
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { LeaveRequest, CreateLeaveRequestDto, LeaveBalance } from '../models/leave.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LeaveService {
  constructor(private http: HttpClient) { }

  getAllLeaveRequests(): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${environment.apiUrl}/leaverequests`);
  }

  getEmployeeLeaveRequests(employeeId: number): Observable<LeaveRequest[]> {
    return this.http.get<LeaveRequest[]>(`${environment.apiUrl}/leaverequests/employee/${employeeId}`);
  }

  createLeaveRequest(dto: CreateLeaveRequestDto, employeeName: string = ''): Observable<LeaveRequest> {
    return this.http.post<LeaveRequest>(`${environment.apiUrl}/leaverequests`, dto);
  }

  approveLeaveRequest(id: number): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/leaverequests/${id}/approve`, {}, { responseType: 'text' }).pipe(
      map(() => true)
    );
  }

  rejectLeaveRequest(id: number): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/leaverequests/${id}/reject`, {}, { responseType: 'text' }).pipe(
      map(() => true)
    );
  }

  // Get breakdown of leaves for standard card UI
  getLeaveBalances(
    remainingLeaveDays: number, 
    allowedLeaveDays?: number
  ): LeaveBalance[] {
    const totalDays = allowedLeaveDays !== undefined ? allowedLeaveDays : 14;

    return [
      {
        leaveType: 'Leaves',
        totalDays: totalDays,
        usedDays: Math.max(0, totalDays - remainingLeaveDays),
        remainingDays: remainingLeaveDays
      }
    ];
  }
}
