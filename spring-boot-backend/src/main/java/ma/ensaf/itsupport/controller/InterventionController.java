package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.CreateInterventionRequest;
import ma.ensaf.itsupport.dto.InterventionDto;
import ma.ensaf.itsupport.service.InterventionService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/tickets/{ticketId}/interventions")
@RequiredArgsConstructor
public class InterventionController {

    private final InterventionService service;

    @PostMapping
    @PreAuthorize("hasRole('TECHNICIEN')")
    public ResponseEntity<InterventionDto> create(@PathVariable Long ticketId,
            @Valid @RequestBody CreateInterventionRequest req, @AuthenticationPrincipal UserDetails p) {
        return ResponseEntity.status(201).body(service.create(ticketId, req, p.getUsername()));
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','TECHNICIEN')")
    public List<InterventionDto> list(@PathVariable Long ticketId, @AuthenticationPrincipal UserDetails p) {
        return service.list(ticketId, p.getUsername());
    }
}