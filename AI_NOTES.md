# AI Notes

## AI Usage in the Application

This project uses the Google Gemini API as an optional AI-powered feature for the Discord `/report` command.

The AI functionality is implemented on the backend and is not required for the basic Discord command flow.

## Where AI Is Used

The main AI implementation is located at:

```text
server/src/services/geminiService.js
```

The Discord report processing flow invokes the AI service from:

```text
server/src/controllers/discordController.js
```

The frontend exposes a configuration option for enabling or disabling Gemini analysis from:

```text
client/src/pages/Settings.jsx
```

## Purpose of AI

Gemini is used to analyze user-submitted Discord reports.

For example:

```text
/report text: Login button is not working correctly
```

The report is sent to Gemini to generate:

1. A short summary.
2. A category/tag for the report.

The supported categories are:

```text
bug
incident
question
feature
other
```

## Expected AI Response

The application requests a JSON response in the following format:

```json
{
  "summary": "Short summary",
  "tag": "bug"
}
```

The backend parses the response and stores the resulting summary and tag in the database.

## AI Model Handling

The backend attempts to use configured Gemini models and includes retry handling for temporary API failures such as rate limits or service availability errors.

If an AI response cannot be parsed as JSON, the application falls back to treating the returned text as the summary and uses the `other` category.

If all configured AI attempts fail, the error is recorded and the report processing flow handles the failure without silently discarding the report.

## AI Configuration

AI processing can be controlled from the admin Settings page.

The administrator can enable or disable:

```text
Gemini AI analysis
```

This allows the Discord reporting workflow to continue without AI processing when required.

## API Key Security

The Gemini API key is stored in the backend environment:

```text
GEMINI_API_KEY
```

It is never intended to be exposed in the React frontend.

The actual `.env` file is excluded from Git using `.gitignore`.

The repository contains only:

```text
server/.env.example
```

with empty environment variable values.

## Data Flow

```text
Discord /report
       |
       v
Express Backend
       |
       v
Command Configuration
       |
       | AI enabled?
       |
      Yes
       |
       v
Gemini API
       |
       v
Summary + Category
       |
       v
PostgreSQL
       |
       +----> Discord response
       |
       +----> Mirror notification
       |
       +----> Admin dashboard
```

If AI is disabled:

```text
Discord /report
       |
       v
Express Backend
       |
       v
PostgreSQL
       |
       +----> Discord response
       |
       +----> Mirror notification
       |
       +----> Admin dashboard
```

## AI Development Disclosure

Gemini is an explicit application feature of this project. It is not used to replace the core Discord interaction handling, authentication, database operations, or dashboard functionality.

The core application remains functional independently of the AI service.

## Limitations

AI-generated summaries and categories may not always be perfect. The application therefore treats AI output as an automated classification/summary rather than as authoritative information.

External AI availability, rate limits, response formatting, and latency can affect AI processing.

The backend includes error handling and fallback behavior so that an AI service failure does not silently remove the submitted report.