package com.example.demo.service;

import com.example.demo.entity.Expense;
import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.client.RestTemplate;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;

@Service
public class GeminiService {

    @Value("${gemini.api.key}")
    private String apiKey;

    @Value("${gemini.api.url}")
    private String apiUrl;

    private final RestTemplate restTemplate = new RestTemplate();

    public String parseExpenseDescription(String text) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            // Mock response if API key is not configured to allow baseline execution
            return getMockParsedResponse(text);
        }

        String prompt = "Analyze the following natural language expense entry and extract all individual expense items. The text may contain one or multiple expenses. Extract the structured details for each item: Title, Amount, Category, Date, and Description.\n" +
                "Reference information:\n" +
                "- Today's Date: " + LocalDate.now() + "\n" +
                "- Default Currency: INR (₹)\n" +
                "For category, select the most appropriate from: Food, Transport, Utilities, Entertainment, Shopping, Healthcare, Education, Others.\n" +
                "For date, format it as YYYY-MM-DD. If no date or relative day (like yesterday, today) is specified, default to today (" + LocalDate.now() + "). If it says 'yesterday', return " + LocalDate.now().minusDays(1) + ".\n" +
                "For amount, extract the numeric value. Convert to standard positive decimal number.\n" +
                "For description, provide a short summary of the context.\n" +
                "Input text: \"" + text + "\"\n\n" +
                "Return ONLY a valid JSON array of objects matching this schema, without any markdown code blocks, backticks, or wrapping:\n" +
                "[\n" +
                "  {\n" +
                "    \"title\": \"string\",\n" +
                "    \"amount\": number,\n" +
                "    \"category\": \"string\",\n" +
                "    \"date\": \"string\",\n" +
                "    \"description\": \"string\"\n" +
                "  }\n" +
                "]";

        return callGeminiApi(prompt, true);
    }

    public String getSpendingInsights(List<Expense> expenses) {
        if (apiKey == null || apiKey.trim().isEmpty()) {
            return "### AI Insights (Demo Mode)\n\n" +
                    "> [!NOTE]\n" +
                    "> Gemini API Key is not configured. Run the backend with `GEMINI_API_KEY` set to see real insights.\n\n" +
                    "- **No expenses analyzed:** Add real expenses and configure the API key to receive personalized savings suggestions.\n" +
                    "- **Quick Tip:** Category tracking helps you isolate discretionary spend items like Food and Entertainment!";
        }

        if (expenses == null || expenses.isEmpty()) {
            return "### AI Insights\n\nNo expenses found to analyze. Please add some expenses to generate personalized AI spending insights!";
        }

        StringBuilder promptBuilder = new StringBuilder();
        promptBuilder.append("You are an expert AI Financial Advisor. Analyze the user's recent expenses listed below and provide 3-4 highly personalized, actionable spending insights, saving tips, and budget warnings.\n\n");
        promptBuilder.append("User's Recent Expenses:\n");
        for (Expense e : expenses) {
            promptBuilder.append(String.format("- %s: ₹%.2f on %s (%s). Notes: %s\n", 
                e.getDate(), e.getAmount(), e.getTitle(), e.getCategory(), 
                e.getDescription() != null ? e.getDescription() : "None"));
        }
        promptBuilder.append("\n");
        promptBuilder.append("Guidelines for response:\n");
        promptBuilder.append("1. Keep it structured and visually appealing using clear Markdown headers and bullet points.\n");
        promptBuilder.append("2. Use a friendly, encouraging, but professional tone.\n");
        promptBuilder.append("3. Provide specific category insights based on their biggest expenses.\n");
        promptBuilder.append("4. Give at least one clear mathematical estimation of how much they could save by reducing a specific habit (e.g. eating out less).\n");
        promptBuilder.append("5. Limit the response to a maximum of 400 words.");

        return callGeminiApi(promptBuilder.toString(), false);
    }

    private String callGeminiApi(String prompt, boolean isJson) {
        try {
            String url = apiUrl + "?key=" + apiKey;

            // Construct payload: { "contents": [{ "parts": [{ "text": prompt }] }] }
            Map<String, Object> textPart = Map.of("text", prompt);
            Map<String, Object> partContainer = Map.of("parts", List.of(textPart));
            Map<String, Object> payload = Map.of("contents", List.of(partContainer));

            @SuppressWarnings("unchecked")
            Map<String, Object> response = restTemplate.postForObject(url, payload, Map.class);
            String rawText = extractTextFromGeminiResponse(response);
            
            if (isJson) {
                return cleanJsonResponse(rawText);
            }
            return rawText;
        } catch (Exception e) {
            System.err.println("Error calling Gemini API: " + e.getMessage());
            if (isJson) {
                return "[{\"title\": \"Error parsing expense\", \"amount\": 0, \"category\": \"Others\", \"date\": \"" + LocalDate.now() + "\", \"description\": \"LLM Call failed: " + e.getMessage() + "\"}]";
            }
            return "### AI Insights Unavailable\n\nFailed to fetch insights from Gemini API: " + e.getMessage();
        }
    }

    @SuppressWarnings("unchecked")
    private String extractTextFromGeminiResponse(Map<String, Object> response) {
        if (response == null) return "";
        List<Map<String, Object>> candidates = (List<Map<String, Object>>) response.get("candidates");
        if (candidates == null || candidates.isEmpty()) return "";
        Map<String, Object> candidate = candidates.get(0);
        Map<String, Object> content = (Map<String, Object>) candidate.get("content");
        if (content == null) return "";
        List<Map<String, Object>> parts = (List<Map<String, Object>>) content.get("parts");
        if (parts == null || parts.isEmpty()) return "";
        return (String) parts.get(0).get("text");
    }

    private String cleanJsonResponse(String rawResponse) {
        if (rawResponse == null) return "[]";
        String clean = rawResponse.trim();
        if (clean.startsWith("```")) {
            int firstNewLine = clean.indexOf("\n");
            if (firstNewLine != -1) {
                clean = clean.substring(firstNewLine + 1);
            } else {
                clean = clean.substring(3);
            }
        }
        if (clean.endsWith("```")) {
            clean = clean.substring(0, clean.length() - 3);
        }
        return clean.trim();
    }

    private String getMockParsedResponse(String text) {
        // Fallback mock parser for demo in case api key is not set
        double amount = 0.0;
        String category = "Others";
        String title = "Expense";
        
        // Simple regex or keyword search
        try {
            String lower = text.toLowerCase();
            if (lower.contains("groceries") || lower.contains("bought groceries") || lower.contains("food")) {
                title = "Groceries";
                category = "Food";
            } else if (lower.contains("petrol") || lower.contains("cab") || lower.contains("transport") || lower.contains("uber")) {
                title = "Transport Fare";
                category = "Transport";
            } else if (lower.contains("rent") || lower.contains("electricity") || lower.contains("bill")) {
                title = "Utility Bill";
                category = "Utilities";
            } else if (lower.contains("movie") || lower.contains("netflix") || lower.contains("game")) {
                title = "Entertainment";
                category = "Entertainment";
            } else if (lower.contains("shirt") || lower.contains("shoes") || lower.contains("shopping")) {
                title = "Shopping";
                category = "Shopping";
            }

            // Extract number
            java.util.regex.Matcher m = java.util.regex.Pattern.compile("\\d+").matcher(text);
            if (m.find()) {
                amount = Double.parseDouble(m.group());
            }
        } catch (Exception ignored) {}

        return String.format("[{\"title\": \"%s\", \"amount\": %.2f, \"category\": \"%s\", \"date\": \"%s\", \"description\": \"Parsed locally (No API key set): %s\"}]",
                title, amount, category, LocalDate.now(), text);
    }
}
