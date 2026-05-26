export interface Attendance {
  attendanceId: number;
  date: string;
  checkInTime: string;
  checkOutTime: string | null;
  workingHours: number | null;
  employeeId: number;
  status?: 'Present' | 'Late' | 'Absent' | 'Half Day'; // UI helper field
  employeeName?: string; // UI helper field
}
