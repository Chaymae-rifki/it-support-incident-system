
package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.AuditLog;
import ma.ensaf.itsupport.repository.AuditLogRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

@Service
@RequiredArgsConstructor
@Transactional
public class AuditService {

    private final AuditLogRepository auditLogRepository;

    public void log(
            String utilisateur,
            String action,
            String entite,
            Long entiteId,
            String details) {

        AuditLog auditLog = AuditLog.builder()
                .utilisateur(utilisateur)
                .action(action)
                .entite(entite)
                .entiteId(entiteId)
                .details(details)
                .build();

        auditLogRepository.save(auditLog);
    }
}
