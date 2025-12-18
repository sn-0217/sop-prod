package com.kwgroup.sopdocument.model;

import jakarta.persistence.*;
import lombok.AllArgsConstructor;
import lombok.Builder;
import lombok.Data;
import lombok.NoArgsConstructor;

@Entity
@Table(name = "approvers")
@AllArgsConstructor
@NoArgsConstructor
@Data
@Builder
public class Approver {

    @Id
    @GeneratedValue(strategy = GenerationType.UUID)
    private String id;

    @Column(unique = true, nullable = false)
    private String username;

    @Column(nullable = false)
    private String passwordHash; // bcrypt(12)

    private String name;
    private String email;

    private boolean active; // can be deactivated

    @PrePersist
    public void onCreate() {
        if (this.active == false) { // default to active
            this.active = true;
        }
    }
}
