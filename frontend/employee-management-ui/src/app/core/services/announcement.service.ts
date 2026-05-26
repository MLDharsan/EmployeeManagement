import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Announcement } from '../models/announcement.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class AnnouncementService {
  constructor(private http: HttpClient) { }

  getAnnouncements(): Observable<Announcement[]> {
    return this.http.get<Announcement[]>(`${environment.apiUrl}/announcements`).pipe(
      map(items => items.map(i => ({
        ...i,
        authorName: i.authorName || 'HR Administration'
      })))
    );
  }

  createAnnouncement(title: string, message: string): Observable<Announcement> {
    const dto = { title, message };
    return this.http.post<Announcement>(`${environment.apiUrl}/announcements`, dto).pipe(
      map(i => ({
        ...i,
        authorName: 'HR Administration'
      }))
    );
  }

  deleteAnnouncement(id: number): Observable<boolean> {
    return this.http.delete(`${environment.apiUrl}/announcements/${id}`, { responseType: 'text' }).pipe(
      map(() => true)
    );
  }
}
