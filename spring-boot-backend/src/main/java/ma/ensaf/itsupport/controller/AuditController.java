package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.AuditLog;
import ma.ensaf.itsupport.repository.AuditLogRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.PageRequest;
import org.springframework.data.domain.Sort;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

@RestController
@RequestMapping("/api/audit")
@RequiredArgsConstructor
@PreAuthorize("hasRole('ADMIN')")
public class AuditController {
    private final AuditLogRepository repo;

    @GetMapping
    public Page<AuditLog> list(@RequestParam(defaultValue = "") String acteur,
                               @RequestParam(defaultValue = "") String action,
                               @RequestParam(defaultValue = "0") int page,
                               @RequestParam(defaultValue = "20") int size) {
        return repo.findByUtilisateurContainingIgnoreCaseAndActionContainingIgnoreCase(
        acteur,
        action,
        PageRequest.of(Math.max(page, 0), Math.max(1, Math.min(size, 100)),
                Sort.by(Sort.Direction.DESC, "date"))
);
    }
}