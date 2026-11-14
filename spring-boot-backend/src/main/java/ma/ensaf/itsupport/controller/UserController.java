package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.CreateUserRequest;
import ma.ensaf.itsupport.dto.UserDto;
import ma.ensaf.itsupport.entity.Team;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.TeamRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/users")
@RequiredArgsConstructor
public class UserController {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final PasswordEncoder passwordEncoder;

    @GetMapping("/me")
    public UserDto me(@AuthenticationPrincipal UserDetails principal) {
        User u = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
        return toDto(u);
    }

    @PutMapping("/me")
    public UserDto updateMe(@AuthenticationPrincipal UserDetails principal, @RequestBody Map<String, String> body) {
        User u = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
        if (body.containsKey("nom")) u.setNom(body.get("nom"));
        if (body.containsKey("prenom")) u.setPrenom(body.get("prenom"));
        return toDto(userRepository.save(u));
    }

    @PutMapping("/me/password")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails principal, @RequestBody Map<String, String> body) {
        User u = userRepository.findByEmailIgnoreCase(principal.getUsername()).orElseThrow();
        if (!passwordEncoder.matches(body.get("ancienMotDePasse"), u.getMotDePasse())) {
            throw new BusinessException("L'ancien mot de passe est incorrect.");
        }
        u.setMotDePasse(passwordEncoder.encode(body.get("nouveauMotDePasse")));
        userRepository.save(u);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié."));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN', 'TECHNICIEN')")
    public List<UserDto> list(@RequestParam(required = false) User.Role role) {
        List<User> list = role != null ? userRepository.findByRole(role) : userRepository.findAll();
        return list.stream().map(this::toDto).toList();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req) {
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BusinessException("Cet e-mail est déjà utilisé.");
        }
        Team team = req.teamId() != null ? teamRepository.findById(req.teamId()).orElse(null) : null;
        User saved = userRepository.save(User.builder()
                .nom(req.nom()).prenom(req.prenom())
                .email(req.email().toLowerCase())
                .motDePasse(passwordEncoder.encode(req.motDePasse()))
                .role(req.role()).team(team).actif(true).build());
        return ResponseEntity.status(201).body(toDto(saved));
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasRole('ADMIN')")
    public UserDto toggle(@PathVariable Long id) {
        User u = userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
        u.setActif(!u.isActif());
        return toDto(userRepository.save(u));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        userRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getNom(), u.getPrenom(), u.getEmail(), u.getRole(), u.isActif(),
                u.getTeam() != null ? u.getTeam().getId() : null,
                u.getTeam() != null ? u.getTeam().getNom() : null, u.getDateCreation());
    }
}
