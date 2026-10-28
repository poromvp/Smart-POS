package com.smartpos.cataloginventory.domain;

import jakarta.persistence.*;
import lombok.*;

import java.util.HashSet;
import java.util.LinkedHashSet;
import java.util.Set;

@Entity
@Table(name = "modifier_groups")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class ModifierGroup {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, length = 100)
    private String name;

    @Column(name = "is_multiple", nullable = false)
    @Builder.Default
    private Boolean isMultiple = false;

    @Column(name = "is_required", nullable = false)
    @Builder.Default
    private Boolean isRequired = false;

    @OneToMany(mappedBy = "group", cascade = CascadeType.ALL, orphanRemoval = true)
    @ToString.Exclude
    @Builder.Default
    private Set<ModifierOption> options = new LinkedHashSet<>();

    @ManyToMany(mappedBy = "modifierGroups")
    @ToString.Exclude
    @Builder.Default
    private Set<Product> products = new HashSet<>();
}
