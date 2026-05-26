import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';
import { EmployeeLevel } from '../models/employee.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class LevelService {
  constructor(private http: HttpClient) { }

  getAllLevels(): Observable<EmployeeLevel[]> {
    return this.http.get<EmployeeLevel[]>(`${environment.apiUrl}/employeelevels`);
  }

  getLevelById(id: number): Observable<EmployeeLevel | undefined> {
    return this.http.get<EmployeeLevel>(`${environment.apiUrl}/employeelevels/${id}`).pipe(
      catchError(() => of(undefined))
    );
  }

  createLevel(dto: { levelName: string; allowedLeaveDays: number }): Observable<EmployeeLevel> {
    return this.http.post<EmployeeLevel>(`${environment.apiUrl}/employeelevels`, dto);
  }

  updateLevel(id: number, dto: { levelName: string; allowedLeaveDays: number }): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/employeelevels/${id}`, dto).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }

  deleteLevel(id: number): Observable<boolean> {
    return this.http.delete(`${environment.apiUrl}/employeelevels/${id}`).pipe(
      map(() => true),
      catchError(() => of(false))
    );
  }
}
