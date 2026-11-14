package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.TicketHistory;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface TicketHistoryRepository extends JpaRepository<TicketHistory, Long> {
    List<TicketHistory> findByTicketIdOrderByDateDesc(Long ticketId);
}
