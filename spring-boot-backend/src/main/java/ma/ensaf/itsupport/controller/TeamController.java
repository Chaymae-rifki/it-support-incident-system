package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.Team;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.TeamRepository;
import ma.ensaf.itsupport.repository.TicketRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import ma.ensaf.itsupport.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;
    private final UserRepository userRepository;
    private final TicketRepository ticketRepository;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','TECHNICIEN')")
    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public ResponseEntity<Team> create(@RequestBody Team team, @AuthenticationPrincipal UserDetails p) {
        if (team.getNom() == null || team.getNom().isBlank()) throw new BusinessException("Le nom est obligatoire.");
        if (teamRepository.existsByNomIgnoreCase(team.getNom().trim())) throw new BusinessException("Cette équipe existe déjà.");
        team.setId(null);
        team.setNom(team.getNom().trim());
        Team saved = teamRepository.save(team);
        auditService.log(p.getUsername(), "CREATION_EQUIPE", "Team", saved.getId(), saved.getNom());
        return ResponseEntity.status(201).body(saved);
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public Team update(@PathVariable Long id, @RequestBody Team payload, @AuthenticationPrincipal UserDetails p) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable."));
        if (payload.getNom() == null || payload.getNom().isBlank()) throw new BusinessException("Le nom est obligatoire.");
        team.setNom(payload.getNom().trim());
        team.setDescription(payload.getDescription());
        Team saved = teamRepository.save(team);
        auditService.log(p.getUsername(), "MODIFICATION_EQUIPE", "Team", id, saved.getNom());
        return saved;
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    @Transactional
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        if (!teamRepository.existsById(id)) throw new ResourceNotFoundException("Équipe introuvable.");
        userRepository.findByTeamId(id).forEach(u -> u.setTeam(null));
        ticketRepository.detachTeam(id);
        teamRepository.deleteById(id);
        auditService.log(p.getUsername(), "SUPPRESSION_EQUIPE", "Team", id, null);
        return ResponseEntity.noContent().build();
    }
}