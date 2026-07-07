package com.example.demo.controller;

import com.example.demo.entity.Expense;
import com.example.demo.service.ExpenseService;
import com.example.demo.service.GeminiService;
import com.fasterxml.jackson.databind.ObjectMapper;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/ai")
public class AIController {

    private final GeminiService geminiService;
    private final ExpenseService expenseService;
    private final ObjectMapper objectMapper = new ObjectMapper();

    @Autowired
    public AIController(GeminiService geminiService, ExpenseService expenseService) {
        this.geminiService = geminiService;
        this.expenseService = expenseService;
    }

    @PostMapping("/parse")
    public ResponseEntity<List<Map<String, Object>>> parseExpenseDescription(
            @RequestBody Map<String, String> request,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String text = request.get("text");
        if (text == null || text.trim().isEmpty()) {
            return ResponseEntity.badRequest().build();
        }

        String jsonResponse = geminiService.parseExpenseDescription(text);
        try {
            @SuppressWarnings("unchecked")
            List<Map<String, Object>> parsed = objectMapper.readValue(jsonResponse, List.class);
            return ResponseEntity.ok(parsed);
        } catch (Exception e) {
            System.err.println("Failed to parse JSON array: " + jsonResponse + ". Error: " + e.getMessage());
            // Try to parse as a single object, in case the LLM returned an object instead of an array
            try {
                @SuppressWarnings("unchecked")
                Map<String, Object> singleParsed = objectMapper.readValue(jsonResponse, Map.class);
                return ResponseEntity.ok(List.of(singleParsed));
            } catch (Exception ex) {
                return ResponseEntity.ok(List.of(Map.of(
                        "title", "Expense",
                        "amount", 0.0,
                        "category", "Others",
                        "date", java.time.LocalDate.now().toString(),
                        "description", text
                )));
            }
        }
    }

    @GetMapping("/insights")
    public ResponseEntity<Map<String, String>> getInsights(
            @AuthenticationPrincipal Jwt jwt
    ) {
        String firebaseUid = jwt.getSubject();
        List<Expense> expenses = expenseService.getAllExpensesForAI(firebaseUid);
        String insights = geminiService.getSpendingInsights(expenses);
        return ResponseEntity.ok(Map.of("insights", insights));
    }
}
