package ma.ensaf.itsupport.security;

import lombok.RequiredArgsConstructor;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.http.HttpMethod;
import org.springframework.http.MediaType;
import org.springframework.security.authentication.AuthenticationManager;
import org.springframework.security.config.annotation.authentication.configuration.AuthenticationConfiguration;
import org.springframework.security.config.annotation.method.configuration.EnableMethodSecurity;
import org.springframework.security.config.annotation.web.builders.HttpSecurity;
import org.springframework.security.config.http.SessionCreationPolicy;
import org.springframework.security.crypto.bcrypt.BCryptPasswordEncoder;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.security.web.SecurityFilterChain;
import org.springframework.security.web.authentication.UsernamePasswordAuthenticationFilter;
import org.springframework.web.cors.CorsConfiguration;

import java.util.List;

@Configuration
@EnableMethodSecurity
@RequiredArgsConstructor
public class SecurityConfig {

    private final JwtAuthFilter jwtAuthFilter;

    @Bean
    public SecurityFilterChain filterChain(HttpSecurity http) throws Exception {
        return http
            .csrf(csrf -> csrf.disable())
            .cors(cors -> cors.configurationSource(req -> {
                CorsConfiguration cfg = new CorsConfiguration();
                cfg.setAllowedOrigins(List.of("http://localhost:4200"));
                cfg.setAllowedMethods(List.of("GET", "POST", "PUT", "PATCH", "DELETE", "OPTIONS"));
                cfg.setAllowedHeaders(List.of("*"));
                cfg.setAllowCredentials(true);
                return cfg;
            }))
            .sessionManagement(sm -> sm.sessionCreationPolicy(SessionCreationPolicy.STATELESS))
            .exceptionHandling(e -> e.authenticationEntryPoint((req, res, ex) -> {
                res.setStatus(401);
                res.setContentType(MediaType.APPLICATION_JSON_VALUE);
                res.setCharacterEncoding("UTF-8");
                res.getWriter().write("{\"status\":401,\"message\":\"Authentification requise ou jeton invalide.\"}");
            }))
            .authorizeHttpRequests(auth -> auth
                .requestMatchers("/api/auth/**", "/swagger-ui/**", "/swagger-ui.html", "/v3/api-docs/**", "/error").permitAll()

                // Routes personnelles (tous les rôles connectés)
                .requestMatchers("/api/users/me", "/api/users/me/**").authenticated()

                // Utilisateurs
                .requestMatchers(HttpMethod.GET, "/api/users").hasAnyRole("ADMIN", "IT_MANAGER", "TECHNICIEN")
                .requestMatchers("/api/users/**").hasRole("ADMIN")

                // Équipes et catégories : lecture pour tous, écriture admin/manager
                .requestMatchers(HttpMethod.GET, "/api/teams/**", "/api/categories/**").authenticated()
                .requestMatchers("/api/teams/**", "/api/categories/**").hasAnyRole("ADMIN", "IT_MANAGER")

                // Équipements
                .requestMatchers("/api/assets/mine").hasRole("EMPLOYE")
                .requestMatchers(HttpMethod.GET, "/api/assets/**").hasAnyRole("ADMIN", "IT_MANAGER", "TECHNICIEN")
                .requestMatchers("/api/assets/**").hasAnyRole("ADMIN", "IT_MANAGER")

                // Dashboard
                .requestMatchers("/api/dashboard/technicians").hasAnyRole("ADMIN", "IT_MANAGER")
                .requestMatchers("/api/dashboard/**").hasAnyRole("ADMIN", "IT_MANAGER", "TECHNICIEN")

                // Tickets
                .requestMatchers(HttpMethod.POST, "/api/tickets").hasAnyRole("EMPLOYE", "IT_MANAGER", "ADMIN")
                .requestMatchers("/api/tickets/my").hasAnyRole("EMPLOYE", "IT_MANAGER", "ADMIN")
                .requestMatchers("/api/tickets/*/interventions").hasAnyRole("ADMIN", "IT_MANAGER", "TECHNICIEN")

                // Audit
                .requestMatchers("/api/audit/**").hasRole("ADMIN")

                .anyRequest().authenticated()
            )
            .addFilterBefore(jwtAuthFilter, UsernamePasswordAuthenticationFilter.class)
            .build();
    }

    @Bean
    public PasswordEncoder passwordEncoder() {
        return new BCryptPasswordEncoder();
    }

    @Bean
    public AuthenticationManager authenticationManager(AuthenticationConfiguration cfg) throws Exception {
        return cfg.getAuthenticationManager();
    }
}