package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.CreateUserRequest;
import ma.ensaf.itsupport.dto.UpdateUserRequest;
import ma.ensaf.itsupport.dto.UserDto;
import ma.ensaf.itsupport.entity.Team;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.TeamRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import ma.ensaf.itsupport.security.UserAccessPolicy;
import ma.ensaf.itsupport.service.AuditService;
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
    private final UserAccessPolicy accessPolicy;
    private final AuditService auditService;

    @GetMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDto me(@AuthenticationPrincipal UserDetails p) {
        return toDto(current(p));
    }

    @PutMapping("/me")
    @PreAuthorize("isAuthenticated()")
    public UserDto updateMe(@AuthenticationPrincipal UserDetails p, @RequestBody Map<String, String> body) {
        User u = current(p);
        String nom = body.get("nom");
        String prenom = body.get("prenom");
        if (nom != null && !nom.isBlank()) u.setNom(nom.trim());
        if (prenom != null && !prenom.isBlank()) u.setPrenom(prenom.trim());
        return toDto(userRepository.save(u));
    }

    @PutMapping("/me/password")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> changePassword(@AuthenticationPrincipal UserDetails p, @RequestBody Map<String, String> body) {
        User u = current(p);
        String ancien = body.get("ancienMotDePasse");
        String nouveau = body.get("nouveauMotDePasse");
        if (ancien == null || nouveau == null || nouveau.length() < 8) {
            throw new BusinessException("Le nouveau mot de passe doit contenir au moins 8 caractères.");
        }
        if (!passwordEncoder.matches(ancien, u.getMotDePasse())) {
            throw new BusinessException("L'ancien mot de passe est incorrect.");
        }
        u.setMotDePasse(passwordEncoder.encode(nouveau));
        userRepository.save(u);
        auditService.log(u.getEmail(), "CHANGEMENT_MOT_DE_PASSE", "User", u.getId(), null);
        return ResponseEntity.ok(Map.of("message", "Mot de passe modifié."));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public List<UserDto> list(@RequestParam(required = false) User.Role role, @AuthenticationPrincipal UserDetails p) {
        User actor = current(p);
        List<User> list = role != null ? userRepository.findByRole(role) : userRepository.findAll();
        return list.stream()
                .filter(u -> actor.getRole() == User.Role.ADMIN || u.getRole() != User.Role.ADMIN)
                .map(this::toDto).toList();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public ResponseEntity<UserDto> create(@Valid @RequestBody CreateUserRequest req, @AuthenticationPrincipal UserDetails p) {
        User actor = current(p);
        accessPolicy.checkCanManage(actor, req.role());
        if (req.motDePasse().length() < 8) {
            throw new BusinessException("Le mot de passe doit contenir au moins 8 caractères.");
        }
        if (userRepository.existsByEmailIgnoreCase(req.email())) {
            throw new BusinessException("Cet e-mail est déjà utilisé.");
        }
        User saved = userRepository.save(User.builder()
                .nom(req.nom().trim()).prenom(req.prenom().trim())
                .email(req.email().trim().toLowerCase())
                .motDePasse(passwordEncoder.encode(req.motDePasse()))
                .role(req.role()).team(teamFor(req.role(), req.teamId())).actif(true).build());
        auditService.log(p.getUsername(), "CREATION_UTILISATEUR", "User", saved.getId(), "Rôle : " + saved.getRole());
        return ResponseEntity.status(201).body(toDto(saved));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public UserDto update(@PathVariable Long id, @Valid @RequestBody UpdateUserRequest req,
                          @AuthenticationPrincipal UserDetails p) {
        User actor = current(p);
        User target = find(id);
        accessPolicy.checkCanManage(actor, target.getRole());
        accessPolicy.checkCanManage(actor, req.role());
        if (target.getId().equals(actor.getId()) && req.role() != target.getRole()) {
            throw new BusinessException("Vous ne pouvez pas modifier votre propre rôle.");
        }
        String ancienRole = target.getRole().name();
        target.setNom(req.nom().trim());
        target.setPrenom(req.prenom().trim());
        target.setRole(req.role());
        target.setTeam(teamFor(req.role(), req.teamId()));
        User saved = userRepository.save(target);
        auditService.log(p.getUsername(), "MODIFICATION_UTILISATEUR", "User", id,
                "Rôle : " + ancienRole + " → " + saved.getRole());
        return toDto(saved);
    }

    @PatchMapping("/{id}/toggle")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public UserDto toggle(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        User actor = current(p);
        User u = find(id);
        accessPolicy.checkCanManage(actor, u.getRole());
        if (u.getId().equals(actor.getId())) {
            throw new BusinessException("Vous ne pouvez pas désactiver votre propre compte.");
        }
        u.setActif(!u.isActif());
        User saved = userRepository.save(u);
        auditService.log(p.getUsername(), saved.isActif() ? "ACTIVATION_UTILISATEUR" : "DESACTIVATION_UTILISATEUR",
                "User", id, "Rôle : " + saved.getRole());
        return toDto(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        User actor = current(p);
        User u = find(id);
        if (u.getId().equals(actor.getId())) {
            throw new BusinessException("Vous ne pouvez pas supprimer votre propre compte.");
        }
        String details = "Email : " + u.getEmail() + ", rôle : " + u.getRole();
        userRepository.delete(u);
        auditService.log(p.getUsername(), "SUPPRESSION_UTILISATEUR", "User", id, details);
        return ResponseEntity.noContent().build();
    }

    private User current(UserDetails p) {
        return userRepository.findByEmailIgnoreCase(p.getUsername()).orElseThrow();
    }

    private User find(Long id) {
        return userRepository.findById(id).orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));
    }

    private Team teamFor(User.Role role, Long teamId) {
        if (role != User.Role.TECHNICIEN || teamId == null) return null;
        return teamRepository.findById(teamId).orElseThrow(() -> new ResourceNotFoundException("Équipe introuvable."));
    }

    private UserDto toDto(User u) {
        return new UserDto(u.getId(), u.getNom(), u.getPrenom(), u.getEmail(), u.getRole(), u.isActif(),
                u.getTeam() != null ? u.getTeam().getId() : null,
                u.getTeam() != null ? u.getTeam().getNom() : null, u.getDateCreation());
    }
}