package com.smartpos.sales_service.repository;

import com.smartpos.sales_service.entity.Customer;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.stereotype.Repository;

import java.util.List;
import java.util.Optional;

@Repository
public interface CustomerRepository extends JpaRepository<Customer, Long> {
    Optional<Customer> findByPhone(String phone);
    List<Customer> findByPhoneContaining(String phone);
    List<Customer> findByFullNameContainingIgnoreCase(String name);
}
