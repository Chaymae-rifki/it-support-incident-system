package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.*;
import ma.ensaf.itsupport.service.TicketService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

import java.util.Map;

@RestController
@RequestMapping("/api/tickets")
@RequiredArgsConstructor
public class TicketController {

    private final TicketService ticketService;

    @PostMapping
    @PreAuthorize("hasAnyRole('EMPLOYE','IT_MANAGER','ADMIN')")
    public ResponseEntity<TicketDto> createTicket(
            @AuthenticationPrincipal UserDetails principal,
            @Valid @RequestPart("ticket") CreateTicketRequest request,
            @RequestPart(value = "attachment", required = false) MultipartFile file) {
        return ResponseEntity.status(201).body(ticketService.create(principal.getUsername(), request, file));
    }

    @GetMapping("/my")
    @PreAuthorize("hasAnyRole('EMPLOYE','IT_MANAGER','ADMIN')")
    public Page<TicketDto> myTickets(@AuthenticationPrincipal UserDetails principal, Pageable pageable) {
        return ticketService.findMyTickets(principal.getUsername(), pageable);
    }

    @GetMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','TECHNICIEN')")
    public Page<TicketDto> allTickets(TicketFilter filter, Pageable pageable, @AuthenticationPrincipal UserDetails p) {
        return ticketService.findAll(filter, pageable, p.getUsername());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public TicketDetailDto getById(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        return ticketService.findDetailById(id, principal.getUsername());
    }

    @PutMapping("/{id}/assign")
    @PreAuthorize("hasAnyRole('IT_MANAGER','ADMIN')")
    public TicketDto assign(@PathVariable Long id, @RequestBody AssignTicketRequest req, @AuthenticationPrincipal UserDetails p) {
        return ticketService.assign(id, req, p.getUsername());
    }

    @PutMapping("/{id}/take")
    @PreAuthorize("hasRole('TECHNICIEN')")
    public TicketDto take(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        return ticketService.take(id, p.getUsername());
    }

    @PutMapping("/{id}/status")
    @PreAuthorize("hasAnyRole('TECHNICIEN','IT_MANAGER','ADMIN')")
    public TicketDto updateStatus(@PathVariable Long id, @Valid @RequestBody StatusUpdateRequest req, @AuthenticationPrincipal UserDetails p) {
        return ticketService.updateStatus(id, req, p.getUsername());
    }

    @PutMapping("/{id}/cancel")
    @PreAuthorize("hasAnyRole('EMPLOYE','IT_MANAGER','ADMIN')")
    public TicketDto cancel(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        return ticketService.cancel(id, p.getUsername());
    }

    @PutMapping("/{id}/confirm")
    @PreAuthorize("hasAnyRole('EMPLOYE','IT_MANAGER','ADMIN')")
    public TicketDto confirm(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        return ticketService.confirmResolution(id, p.getUsername());
    }

    @PutMapping("/{id}/reopen")
    @PreAuthorize("hasAnyRole('EMPLOYE','IT_MANAGER','ADMIN')")
    public TicketDto reopen(@PathVariable Long id, @RequestBody(required = false) Map<String, String> body,
                            @AuthenticationPrincipal UserDetails p) {
        String motif = body != null ? body.getOrDefault("motif", "") : "";
        return ticketService.reopen(id, motif, p.getUsername());
    }

    @PostMapping("/{id}/comments")
    @PreAuthorize("isAuthenticated()")
    public CommentDto addComment(@PathVariable Long id, @Valid @RequestBody CreateCommentRequest req, @AuthenticationPrincipal UserDetails p) {
        return ticketService.addComment(id, req, p.getUsername());
    }

    @GetMapping("/{id}/history")
    @PreAuthorize("isAuthenticated()")
    public ResponseEntity<?> history(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        return ResponseEntity.ok(ticketService.getHistory(id, p.getUsername()));
    }
}