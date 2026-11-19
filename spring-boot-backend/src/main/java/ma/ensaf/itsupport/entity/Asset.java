package ma.ensaf.itsupport.entity;

import jakarta.persistence.*;
import lombok.*;
import java.time.LocalDate;
import java.time.LocalDateTime;

@Entity
@Table(name = "assets")
@Getter
@Setter
@NoArgsConstructor
@AllArgsConstructor
@Builder
public class Asset {

    public enum AssetType {
        ORDINATEUR, PORTABLE, ECRAN, IMPRIMANTE,
        PERIPHERIQUE, ROUTEUR, SERVEUR, AUTRE
    }

    public enum AssetState {
        EN_SERVICE, EN_PANNE, EN_MAINTENANCE, HORS_SERVICE
    }

    @Id
    @GeneratedValue(strategy = GenerationType.IDENTITY)
    private Long id;

    @Column(nullable = false, unique = true)
    private String codeInventaire;

    @Column(nullable = false)
    private String nom;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetType type;

    private String marque;
    private String modele;
    private String numeroSerie;

    @Enumerated(EnumType.STRING)
    @Column(nullable = false)
    private AssetState etat;

    private LocalDate dateAchat;

    @ManyToOne(fetch = FetchType.LAZY)
    @JoinColumn(name = "affecte_a_id")
    private User affecteA;

    @Builder.Default
    private LocalDateTime dateCreation = LocalDateTime.now();
}