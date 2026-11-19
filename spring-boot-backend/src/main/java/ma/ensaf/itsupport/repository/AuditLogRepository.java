
package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.AuditLog;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

public interface AuditLogRepository extends JpaRepository<AuditLog, Long> {

    Page<AuditLog> findByUtilisateurContainingIgnoreCaseAndActionContainingIgnoreCase(
            String utilisateur,
            String action,
            Pageable pageable
    );
}
