package ma.ensaf.itsupport.dto;

import java.time.LocalDateTime;

public record NotificationDto(
    Long id,
    Long ticketId,
    String ticketReference,
    String message,
    boolean lue,
    LocalDateTime date
) {}
