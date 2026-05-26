export interface Department {
  departmentId: number;
  departmentName: string;
  description?: string;
}

export interface EmployeeLevel {
  levelId: number;
  levelName: string;
  allowedLeaveDays: number;
  baseSalary?: number;
}

export interface Employee {
  employeeId: number;
  employeeCode: string;
  firstName: string;
  lastName: string;
  fullName?: string; // Derived or mapped from EmployeeDto
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  joiningDate: string;
  departmentId: number;
  departmentName?: string;
  levelId: number;
  levelName?: string;
  remainingLeaveDays: number;
  allowedLeaveDays?: number;
  profileImage?: string;
  cvPath?: string;
  userId?: number;
}

export interface CreateEmployeeDto {
  employeeCode: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  dob: string;
  gender: string;
  joiningDate: string;
  departmentId: number;
  levelId: number;
  username?: string;
  password?: string;
}

export interface UpdateEmployeeDto {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  departmentId: number;
  levelId: number;
}
