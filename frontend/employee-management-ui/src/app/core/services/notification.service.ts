import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map } from 'rxjs/operators';
import { Notification } from '../models/notification.model';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<Notification[]>([]);
  public notifications$: Observable<Notification[]> = this.notificationsSubject.asObservable();

  constructor(private http: HttpClient) { }

  // Get notifications for currently logged in user
  getUserNotifications(userId: number): Observable<Notification[]> {
    return this.http.get<Notification[]>(`${environment.apiUrl}/notifications/${userId}`).pipe(
      tap(notifs => {
        this.notificationsSubject.next(notifs);//updates BehavoioralSubject with new nortiftcation
      })//push nw value to all subscribers .next()
    );
  }

  // Create new notification
  createNotification(title: string, message: string, userId: number, senderName?: string): Observable<Notification> {
    const dto = { title, message, userId, senderName };
    return this.http.post<Notification>(`${environment.apiUrl}/notifications`, dto).pipe(
      tap(newNotif => { //runs after nortification creation
        const current = this.notificationsSubject.value;
        this.notificationsSubject.next([newNotif, ...current]);
      })
    );
  }

  // Mark single notification as read
  markAsRead(id: number): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/notifications/${id}/read`, {}, { responseType: 'text' }).pipe(
      map(() => {
        const updated = this.notificationsSubject.value.map(n => {
          if (n.notificationId === id) {
            return { ...n, isRead: true };
          }
          return n;
        });
        this.notificationsSubject.next(updated);
        return true;
      })
    );
  }

  // Mark all notifications for a user as read
  markAllAsRead(userId: number): Observable<boolean> {
    return this.http.put(`${environment.apiUrl}/notifications/read-all/${userId}`, {}, { responseType: 'text' }).pipe(
      map(() => {
        const updated = this.notificationsSubject.value.map(n => ({
          ...n,
          isRead: true
        }));
        this.notificationsSubject.next(updated);
        return true;
      })
    );
  }

  // Delete notification by ID
  deleteNotification(id: number): Observable<boolean> {
    return this.http.delete(`${environment.apiUrl}/notifications/${id}`, { responseType: 'text' }).pipe(
      map(() => {
        const updated = this.notificationsSubject.value.filter(n => n.notificationId !== id);
        this.notificationsSubject.next(updated);
        return true;
      })
    );
  }

  // Delete all notifications for a user
  deleteAllNotifications(userId: number): Observable<boolean> {
    return this.http.delete(`${environment.apiUrl}/notifications/clear-all/${userId}`, { responseType: 'text' }).pipe(
      map(() => {
        // Keep other users' notifications or sent communications in the subject if any, but clear user's received ones
        const updated = this.notificationsSubject.value.filter(n => n.userId !== userId);
        this.notificationsSubject.next(updated);
        return true;
      })
    );
  }
}
