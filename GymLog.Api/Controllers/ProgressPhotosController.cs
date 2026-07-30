using GymLog.Api.DTOs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace GymLog.Api.Controllers
{
    [ApiController]
    [Route("/api/progress-photos")]
    [Authorize]
    public class ProgressPhotosController : ControllerBase
    {
        private readonly IProgressPhotoService _service;
        private readonly IModerationService _moderation;

        public ProgressPhotosController(IProgressPhotoService service, IModerationService moderation)
        {
            _service = service;
            _moderation = moderation;
        }

        private int UserId => int.Parse(User.FindFirstValue(ClaimTypes.NameIdentifier)!);

        private string Absolute(string relative) =>
            $"{Request.Scheme}://{Request.Host}{relative}";

        [HttpGet]
        public async Task<IActionResult> GetAll()
        {
            var photos = await _service.GetAll(UserId);
            foreach (var p in photos) p.ImageUrl = Absolute(p.ImageUrl);
            return Ok(photos);
        }

        public class UploadPhotoForm
        {
            public IFormFile File { get; set; } = null!;
            public DateOnly TakenAt { get; set; }
            public string? Note { get; set; }
        }

        [HttpPost]
        public async Task<IActionResult> Upload([FromForm] UploadPhotoForm form)
        {
            var file = form.File;

            if (file == null || file.Length == 0)
                return BadRequest("No file uploaded.");

            if (!file.ContentType.StartsWith("image/"))
                return BadRequest("Only image files are allowed.");

            if (await _service.HasPhotoOnDate(UserId, form.TakenAt))
                return Conflict("You already added a progress photo for this day.");

            var moderation = await _moderation.CheckImage(file);
            if (!moderation.ServiceAvailable)
                return StatusCode(503, moderation.Reason ?? "Moderation service is unavailable.");
            if (!moderation.Ok)
                return BadRequest(moderation.Reason ?? "Photo was rejected.");

            var dto = await _service.Upload(UserId, file, form.TakenAt, form.Note);
            dto.ImageUrl = Absolute(dto.ImageUrl);
            return Ok(dto);
        }

        [HttpDelete("{id}")]
        public async Task<IActionResult> Delete(int id)
        {
            var ok = await _service.Delete(UserId, id);
            if (!ok) return NotFound();
            return NoContent();
        }
    }
}
