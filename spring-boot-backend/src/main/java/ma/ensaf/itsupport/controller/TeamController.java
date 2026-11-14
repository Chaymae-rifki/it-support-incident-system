package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.Team;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.TeamRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/teams")
@RequiredArgsConstructor
public class TeamController {

    private final TeamRepository teamRepository;

    @GetMapping
    public List<Team> findAll() {
        return teamRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Team> create(@RequestBody Team team) {
        return ResponseEntity.status(201).body(teamRepository.save(team));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public Team update(@PathVariable Long id, @RequestBody Team payload) {
        Team team = teamRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable."));
        team.setNom(payload.getNom());
        team.setDescription(payload.getDescription());
        return teamRepository.save(team);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        teamRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
