using System.Text.Json;

namespace GymLog.Api.Services
{
    public class ModerationService : IModerationService
    {
        private readonly HttpClient _http;
        private readonly bool _enabled;

        public ModerationService(HttpClient http, IConfiguration config)
        {
            _http = http;
            var baseUrl = config["Moderation:BaseUrl"] ?? "http://localhost:8001";
            _http.BaseAddress = new Uri(baseUrl);
            _http.Timeout = TimeSpan.FromSeconds(30);
            _enabled = config.GetValue<bool>("Moderation:Enabled", true);
        }

        public async Task<ModerationResult> CheckImage(IFormFile file)
        {
            if (!_enabled)
            {
                return new ModerationResult { Ok = true, HasFace = true, IsNsfw = false };
            }

            try
            {
                using var content = new MultipartFormDataContent();
                using var stream = file.OpenReadStream();
                var fileContent = new StreamContent(stream);
                fileContent.Headers.ContentType =
                    new System.Net.Http.Headers.MediaTypeHeaderValue(file.ContentType);
                content.Add(fileContent, "file", file.FileName);

                var response = await _http.PostAsync("/moderate", content);
                response.EnsureSuccessStatusCode();

                var json = await response.Content.ReadAsStringAsync();
                var result = JsonSerializer.Deserialize<ModerationResult>(json,
                    new JsonSerializerOptions { PropertyNameCaseInsensitive = true });

                return result ?? new ModerationResult
                {
                    Ok = false,
                    Reason = "Moderation returned an invalid response.",
                    ServiceAvailable = false
                };
            }
            catch (Exception)
            {
                return new ModerationResult
                {
                    Ok = false,
                    Reason = "Moderation service is unavailable.",
                    ServiceAvailable = false
                };
            }
        }
    }
}
