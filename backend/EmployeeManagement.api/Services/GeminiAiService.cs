using System;
using System.Collections.Generic;
using System.Net.Http;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using EmployeeManagement.api.DTOs.Employee;
using EmployeeManagement.api.Interfaces;
using Microsoft.Extensions.Configuration;

namespace EmployeeManagement.api.Services
{
    public class GeminiAiService : IAiService
    {
        private readonly HttpClient _httpClient;
        private readonly string _apiKey;

        public GeminiAiService(HttpClient httpClient, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _apiKey = configuration["Gemini:ApiKey"] ?? string.Empty;
        }

        public async Task<ParsedResumeDto?> ParseCvTextAsync(string cvText)
        {
            if (string.IsNullOrWhiteSpace(_apiKey))
            {
                throw new InvalidOperationException("Gemini API key is not configured. Please add Gemini:ApiKey inside appsettings.json.");
            }

            var url = $"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={_apiKey}";

            var systemPrompt = "Analyze and extract employee registration details from the following resume text. " +
                               "Provide raw values for the employee registration form fields: First Name, Last Name, Email, " +
                               "Phone number, Home/Residential Address, Date of Birth (DOB) and Gender. " +
                               "Extract the Gender strictly as 'Male' or 'Female' (guess if needed based on typical naming or leave as 'Male'). " +
                               "Extract the Date of Birth (DOB) formatted strictly as 'YYYY-MM-DD' or leave as null if unavailable. " +
                               "Extract a list of the top technical and professional skills.";

            var promptText = $"{systemPrompt}\n\n[RESUME RAW TEXT]:\n{cvText}";

            // Construct payload with schema enforcement
            var payload = new
            {
                contents = new[]
                {
                    new
                    {
                        parts = new[]
                        {
                            new { text = promptText }
                        }
                    }
                },
                generationConfig = new
                {
                    responseMimeType = "application/json",
                    responseSchema = new
                    {
                        type = "object",
                        properties = new
                        {
                            firstName = new { type = "string", description = "Candidate first name" },
                            lastName = new { type = "string", description = "Candidate last name" },
                            email = new { type = "string", description = "Candidate primary email address" },
                            phone = new { type = "string", description = "Candidate primary telephone/phone number" },
                            address = new { type = "string", description = "Candidate full home or residential address" },
                            dob = new { type = "string", description = "Date of Birth formatted as YYYY-MM-DD, or empty/null if unavailable" },
                            gender = new { type = "string", @enum = new[] { "Male", "Female" }, description = "Strictly Male or Female" },
                            skills = new
                            {
                                type = "array",
                                items = new { type = "string" },
                                description = "Top technical and professional skills extracted"
                            }
                        },
                        required = new[] { "firstName", "lastName", "email", "phone", "address", "dob", "gender", "skills" }
                    }
                }
            };

            var jsonPayload = JsonSerializer.Serialize(payload);
            var content = new StringContent(jsonPayload, Encoding.UTF8, "application/json");

            try
            {
                var response = await _httpClient.PostAsync(url, content);
                if (!response.IsSuccessStatusCode)
                {
                    var errorBody = await response.Content.ReadAsStringAsync();
                    Console.WriteLine($"[GEMINI AI PARSING ERROR] HTTP {response.StatusCode}: {errorBody}");
                    throw new InvalidOperationException($"Gemini API error (HTTP {response.StatusCode}): {errorBody}");
                }

                var responseBody = await response.Content.ReadAsStringAsync();
                using var doc = JsonDocument.Parse(responseBody);
                
                // Navigate standard Gemini JSON response structure: candidates[0].content.parts[0].text
                var candidates = doc.RootElement.GetProperty("candidates");
                if (candidates.GetArrayLength() > 0)
                {
                    var firstCandidate = candidates[0];
                    var parts = firstCandidate.GetProperty("content").GetProperty("parts");
                    if (parts.GetArrayLength() > 0)
                    {
                        var responseText = parts[0].GetProperty("text").GetString();
                        if (!string.IsNullOrWhiteSpace(responseText))
                        {
                            var options = new JsonSerializerOptions
                            {
                                PropertyNameCaseInsensitive = true
                            };
                            
                            var parsedData = JsonSerializer.Deserialize<GeminiParsedResponse>(responseText, options);
                            if (parsedData != null)
                            {
                                DateTime? parsedDob = null;
                                if (!string.IsNullOrWhiteSpace(parsedData.Dob) && DateTime.TryParse(parsedData.Dob, out var tempDate))
                                {
                                    parsedDob = tempDate;
                                }

                                return new ParsedResumeDto
                                {
                                    FirstName = parsedData.FirstName ?? string.Empty,
                                    LastName = parsedData.LastName ?? string.Empty,
                                    Email = parsedData.Email ?? string.Empty,
                                    Phone = parsedData.Phone ?? string.Empty,
                                    Address = parsedData.Address ?? string.Empty,
                                    DOB = parsedDob,
                                    Gender = string.Equals(parsedData.Gender, "Female", StringComparison.OrdinalIgnoreCase) ? "Female" : "Male",
                                    Skills = parsedData.Skills ?? new List<string>()
                                };
                            }
                        }
                    }
                }
            }
            catch (Exception ex)
            {
                Console.WriteLine($"[GEMINI AI PARSING ERROR]: {ex.Message}");
                throw; // rethrow to expose descriptive details to the controller
            }

            return null;
        }

        // Inner matching contract for deserialization
        private class GeminiParsedResponse
        {
            public string? FirstName { get; set; }
            public string? LastName { get; set; }
            public string? Email { get; set; }
            public string? Phone { get; set; }
            public string? Address { get; set; }
            public string? Dob { get; set; }
            public string? Gender { get; set; }
            public List<string>? Skills { get; set; }
        }
    }
}
