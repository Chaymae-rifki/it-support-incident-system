
package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.AttachmentDto;
import ma.ensaf.itsupport.entity.Attachment;
import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.AttachmentRepository;
import ma.ensaf.itsupport.repository.TicketRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import ma.ensaf.itsupport.security.TicketAccessPolicy;
import ma.ensaf.itsupport.service.FileStorageService;

import org.springframework.core.io.Resource;
import org.springframework.http.ContentDisposition;
import org.springframework.http.HttpHeaders;
import org.springframework.http.MediaType;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.bind.annotation.*;
import org.springframework.web.multipart.MultipartFile;

@RestController
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class AttachmentController {

    private final AttachmentRepository attachmentRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final FileStorageService fileStorageService;
    private final TicketAccessPolicy access;

    @GetMapping("/api/attachments/{id}/download")
    @Transactional(readOnly = true)
    public ResponseEntity<Resource> download(
            @PathVariable Long id,
            @AuthenticationPrincipal UserDetails p) {

        Attachment attachment = attachmentRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Pièce jointe introuvable."));

        checkAccess(attachment.getTicket(), p.getUsername());

        MediaType mediaType;

        try {
            mediaType = MediaType.parseMediaType(attachment.getType());
        } catch (Exception e) {
            mediaType = MediaType.APPLICATION_OCTET_STREAM;
        }

        Resource resource = fileStorageService.load(attachment.getChemin());

        return ResponseEntity.ok()
                .contentType(mediaType)
                .header(
                        HttpHeaders.CONTENT_DISPOSITION,
                        ContentDisposition.attachment()
                                .filename(attachment.getNomFichier())
                                .build()
                                .toString()
                )
                .body(resource);
    }

    @PostMapping("/api/tickets/{ticketId}/attachments")
    @Transactional
    public ResponseEntity<AttachmentDto> upload(
            @PathVariable Long ticketId,
            @RequestPart("file") MultipartFile file,
            @AuthenticationPrincipal UserDetails p) {

        Ticket ticket = ticketRepository.findById(ticketId)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Ticket introuvable."));

        checkAccess(ticket, p.getUsername());

        if (ticket.getStatut() == Ticket.TicketStatus.ANNULE
                || ticket.getStatut() == Ticket.TicketStatus.CLOTURE) {
            throw new BusinessException(
                    "Ticket annulé ou clôturé : ajout impossible.");
        }

        if (file == null || file.isEmpty()) {
            throw new BusinessException("Fichier vide.");
        }

        String path = fileStorageService.store(file);

        Attachment attachment = Attachment.builder()
                .ticket(ticket)
                .nomFichier(file.getOriginalFilename())
                .type(file.getContentType() != null
                        ? file.getContentType()
                        : "application/octet-stream")
                .taille(file.getSize())
                .chemin(path)
                .build();

        Attachment saved = attachmentRepository.save(attachment);

        AttachmentDto dto = new AttachmentDto(
                saved.getId(),
                saved.getNomFichier(),
                saved.getType(),
                saved.getTaille(),
                saved.getChemin()
        );

        return ResponseEntity.status(201).body(dto);
    }

    private void checkAccess(Ticket ticket, String email) {
        User user = userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur introuvable."));

        access.checkCanView(user, ticket);
    }
}
