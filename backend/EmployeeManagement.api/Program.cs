using Microsoft.OpenApi.Models;
using Microsoft.EntityFrameworkCore;
using EmployeeManagement.api.Data;
using EmployeeManagement.api.Interfaces;
using EmployeeManagement.api.Services;
using Microsoft.AspNetCore.Authentication.JwtBearer; //JWT Authentication middleware
using Microsoft.IdentityModel.Tokens; //For token validation parameters
using System.Text; //For encoding the secret key
using System.IO;



var builder = WebApplication.CreateBuilder(args);

// Load local .env file if present
var envFilePath = Path.Combine(builder.Environment.ContentRootPath, ".env");
if (File.Exists(envFilePath))
{
    foreach (var line in File.ReadAllLines(envFilePath))
    {
        if (string.IsNullOrWhiteSpace(line) || line.StartsWith("#"))
            continue;

        var parts = line.Split('=', 2);
        if (parts.Length == 2)
        {
            var key = parts[0].Trim();
            var val = parts[1].Trim();
            Environment.SetEnvironmentVariable(key, val);
        }
    }
}

//allows the angular app to make requests
builder.Services.AddCors(options =>
{
    options.AddPolicy("AllowAngular",
        policy =>
        {
            policy.WithOrigins("http://localhost:4200")
                  .AllowAnyHeader()
                  .AllowAnyMethod();
        });
});

builder.Services.AddControllers(); // Add controllers to the service collection MVC pattern

builder.Services.AddEndpointsApiExplorer();



builder.Services.AddSwaggerGen(options => // Add/Register JWT authentication to Swagger
{
    options.AddSecurityDefinition("Bearer", // Define the security scheme for JWT authentication
        new Microsoft.OpenApi.Models.OpenApiSecurityScheme // Define the security scheme for JWT authentication
        {
            Name = "Authorization", // The name of the header that will carry the JWT token
            Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http, // The type of the security scheme (HTTP in this case)
            Scheme = "Bearer",  // The authentication scheme (Bearer in this case)
            BearerFormat = "JWT", // The format of the token (JWT in this case)
            In = Microsoft.OpenApi.Models.ParameterLocation.Header, // The location of the token (in the header)
            Description = "Enter JWT Token"
        });

    options.AddSecurityRequirement( // Define the security requirement for JWT authentication, specifying that the "Bearer" scheme is required for accessing the API endpoints  
        new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
        {
            {
                new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Reference =
                        new Microsoft.OpenApi.Models.OpenApiReference
                        {
                            Type =
                                Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                            Id = "Bearer"
                        }
                },
                new string[] {}
            }
        });
});



builder.Services.AddDbContext<AppDbContext>(options => // Register the application's database context (AppDbContext) with the dependency injection container, specifying that it should use SQL Server as the database provider and retrieving the connection string from the application's configuration settings. This allows the application to interact with the database using Entity Framework Core.
    options.UseSqlServer(
        builder.Configuration.GetConnectionString("DefaultConnection")));   


//When IEmployeeService is requested, give EmployeeService object."
//scoped lifetime means that a new instance of the service will be created for each scope, which is typically per HTTP request in web applications. This ensures that each request gets its own instance of the service, allowing for better resource management and avoiding potential issues with shared state across requests.
builder.Services.AddScoped<IEmailService, EmailService>();
builder.Services.AddScoped<IEmployeeService, EmployeeService>(); // Register the IEmployeeService interface and its implementation EmployeeService with the dependency injection container, specifying that a new instance of EmployeeService should be created for each scope (e.g., per HTTP request). This allows the application to resolve and use the IEmployeeService wherever it is needed, such as in controllers or other services.
builder.Services.AddScoped<IDepartmentService, DepartmentService>();
builder.Services.AddScoped<ILeaveRequestService,LeaveRequestService>();
builder.Services.AddScoped<INotificationService,NotificationService>();
builder.Services.AddScoped<IAttendanceService, AttendanceService>();
builder.Services.AddScoped<IAuthService, AuthService>();
builder.Services.AddScoped<IEmployeeLevelService, EmployeeLevelService>();
builder.Services.AddHttpClient<IAiService, GeminiAiService>();

builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
    .AddJwtBearer(options =>
    {
        options.TokenValidationParameters =
            new TokenValidationParameters
            {
                ValidateIssuer = true,
                ValidateAudience = true,
                ValidateLifetime = true,
                ValidateIssuerSigningKey = true,

                ValidIssuer = builder.Configuration["Jwt:Issuer"],

                ValidAudience = builder.Configuration["Jwt:Audience"],

                IssuerSigningKey =
                    new SymmetricSecurityKey(
                        Encoding.UTF8.GetBytes( // Convert the secret key from the configuration into a byte array and create a symmetric security key for token validation
                            builder.Configuration["Jwt:Key"]!)) // The exclamation mark is a null-forgiving operator, indicating that the value is expected to be non-null. This is used here because the configuration value for "Jwt:Key" is expected to be present and not null, and it allows the code to compile without warnings about potential null reference issues.
            };
    });

builder.Services.AddAuthorization(); // Add authorization services to the dependency injection container, enabling the application to use authorization features such as role-based or policy-based authorization to control access to API endpoints based on user roles, claims, or other criteria.


var app = builder.Build(); // Build the application, creating a WebApplication instance that will be used to configure the HTTP request pipeline and run the application.


if (app.Environment.IsDevelopment())
{
    app.UseSwagger();
    app.UseSwaggerUI();
}

if (!app.Environment.IsDevelopment())
{
    app.UseHttpsRedirection();
}

var uploadsPath = Path.Combine(app.Environment.ContentRootPath, "uploads");
if (!Directory.Exists(uploadsPath))
{
    Directory.CreateDirectory(uploadsPath);
}

app.UseStaticFiles(new StaticFileOptions
{
    FileProvider = new Microsoft.Extensions.FileProviders.PhysicalFileProvider(uploadsPath),
    RequestPath = "/uploads"
});

app.UseCors("AllowAngular");

app.UseAuthentication();
app.UseAuthorization();
app.MapControllers(); // Map controller routes to the application's request pipeline, allowing the application to handle incoming HTTP requests and route them to the appropriate controller actions based on the defined routes and HTTP methods.
DbInitializer.Seed(app);// Call the Seed method of the DbInitializer class, passing the application instance as a parameter. This method is responsible for seeding the database with initial data, such as creating default records or populating lookup tables, to ensure that the application has the necessary data to function properly when it starts up.
app.Run(); // Run the application, starting the web server and allowing it to listen for incoming HTTP requests. This will keep the application running until it is stopped or terminated.