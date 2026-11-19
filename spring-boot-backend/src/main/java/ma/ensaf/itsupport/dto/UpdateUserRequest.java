package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ma.ensaf.itsupport.entity.User;

public record UpdateUserRequest(
    @NotBlank String nom,
    @NotBlank String prenom,
    @NotNull User.Role role,
    Long teamId
) {}