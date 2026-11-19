
package ma.ensaf.itsupport.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "audit_logs")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class AuditLog {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    private String utilisateur;

    private String action;

    private String entite;

    private Long entiteId;

    @Column(length = 2000)
    private String details;

    @Builder.Default
    private LocalDateTime date = LocalDateTime.now();
}
