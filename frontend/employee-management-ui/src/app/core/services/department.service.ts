import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { Department } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class DepartmentService {
  constructor(private http: HttpClient) { }

  getAllDepartments(): Observable<Department[]> {
    return this.http.get<Department[]>(`${environment.apiUrl}/departments`);
  }

  getDepartmentById(id: number): Observable<Department | undefined> {
    return this.http.get<Department>(`${environment.apiUrl}/departments/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  createDepartment(dto: { departmentName: string; description: string }): Observable<Department> {
    return this.http.post<Department>(`${environment.apiUrl}/departments`, dto);
  }

  updateDepartment(id: number, dto: { departmentName: string; description: string }): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/departments/${id}`, dto).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  deleteDepartment(id: number): Observable<boolean> {
    return this.http.delete(`${environment.apiUrl}/departments/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
