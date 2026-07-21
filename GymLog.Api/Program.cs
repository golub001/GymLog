using GymLog.Api.Data;
using GymLog.Api.Hubs;
using GymLog.Api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.EntityFrameworkCore;
using Microsoft.IdentityModel.Tokens;
using System.Text;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddControllers();
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen();
builder.Services.AddControllers()
    .AddJsonOptions(options =>
    {
        options.JsonSerializerOptions.Converters.Add(
            new System.Text.Json.Serialization.JsonStringEnumConverter());
    });
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAll", policy =>
    {
        policy.AllowAnyOrigin()
              .AllowAnyMethod()
              .AllowAnyHeader();
    });
});
var jwt = builder.Configuration.GetSection("Jwt");
builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters = new TokenValidationParameters
        {
            ValidateIssuer = true,
            ValidateAudience = true,
            ValidateLifetime = true,
            ValidateIssuerSigningKey = true,
            ValidIssuer = jwt["Issuer"],
            ValidAudience = jwt["Audience"],
            IssuerSigningKey = new SymmetricSecurityKey(
                Encoding.UTF8.GetBytes(jwt["Key"]!))
        };

        options.Events = new JwtBearerEvents
        {
            OnMessageReceived = context =>
            {
                var accessToken = context.Request.Query["access_token"];
                var path = context.HttpContext.Request.Path;
                if (!string.IsNullOrEmpty(accessToken) &&
                    path.StartsWithSegments("/hubs/chat"))
                {
                    context.Token = accessToken;
                }
                return Task.CompletedTask;
            }
        };
    });

builder.Services.AddSignalR();

builder.Services.AddDbContext<AppDbContext>(options =>
    options.UseNpgsql(builder.Configuration.GetConnectionString("DefaultConnection")));

builder.Services.AddScoped<ITokenService,TokenService>();
builder.Services.AddScoped<IAuthService,AuthService>();
builder.Services.AddScoped<IUserService, UserService>();
builder.Services.AddScoped<ICalorieCalculator, CalorieCalculator>();
builder.Services.AddScoped<IWorkoutService,WorkoutService>();
builder.Services.AddScoped<IBodyWeightService, BodyWeightService>();
builder.Services.AddScoped<INutritionService, NutritionService>();
builder.Services.AddScoped<IPlanService, PlanService>();
builder.Services.AddScoped<IProgressPhotoService, ProgressPhotoService>();
builder.Services.AddScoped<IFriendService, FriendService>();
builder.Services.AddScoped<ISessionService, SessionService>();
builder.Services.AddScoped<IMessageService, MessageService>();
builder.Services.AddHttpClient<IPushService, ExpoPushService>();
builder.Services.AddHttpClient<IAiPlanService, AiPlanService>();
builder.Services.AddHttpClient<IModerationService, ModerationService>();
var app = builder.Build();

using (var scope = app.Services.CreateScope())
{
    var db = scope.ServiceProvider.GetRequiredService<AppDbContext>();
    await DataSeeder.SeedExercisesAsync(db);
    await FoodSeeder.SeedFoodsAsync(db);
    await PlanSeeder.SeedPlansAsync(db);
}

if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

app.UseStaticFiles();
app.UseCors("AllowAll");
app.UseAuthentication();
app.UseAuthorization();

app.MapControllers();
app.MapHub<ChatHub>("/hubs/chat");

app.Run();
