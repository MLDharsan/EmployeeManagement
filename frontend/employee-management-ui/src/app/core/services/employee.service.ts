import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of, throwError } from 'rxjs';
import { map, catchError, delay, switchMap } from 'rxjs/operators';
import { Employee, CreateEmployeeDto, UpdateEmployeeDto } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class EmployeeService {
  constructor(private http: HttpClient) { }

  getAllEmployees(): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${environment.apiUrl}/employees`);
  }

  getEmployeeById(id: number): Observable<Employee | undefined> {
    return this.http.get<Employee>(`${environment.apiUrl}/employees/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  createEmployee(dto: CreateEmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(`${environment.apiUrl}/employees`, dto);
  }

  updateEmployee(id: number, dto: UpdateEmployeeDto): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/employees/${id}`, dto, { responseType: 'text' }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  // Specific employee editing their own details (restricted fields)
  updateProfile(id: number, phone: string, address: string, email: string, recoveryEmail?: string): Observable<Employee> {
    return this.getEmployeeById(id).pipe(
      switchMap(emp => {
        if (!emp) {
          return throwError(() => new Error('Employee not found'));
        }
        
        const dto: UpdateEmployeeDto = {
          firstName: emp.firstName,
          lastName: emp.lastName,
          email: email,
          recoveryEmail: recoveryEmail,
          phone: phone,
          address: address,
          departmentId: emp.departmentId,
          levelId: emp.levelId
        };

        return this.http.put(`${environment.apiUrl}/employees/${id}`, dto, { responseType: 'text' }).pipe(
          map(() => ({
            ...emp,
            phone,
            address,
            email,
            recoveryEmail
          }))
        );
      })
    );
  }

  deleteEmployee(id: number): Observable<boolean> {
    return this.http.delete(`${environment.apiUrl}/employees/${id}`, { responseType: 'text' }).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  uploadProfileImage(id: number, file: File): Observable<{ imageUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ imageUrl: string }>(`${environment.apiUrl}/employees/${id}/upload-profile-photo`, formData);
  }

  uploadCV(id: number, file: File): Observable<{ cvUrl: string }> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<{ cvUrl: string }>(`${environment.apiUrl}/employees/${id}/upload-cv`, formData);
  }

  // Deduct leave days when leave is approved
  deductLeaveDays(id: number, days: number): void {
    // Standard leave deduction happens on the backend database inside LeaveRequest approval flows.
  }
}
