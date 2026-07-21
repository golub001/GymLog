namespace GymLog.Api.Services
{
    public interface IPushService
    {
        public Task SendPush(string? expoPushToken, string title, string body, object? data = null);
    }
}
