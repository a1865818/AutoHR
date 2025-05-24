using Microsoft.EntityFrameworkCore;
using WebApplication1.Data;
using WebApplication1.Entities;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Services
{
    public class JobService : IJobService
    {
        private readonly ApplicationDbContext _context;

        public JobService(ApplicationDbContext context)
        {
            _context = context;
        }

        public async Task<IEnumerable<Jobs>> GetAllJobsAsync()
        {
            return await _context.Jobs
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Jobs>> GetJobsByStatusAsync(string status)
        {
            return await _context.Jobs
                .Where(j => j.Status.ToLower() == status.ToLower())
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Jobs>> GetJobsByCompanyAsync(string company)
        {
            return await _context.Jobs
                .Where(j => j.Company.ToLower().Contains(company.ToLower()))
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<IEnumerable<Jobs>> SearchJobsAsync(string searchTerm)
        {
            var lowerSearchTerm = searchTerm.ToLower();

            return await _context.Jobs
                .Where(j => j.Title.ToLower().Contains(lowerSearchTerm) ||
                           j.Company.ToLower().Contains(lowerSearchTerm) ||
                           j.Location.ToLower().Contains(lowerSearchTerm) ||
                           j.Description.ToLower().Contains(lowerSearchTerm) ||
                           (j.Requirements != null && j.Requirements.ToLower().Contains(lowerSearchTerm)))
                .OrderByDescending(j => j.PostedDate)
                .ToListAsync();
        }

        public async Task<Jobs?> GetJobByIdAsync(Guid id)
        {
            return await _context.Jobs.FindAsync(id);
        }

        public async Task<Jobs> CreateJobAsync(Jobs job, string userId)
        {
            job.Id = Guid.NewGuid();
            job.PostedDate = DateTime.Now;
            job.CreatedBy = userId;
            job.Applicants = 0;

            // Set default status if not provided
            if (string.IsNullOrEmpty(job.Status))
                job.Status = "Active";

            _context.Jobs.Add(job);
            await _context.SaveChangesAsync();
            return job;
        }

        public async Task<Jobs?> UpdateJobAsync(Guid id, Jobs job)
        {
            var existingJob = await _context.Jobs.FindAsync(id);
            if (existingJob == null)
                return null;

            // Update properties
            existingJob.Title = job.Title;
            existingJob.Company = job.Company;
            existingJob.Location = job.Location;
            existingJob.Type = job.Type;
            existingJob.Experience = job.Experience;
            existingJob.Salary = job.Salary;
            existingJob.Description = job.Description;
            existingJob.Requirements = job.Requirements;
            existingJob.Status = job.Status;
            existingJob.Urgency = job.Urgency;

            // Don't update PostedDate, CreatedBy, or Applicants during updates
            // These should be managed separately

            await _context.SaveChangesAsync();
            return existingJob;
        }

        public async Task<bool> DeleteJobAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                return false;

            _context.Jobs.Remove(job);
            await _context.SaveChangesAsync();
            return true;
        }

        public async Task<bool> IncrementApplicantsAsync(Guid id)
        {
            var job = await _context.Jobs.FindAsync(id);
            if (job == null)
                return false;

            job.Applicants++;
            await _context.SaveChangesAsync();
            return true;
        }
    }
}