
package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.CreateInterventionRequest;
import ma.ensaf.itsupport.dto.InterventionDto;
import ma.ensaf.itsupport.entity.Intervention;
import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.InterventionRepository;
import ma.ensaf.itsupport.repository.TicketRepository;
import ma.ensaf.itsupport.repository.UserRepository;

import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class InterventionService {

    private final InterventionRepository interventionRepository;
    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;

    public InterventionDto create(
            Long ticketId,
            CreateInterventionRequest req,
            String email) {

        User technician = getUser(email);

        if (technician.getRole() != User.Role.TECHNICIEN) {
            throw new AccessDeniedException(
                    "Seul un technicien peut créer une intervention."
            );
        }

        Ticket ticket = getTicket(ticketId);

        if (ticket.getTechnicien() == null
                || !ticket.getTechnicien().getId().equals(technician.getId())) {

            throw new AccessDeniedException(
                    "Vous ne pouvez intervenir que sur vos propres tickets."
            );
        }

        if (ticket.getStatut() != Ticket.TicketStatus.AFFECTE
                && ticket.getStatut() != Ticket.TicketStatus.EN_COURS
                && ticket.getStatut() != Ticket.TicketStatus.EN_ATTENTE) {

            throw new BusinessException(
                    "Une intervention n'est pas autorisée pour ce statut."
            );
        }

        if (req.tempsPasseMinutes() < 0) {
            throw new BusinessException(
                    "Le temps passé ne peut pas être négatif."
            );
        }

        LocalDateTime debut = req.dateDebut() != null
                ? req.dateDebut()
                : LocalDateTime.now();

        if (req.dateFin() != null && req.dateFin().isBefore(debut)) {
            throw new BusinessException(
                    "La date de fin doit être postérieure à la date de début."
            );
        }

        Intervention intervention = Intervention.builder()
                .ticket(ticket)
                .technicien(technician)
                .diagnostic(req.diagnostic().trim())
                .actions(req.actions())
                .piecesRemplacees(req.piecesRemplacees())
                .tempsPasseMinutes(req.tempsPasseMinutes())
                .solution(req.solution())
                .dateDebut(debut)
                .dateFin(req.dateFin())
                .dateCreation(LocalDateTime.now())
                .build();

        return toDto(interventionRepository.save(intervention));
    }

    @Transactional(readOnly = true)
    public List<InterventionDto> list(Long ticketId, String email) {

        User viewer = getUser(email);
        Ticket ticket = getTicket(ticketId);

        if (viewer.getRole() == User.Role.EMPLOYE) {
            throw new AccessDeniedException(
                    "Accès réservé aux techniciens et gestionnaires."
            );
        }

        if (viewer.getRole() == User.Role.TECHNICIEN
                && (ticket.getTechnicien() == null
                || !ticket.getTechnicien().getId().equals(viewer.getId()))) {

            throw new AccessDeniedException(
                    "Vous ne pouvez consulter que les interventions de vos tickets."
            );
        }

        return interventionRepository
                .findByTicketIdOrderByDateCreationDesc(ticketId)
                .stream()
                .map(this::toDto)
                .toList();
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Utilisateur introuvable."));
    }

    private Ticket getTicket(Long id) {
        return ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException("Ticket introuvable."));
    }

    private InterventionDto toDto(Intervention intervention) {

        User technician = intervention.getTechnicien();

        return new InterventionDto(
                intervention.getId(),
                intervention.getTicket().getId(),
                technician.getId(),
                technician.getPrenom() + " " + technician.getNom(),
                intervention.getDiagnostic(),
                intervention.getActions(),
                intervention.getPiecesRemplacees(),
                intervention.getTempsPasseMinutes(),
                intervention.getSolution(),
                intervention.getDateDebut(),
                intervention.getDateFin(),
                intervention.getDateCreation()
        );
    }
}
