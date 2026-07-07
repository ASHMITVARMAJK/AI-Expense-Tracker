package com.example.demo.repository;

import com.example.demo.entity.Expense;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import org.springframework.stereotype.Repository;

import java.time.LocalDate;
import java.util.List;
import java.util.Optional;

@Repository
public interface ExpenseRepository extends JpaRepository<Expense, Long> {
    
    // Find a single expense by ID and user UID to prevent unauthorized access
    Optional<Expense> findByIdAndUserFirebaseUid(Long id, String firebaseUid);

    // Dynamic search and filter
    @Query("SELECT e FROM Expense e WHERE e.user.firebaseUid = :firebaseUid " +
            "AND (:category IS NULL OR e.category = :category) " +
            "AND (:startDate IS NULL OR e.date >= :startDate) " +
            "AND (:endDate IS NULL OR e.date <= :endDate) " +
            "AND (:searchQuery IS NULL OR LOWER(e.title) LIKE :searchQuery " +
            "OR LOWER(e.description) LIKE :searchQuery)")
    Page<Expense> searchAndFilterExpenses(
            @Param("firebaseUid") String firebaseUid,
            @Param("category") String category,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate,
            @Param("searchQuery") String searchQuery,
            Pageable pageable
    );

    // Sum of expenses in a date range for a specific user
    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.firebaseUid = :firebaseUid " +
            "AND e.date >= :startDate AND e.date <= :endDate")
    Double sumExpensesInPeriod(
            @Param("firebaseUid") String firebaseUid,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );

    // Sum of all expenses for a user
    @Query("SELECT SUM(e.amount) FROM Expense e WHERE e.user.firebaseUid = :firebaseUid")
    Double sumAllExpenses(@Param("firebaseUid") String firebaseUid);

    // Get recent transactions (ordered by date descending)
    List<Expense> findFirst5ByUserFirebaseUidOrderByDateDesc(String firebaseUid);

    // Category aggregation
    @Query("SELECT e.category, SUM(e.amount) FROM Expense e WHERE e.user.firebaseUid = :firebaseUid " +
            "AND (:startDate IS NULL OR e.date >= :startDate) " +
            "AND (:endDate IS NULL OR e.date <= :endDate) " +
            "GROUP BY e.category")
    List<Object[]> getCategorySummary(
            @Param("firebaseUid") String firebaseUid,
            @Param("startDate") LocalDate startDate,
            @Param("endDate") LocalDate endDate
    );
    
    // Get all expenses of user for AI analyzer (ordered by date desc)
    List<Expense> findByUserFirebaseUidOrderByDateDesc(String firebaseUid);
}
