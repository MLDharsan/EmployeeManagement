using EmployeeManagement.api.Data;
using EmployeeManagement.api.DTOs.EmployeeLevel;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Models;
using Microsoft.EntityFrameworkCore;

namespace EmployeeManagement.api.Services
{
    public class EmployeeLevelService : IEmployeeLevelService
    {
        private readonly AppDbContext _context;

        public EmployeeLevelService(AppDbContext context)
        {
            _context = context;
        }

        public async Task<List<EmployeeLevelDto>> GetAllLevels()
        {
            var levels = await _context.EmployeeLevel.ToListAsync();
            return levels.Select(l => new EmployeeLevelDto
            {
                LevelId = l.LevelId,
                LevelName = l.LevelName,
                AllowedLeaveDays = l.AllowedLeaveDays
            }).ToList();
        }

        public async Task<EmployeeLevelDto?> GetLevelById(int id)
        {
            var level = await _context.EmployeeLevel.FindAsync(id);
            if (level == null) return null;
            return new EmployeeLevelDto
            {
                LevelId = level.LevelId,
                LevelName = level.LevelName,
                AllowedLeaveDays = level.AllowedLeaveDays
            };
        }

        public async Task<EmployeeLevelDto> CreateLevel(CreateEmployeeLevelDto dto)
        {
            var level = new EmployeeLevel
            {
                LevelName = dto.LevelName,
                AllowedLeaveDays = dto.AllowedLeaveDays
            };
            _context.EmployeeLevel.Add(level);
            await _context.SaveChangesAsync();

            return new EmployeeLevelDto
            {
                LevelId = level.LevelId,
                LevelName = level.LevelName,
                AllowedLeaveDays = level.AllowedLeaveDays
            };
        }

        public async Task<bool> UpdateLevel(int id, UpdateEmployeeLevelDto dto)
        {
            var level = await _context.EmployeeLevel.FindAsync(id);
            if (level == null) return false;

            int oldAllowedLeaves = level.AllowedLeaveDays;

            int diffAnnual = dto.AllowedLeaveDays - oldAllowedLeaves;

            level.LevelName = dto.LevelName;
            level.AllowedLeaveDays = dto.AllowedLeaveDays;

            if (diffAnnual != 0)
            {
                var employeesToUpdate = await _context.Employees.Where(e => e.LevelId == id).ToListAsync();
                foreach (var emp in employeesToUpdate)
                {
                    emp.RemainingLeaveDays += diffAnnual;
                    if (emp.RemainingLeaveDays < 0) emp.RemainingLeaveDays = 0;
                }
            }

            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> DeleteLevel(int id)
        {
            var level = await _context.EmployeeLevel.FindAsync(id);
            if (level == null) return false;

            // Check if level has active employee headcount (business safety constraint)
            var hasEmployees = await _context.Employees.AnyAsync(e => e.LevelId == id);
            if (hasEmployees)
            {
                return false;
            }

            _context.EmployeeLevel.Remove(level);
            await _context.SaveChangesAsync();
            return true;
        }
    }
}
