package com.example.demo.dto;

import com.example.demo.entity.Expense;
import lombok.*;
import java.util.List;
import java.util.Map;

@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class DashboardSummaryResponse {
    private Double totalExpenses;
    private Double monthlyExpenses;
    private Double previousMonthlyExpenses;
    private List<Expense> recentTransactions;
    private Map<String, Double> categorySummary;
}
