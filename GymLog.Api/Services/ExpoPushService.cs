using System.Text;
using System.Text.Json;

namespace GymLog.Api.Services
{
    public class ExpoPushService : IPushService
    {
        private readonly HttpClient _http;
        private readonly ILogger<ExpoPushService> _logger;

        public ExpoPushService(HttpClient http, ILogger<ExpoPushService> logger)
        {
            _http = http;
            _logger = logger;
            _http.Timeout = TimeSpan.FromSeconds(10);
        }

        public async Task SendPush(string? expoPushToken, string title, string body, object? data = null)
        {
            if (string.IsNullOrEmpty(expoPushToken)) return;

            try
            {
                var payload = JsonSerializer.Serialize(new
                {
                    to = expoPushToken,
                    title,
                    body,
                    sound = "default",
                    data
                });

                var content = new StringContent(payload, Encoding.UTF8, "application/json");
                var response = await _http.PostAsync("https://exp.host/--/api/v2/push/send", content);
                var responseBody = await response.Content.ReadAsStringAsync();

                if (!response.IsSuccessStatusCode)
                {
                    _logger.LogWarning("Expo push failed with status {Status}: {Body}",
                        response.StatusCode, responseBody);
                    return;
                }

                // Expo answers 200 even when the ticket itself failed (e.g. DeviceNotRegistered,
                // missing FCM credentials), so the ticket status has to be inspected separately.
                using var ticket = JsonDocument.Parse(responseBody);
                if (ticket.RootElement.TryGetProperty("data", out var ticketData) &&
                    ticketData.TryGetProperty("status", out var status) &&
                    status.GetString() == "error")
                {
                    _logger.LogWarning("Expo push ticket rejected: {Body}", responseBody);
                }
            }
            catch (Exception ex)
            {
                _logger.LogWarning(ex, "Expo push failed");
            }
        }
    }
}
