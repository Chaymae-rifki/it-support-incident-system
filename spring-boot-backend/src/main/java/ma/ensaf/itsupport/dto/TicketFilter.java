package ma.ensaf.itsupport.dto;

import ma.ensaf.itsupport.entity.Ticket;

public record TicketFilter(
    Ticket.TicketStatus statut,
    Ticket.TicketPriority priorite,
    Long categoryId,
    Long teamId,
    String q
) {}
