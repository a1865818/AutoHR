using Microsoft.AspNetCore.Authorization;
using System.Security.Claims;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using WebApplication1.Entities;
using WebApplication1.Services.Interfaces;

namespace WebApplication1.Controllers
{
    [Route("api/[controller]")]
    [ApiController]
    public class JobsController : ControllerBase
    {
        private readonly IJobService _jobService;

        public JobsController(IJobService jobService)
        {
            _jobService = jobService;
        }

        // GET: api/jobs - Public endpoint to view all jobs
        [HttpGet]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Jobs>>> GetJobs([FromQuery] string? status = null, [FromQuery] string? company = null)
        {
            IEnumerable<Jobs> jobs;

            if (!string.IsNullOrEmpty(status))
            {
                jobs = await _jobService.GetJobsByStatusAsync(status);
            }
            else if (!string.IsNullOrEmpty(company))
            {
                jobs = await _jobService.GetJobsByCompanyAsync(company);
            }
            else
            {
                jobs = await _jobService.GetAllJobsAsync();
            }
            return Ok(jobs);
        }

        // GET: api/jobs/search - Public endpoint to search jobs
        [HttpGet("search")]
        [AllowAnonymous]
        public async Task<ActionResult<IEnumerable<Jobs>>> SearchJobs([FromQuery] string searchTerm)
        {
            if (string.IsNullOrEmpty(searchTerm))
                return BadRequest("Search term is required");

            var jobs = await _jobService.SearchJobsAsync(searchTerm);
            return Ok(jobs);
        }

        // GET: api/jobs/{id} - Public endpoint to view a specific job
        [HttpGet("{id:guid}")]
        [AllowAnonymous]
        public async Task<ActionResult<Jobs>> GetJob(Guid id)
        {
            var job = await _jobService.GetJobByIdAsync(id);
            if (job == null)
                return NotFound();
            return Ok(job);
        }

        // POST: api/jobs - Admin only endpoint to create jobs
        [HttpPost]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Jobs>> CreateJob([FromBody] Jobs job)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value ?? "";
            var createdJob = await _jobService.CreateJobAsync(job, userId);
            return CreatedAtAction(nameof(GetJob), new { id = createdJob.Id }, createdJob);
        }

        // PUT: api/jobs/{id} - Admin only endpoint to update jobs
        [HttpPut("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult<Jobs>> UpdateJob(Guid id, [FromBody] Jobs job)
        {
            if (!ModelState.IsValid)
                return BadRequest(ModelState);

            var updatedJob = await _jobService.UpdateJobAsync(id, job);
            if (updatedJob == null)
                return NotFound();

            return Ok(updatedJob);
        }

        // DELETE: api/jobs/{id} - Admin only endpoint to delete jobs
        [HttpDelete("{id:guid}")]
        [Authorize(Roles = "Admin")]
        public async Task<IActionResult> DeleteJob(Guid id)
        {
            var result = await _jobService.DeleteJobAsync(id);
            if (!result)
                return NotFound();

            return NoContent();
        }

        // POST: api/jobs/{id}/apply - Authenticated users only can apply
        [HttpPost("{id:guid}/apply")]
        [Authorize] // Only authenticated users can apply
        public async Task<IActionResult> ApplyToJob(Guid id)
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found");

            var result = await _jobService.IncrementApplicantsAsync(id);
            if (!result)
                return NotFound("Job not found");

            return Ok(new
            {
                message = "Application submitted successfully",
                jobId = id,
                appliedBy = userId
            });
        }

        // GET: api/jobs/stats - Admin only endpoint to get job statistics
        [HttpGet("stats")]
        [Authorize(Roles = "Admin")]
        public async Task<ActionResult> GetJobStats()
        {
            var allJobs = await _jobService.GetAllJobsAsync();
            var stats = new
            {
                TotalJobs = allJobs.Count(),
                ActiveJobs = allJobs.Count(j => j.Status.ToLower() == "active"),
                InactiveJobs = allJobs.Count(j => j.Status.ToLower() == "inactive"),
                TotalApplicants = allJobs.Sum(j => j.Applicants),
                AverageApplicantsPerJob = allJobs.Any() ? allJobs.Average(j => j.Applicants) : 0,
                CompaniesByJobCount = allJobs
                    .GroupBy(j => j.Company)
                    .Select(g => new { Company = g.Key, JobCount = g.Count() })
                    .OrderByDescending(x => x.JobCount)
                    .Take(10),
                JobsByStatus = allJobs
                    .GroupBy(j => j.Status)
                    .Select(g => new { Status = g.Key, Count = g.Count() }),
                RecentJobs = allJobs
                    .OrderByDescending(j => j.PostedDate)
                    .Take(5)
                    .Select(j => new { j.Id, j.Title, j.Company, j.PostedDate, j.Applicants })
            };

            return Ok(stats);
        }

        // GET: api/jobs/my-applications - Authenticated users can see their applications
        [HttpGet("my-applications")]
        [Authorize]
        public async Task<ActionResult> GetMyApplications()
        {
            var userId = User.FindFirst(ClaimTypes.NameIdentifier)?.Value;
            if (string.IsNullOrEmpty(userId))
                return Unauthorized("User ID not found");

            // This would require a new service method to track user applications
            // For now, we'll return a placeholder response
            return Ok(new
            {
                message = "This endpoint would show jobs the user has applied to",
                userId = userId,
                note = "Implement application tracking in the database to make this functional"
            });
        }
    }
}