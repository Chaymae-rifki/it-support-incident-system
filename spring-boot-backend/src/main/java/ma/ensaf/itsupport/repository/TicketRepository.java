package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Ticket;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.JpaSpecificationExecutor;
import java.util.List;

public interface TicketRepository extends JpaRepository<Ticket, Long>, JpaSpecificationExecutor<Ticket> {
    Page<Ticket> findByCreateurId(Long createurId, Pageable pageable);
    List<Ticket> findByTechnicienId(Long technicienId);
    long countByCategoryId(Long categoryId);
}
