package ma.ensaf.itsupport.dto;

import java.time.LocalDateTime;

public record TicketHistoryDto(
    Long id,
    String auteurNom,
    String action,
    String ancienStatut,
    String nouveauStatut,
    String details,
    LocalDateTime date
) {}
