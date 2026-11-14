package ma.ensaf.itsupport.dto;

import java.util.List;

public record TicketDetailDto(
    TicketDto ticket,
    List<AttachmentDto> attachments,
    List<CommentDto> comments,
    List<TicketHistoryDto> history
) {}
