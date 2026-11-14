package ma.ensaf.itsupport.dto;

import ma.ensaf.itsupport.entity.User;
import java.time.LocalDateTime;

public record CommentDto(
    Long id,
    Long auteurId,
    String auteurNom,
    User.Role auteurRole,
    String contenu,
    LocalDateTime date,
    boolean interne
) {}
