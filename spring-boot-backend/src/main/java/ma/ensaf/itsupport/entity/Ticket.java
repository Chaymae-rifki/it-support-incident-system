package ma.ensaf.itsupport.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDateTime;

@Entity
@Table(name = "tickets")
@Getter @Setter @NoArgsConstructor @AllArgsConstructor @Builder
public class Ticket {
    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String reference;

    @Column(nullable = false)
    private String titre;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String description;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    @Builder.Default
    private TicketStatus statut = TicketStatus.OUVERT;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private TicketPriority priorite;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "category_id", nullable = false)
    private Category category;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "createur_id", nullable = false)
    private User createur;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technicien_id")
    private User technicien;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "team_id")
    private Team team;

    @Column(columnDefinition = "TEXT")
    private String solutionAppliquee;

    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();
    private LocalDateTime dateResolution;
    private LocalDateTime dateCloture;

    public enum TicketStatus {
        OUVERT, AFFECTE, EN_COURS, EN_ATTENTE, RESOLU, CLOTURE, ANNULE
    }

    public enum TicketPriority {
        BASSE, MOYENNE, HAUTE, CRITIQUE
    }
}
