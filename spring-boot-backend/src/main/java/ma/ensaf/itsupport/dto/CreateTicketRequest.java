package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ma.ensaf.itsupport.entity.Ticket;

public record CreateTicketRequest(
    @NotBlank String titre,
    @NotBlank String description,
    @NotNull Long categoryId,
    @NotNull Ticket.TicketPriority priorite
) {}
