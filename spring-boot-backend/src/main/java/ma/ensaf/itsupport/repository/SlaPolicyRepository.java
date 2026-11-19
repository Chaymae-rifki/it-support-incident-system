package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.SlaPolicy;
import ma.ensaf.itsupport.entity.Ticket.TicketPriority;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.Optional;

public interface SlaPolicyRepository extends JpaRepository<SlaPolicy, Long> {

    Optional<SlaPolicy> findByPriorite(TicketPriority priorite);
}