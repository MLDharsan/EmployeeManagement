export interface LeaveRequest {
  leaveRequestId: number;
  employeeId: number;
  employeeName?: string; // UI helper field
  leaveType: 'Annual' | 'Sick' | 'Casual' | 'Unpaid' | string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'Pending' | 'Approved' | 'Rejected' | string;
  daysCount?: number; // UI derived field
}

export interface CreateLeaveRequestDto {
  employeeId: number;
  leaveType: string;
  startDate: string;
  endDate: string;
  reason: string;
}

export interface LeaveBalance {
  leaveType: string;
  totalDays: number;
  usedDays: number;
  remainingDays: number;
}
