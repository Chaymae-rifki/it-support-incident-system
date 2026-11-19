
package ma.ensaf.itsupport.entity;

import jakarta.persistence.*;
import lombok.*;

import java.time.LocalDateTime;

@Entity
@Table(name = "interventions")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Intervention {

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, columnDefinition = "TEXT")
    private String diagnostic;

    @Column(columnDefinition = "TEXT")
    private String actions;

    @Column(columnDefinition = "TEXT")
    private String piecesRemplacees;

    private int tempsPasseMinutes;

    @Column(columnDefinition = "TEXT")
    private String solution;

    private LocalDateTime dateDebut;

    private LocalDateTime dateFin;

    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "ticket_id", nullable = false)
    private Ticket ticket;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "technicien_id", nullable = false)
    private User technicien;
}

