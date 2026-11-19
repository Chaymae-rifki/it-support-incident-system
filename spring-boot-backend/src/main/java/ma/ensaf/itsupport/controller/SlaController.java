package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.SlaPolicyRequest;
import ma.ensaf.itsupport.entity.SlaPolicy;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.SlaPolicyRepository;
import ma.ensaf.itsupport.service.AuditService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/sla")
@RequiredArgsConstructor
public class SlaController {

    private final SlaPolicyRepository repo;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','TECHNICIEN')")
    public List<SlaPolicy> list() {
        return repo.findAll();
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public SlaPolicy update(@PathVariable Long id, @Valid @RequestBody SlaPolicyRequest req,
                            @AuthenticationPrincipal UserDetails p) {
        SlaPolicy s = repo.findById(id).orElseThrow(() -> new ResourceNotFoundException("Politique SLA introuvable."));
        if (req.resolutionMinutes() < req.premiereReponseMinutes()) {
            throw new BusinessException("La résolution cible doit être supérieure ou égale à la première réponse cible.");
        }
        String avant = s.getPremiereReponseMinutes() + "/" + s.getResolutionMinutes();
        s.setPremiereReponseMinutes(req.premiereReponseMinutes());
        s.setResolutionMinutes(req.resolutionMinutes());
        SlaPolicy saved = repo.save(s);
        auditService.log(p.getUsername(), "MODIFICATION_SLA", "SlaPolicy", id,
                saved.getPriorite() + " : " + avant + " → " + saved.getPremiereReponseMinutes() + "/" + saved.getResolutionMinutes() + " min");
        return saved;
    }
}