package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.LoginRequest;
import ma.ensaf.itsupport.dto.LoginResponse;
import ma.ensaf.itsupport.dto.UserDto;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.repository.UserRepository;
import ma.ensaf.itsupport.security.JwtService;
import ma.ensaf.itsupport.service.AuditService;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.authentication.DisabledException;
import org.springframework.security.authentication.UsernamePasswordAuthenticationToken;
import org.springframework.security.core.AuthenticationException;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.security.core.userdetails.UserDetailsService;
import org.springframework.web.bind.annotation.*;

import java.util.Map;

@RestController
@RequestMapping("/api/auth")
@RequiredArgsConstructor
public class AuthController {

    private final AuthenticationManager authenticationManager;
    private final UserDetailsService userDetailsService;
    private final UserRepository userRepository;
    private final JwtService jwtService;
    private final AuditService auditService;

    @PostMapping("/login")
    public LoginResponse login(@Valid @RequestBody LoginRequest request) {
        try {
            authenticationManager.authenticate(
                    new UsernamePasswordAuthenticationToken(request.email(), request.motDePasse()));
        } catch (AuthenticationException ex) {
            auditService.log(request.email(), "LOGIN_ECHEC", "User", null,
                    ex instanceof DisabledException ? "Compte désactivé" : "Identifiants invalides");
            throw ex;
        }

        UserDetails details = userDetailsService.loadUserByUsername(request.email());
        User user = userRepository.findByEmailIgnoreCase(request.email()).orElseThrow();
        String token = jwtService.generateToken(details, Map.of("role", user.getRole().name()));
        auditService.log(user.getEmail(), "LOGIN_SUCCES", "User", user.getId(), null);

        UserDto dto = new UserDto(
                user.getId(), user.getNom(), user.getPrenom(), user.getEmail(),
                user.getRole(), user.isActif(),
                user.getTeam() != null ? user.getTeam().getId() : null,
                user.getTeam() != null ? user.getTeam().getNom() : null,
                user.getDateCreation());
        return new LoginResponse(token, dto);
    }
}