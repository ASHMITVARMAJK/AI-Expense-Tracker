package com.example.demo.service;

import com.example.demo.dto.DashboardSummaryResponse;
import com.example.demo.entity.Expense;
import com.example.demo.entity.User;
import com.example.demo.repository.ExpenseRepository;
import com.example.demo.repository.UserRepository;
import org.springframework.beans.factory.annotation.Autowired;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDate;
import java.util.HashMap;
import java.util.List;
import java.util.Map;
import java.util.Optional;

@Service
public class ExpenseService {

    private final ExpenseRepository expenseRepository;
    private final UserRepository userRepository;

    @Autowired
    public ExpenseService(ExpenseRepository expenseRepository, UserRepository userRepository) {
        this.expenseRepository = expenseRepository;
        this.userRepository = userRepository;
    }

    @Transactional
    public Expense createExpense(Expense expense, String firebaseUid) {
        User user = userRepository.findById(firebaseUid)
                .orElseThrow(() -> new IllegalArgumentException("User not found: " + firebaseUid));
        expense.setUser(user);
        return expenseRepository.save(expense);
    }

    @Transactional
    public Expense updateExpense(Long id, Expense updatedExpense, String firebaseUid) {
        Expense expense = expenseRepository.findByIdAndUserFirebaseUid(id, firebaseUid)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found or unauthorized"));
        
        expense.setTitle(updatedExpense.getTitle());
        expense.setAmount(updatedExpense.getAmount());
        expense.setCategory(updatedExpense.getCategory());
        expense.setDate(updatedExpense.getDate());
        expense.setDescription(updatedExpense.getDescription());
        
        return expenseRepository.save(expense);
    }

    @Transactional
    public void deleteExpense(Long id, String firebaseUid) {
        Expense expense = expenseRepository.findByIdAndUserFirebaseUid(id, firebaseUid)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found or unauthorized"));
        expenseRepository.delete(expense);
    }

    public Expense getExpenseById(Long id, String firebaseUid) {
        return expenseRepository.findByIdAndUserFirebaseUid(id, firebaseUid)
                .orElseThrow(() -> new IllegalArgumentException("Expense not found or unauthorized"));
    }

    public Page<Expense> getExpenses(
            String firebaseUid,
            String category,
            LocalDate startDate,
            LocalDate endDate,
            String searchQuery,
            Pageable pageable
    ) {
        String formattedSearch = (searchQuery != null && !searchQuery.trim().isEmpty())
                ? "%" + searchQuery.trim().toLowerCase() + "%"
                : null;
        return expenseRepository.searchAndFilterExpenses(
                firebaseUid,
                category,
                startDate,
                endDate,
                formattedSearch,
                pageable
        );
    }

    public DashboardSummaryResponse getDashboardSummary(String firebaseUid) {
        LocalDate today = LocalDate.now();
        LocalDate startOfThisMonth = today.withDayOfMonth(1);
        LocalDate endOfThisMonth = today.with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

        LocalDate startOfLastMonth = today.minusMonths(1).withDayOfMonth(1);
        LocalDate endOfLastMonth = today.minusMonths(1).with(java.time.temporal.TemporalAdjusters.lastDayOfMonth());

        Double total = expenseRepository.sumAllExpenses(firebaseUid);
        Double thisMonth = expenseRepository.sumExpensesInPeriod(firebaseUid, startOfThisMonth, endOfThisMonth);
        Double lastMonth = expenseRepository.sumExpensesInPeriod(firebaseUid, startOfLastMonth, endOfLastMonth);

        List<Expense> recent = expenseRepository.findFirst5ByUserFirebaseUidOrderByDateDesc(firebaseUid);
        
        List<Object[]> categoryData = expenseRepository.getCategorySummary(firebaseUid, null, null);
        Map<String, Double> categoryMap = new HashMap<>();
        for (Object[] row : categoryData) {
            categoryMap.put((String) row[0], ((Number) row[1]).doubleValue());
        }

        return DashboardSummaryResponse.builder()
                .totalExpenses(total != null ? total : 0.0)
                .monthlyExpenses(thisMonth != null ? thisMonth : 0.0)
                .previousMonthlyExpenses(lastMonth != null ? lastMonth : 0.0)
                .recentTransactions(recent)
                .categorySummary(categoryMap)
                .build();
    }
    
    public List<Expense> getAllExpensesForAI(String firebaseUid) {
        return expenseRepository.findByUserFirebaseUidOrderByDateDesc(firebaseUid);
    }
}
