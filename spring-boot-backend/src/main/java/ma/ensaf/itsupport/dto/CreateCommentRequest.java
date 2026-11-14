package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.NotBlank;

public record CreateCommentRequest(
    @NotBlank String contenu,
    boolean interne
) {}
