package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.NotNull;
import ma.ensaf.itsupport.entity.Ticket;

public record StatusUpdateRequest(
    @NotNull Ticket.TicketStatus statut,
    String solutionAppliquee
) {}
