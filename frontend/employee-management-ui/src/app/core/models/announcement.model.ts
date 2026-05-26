export interface Announcement {
  announcementId: number;
  title: string;
  message: string;
  createdAt: string;
  authorName?: string; // UI helper field (e.g. 'HR Admin')
}
