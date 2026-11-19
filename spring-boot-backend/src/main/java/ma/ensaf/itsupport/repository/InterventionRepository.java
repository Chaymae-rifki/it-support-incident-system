package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Intervention;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;

public interface InterventionRepository
        extends JpaRepository<Intervention, Long> {

    List<Intervention> findByTicketIdOrderByDateCreationDesc(Long ticketId);
}
