package ma.ensaf.itsupport.entity;

import jakarta.persistence.*;
import lombok.*;

@Entity
@Table(name = "sla_policies")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class SlaPolicy {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false, unique = true)
    private Ticket.TicketPriority priorite;

    @Column(nullable = false)
    private int premiereReponseMinutes;

    @Column(nullable = false)
    private int resolutionMinutes;
}