package ma.ensaf.itsupport.dto;

import ma.ensaf.itsupport.entity.Ticket;
import java.time.LocalDateTime;

public record TicketDto(
    Long id,
    String reference,
    String titre,
    String description,
    Ticket.TicketStatus statut,
    Ticket.TicketPriority priorite,
    Long categoryId,
    String categoryNom,
    Long createurId,
    String createurNom,
    Long technicienId,
    String technicienNom,
    Long teamId,
    String teamNom,
    String solutionAppliquee,
    LocalDateTime dateCreation,
    LocalDateTime dateResolution,
    LocalDateTime dateCloture
) {}
