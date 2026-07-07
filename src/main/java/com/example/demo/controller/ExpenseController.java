package com.example.demo.controller;

import com.example.demo.dto.DashboardSummaryResponse;
import com.example.demo.entity.Expense;
import com.example.demo.service.ExpenseService;
import jakarta.validation.Valid;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Pageable;
import org.springframework.data.domain.Sort;
import org.springframework.format.annotation.DateTimeFormat;
import org.springframework.http.ResponseEntity;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.oauth2.jwt.Jwt;
import org.springframework.web.bind.annotation.*;

import java.time.LocalDate;

@RestController
@RequestMapping("/api/expenses")
public class ExpenseController {

    private final ExpenseService expenseService;

    @Autowired
    public ExpenseController(ExpenseService expenseService) {
        this.expenseService = expenseService;
    }

    @PostMapping
    public ResponseEntity<Expense> createExpense(
            @Valid @RequestBody Expense expense,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String firebaseUid = jwt.getSubject();
        Expense created = expenseService.createExpense(expense, firebaseUid);
        return ResponseEntity.ok(created);
    }

    @GetMapping
    public ResponseEntity<Page<Expense>> getExpenses(
            @AuthenticationPrincipal Jwt jwt,
            @RequestParam(required = false) String category,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate startDate,
            @RequestParam(required = false) @DateTimeFormat(iso = DateTimeFormat.ISO.DATE) LocalDate endDate,
            @RequestParam(required = false) String search,
            @RequestParam(defaultValue = "0") int page,
            @RequestParam(defaultValue = "10") int size,
            @RequestParam(defaultValue = "date") String sortBy,
            @RequestParam(defaultValue = "desc") String direction
    ) {
        String firebaseUid = jwt.getSubject();
        Sort sort = direction.equalsIgnoreCase("asc") ? Sort.by(sortBy).ascending() : Sort.by(sortBy).descending();
        Pageable pageable = PageRequest.of(page, size, sort);
        
        Page<Expense> expenses = expenseService.getExpenses(firebaseUid, category, startDate, endDate, search, pageable);
        return ResponseEntity.ok(expenses);
    }

    @GetMapping("/{id}")
    public ResponseEntity<Expense> getExpenseById(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String firebaseUid = jwt.getSubject();
        Expense expense = expenseService.getExpenseById(id, firebaseUid);
        return ResponseEntity.ok(expense);
    }

    @PutMapping("/{id}")
    public ResponseEntity<Expense> updateExpense(
            @PathVariable Long id,
            @Valid @RequestBody Expense expense,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String firebaseUid = jwt.getSubject();
        Expense updated = expenseService.updateExpense(id, expense, firebaseUid);
        return ResponseEntity.ok(updated);
    }

    @DeleteMapping("/{id}")
    public ResponseEntity<Void> deleteExpense(
            @PathVariable Long id,
            @AuthenticationPrincipal Jwt jwt
    ) {
        String firebaseUid = jwt.getSubject();
        expenseService.deleteExpense(id, firebaseUid);
        return ResponseEntity.noContent().build();
    }

    @GetMapping("/dashboard")
    public ResponseEntity<DashboardSummaryResponse> getDashboardSummary(
            @AuthenticationPrincipal Jwt jwt
    ) {
        String firebaseUid = jwt.getSubject();
        DashboardSummaryResponse summary = expenseService.getDashboardSummary(firebaseUid);
        return ResponseEntity.ok(summary);
    }
}
