package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import org.springframework.data.jpa.repository.Modifying;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;

import java.time.LocalDateTime;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    Page<Ticket> findByCreateurId(Long createurId, Pageable pageable);

    List<Ticket> findByTechnicienId(Long technicienId);

    long countByCategoryId(Long categoryId);

    @Modifying
    @Query("UPDATE Ticket t SET t.team = NULL WHERE t.team.id = :teamId")
    int detachTeam(@Param("teamId") Long teamId);

    @Query("""
                SELECT t FROM Ticket t
                WHERE t.slaAlerteEnvoyee = false
                AND t.dateEcheanceResolution <= :dateLimite
                AND t.statut NOT IN :statutsFinaux
            """)
    List<Ticket> findSlaARisque(
            @Param("statutsFinaux") List<Ticket.TicketStatus> statutsFinaux,
            @Param("dateLimite") LocalDateTime dateLimite);
}
