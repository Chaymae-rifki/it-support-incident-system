package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.Email;
import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ma.ensaf.itsupport.entity.User;

public record CreateUserRequest(
    @NotBlank String nom,
    @NotBlank String prenom,
    @NotBlank @Email String email,
    @NotBlank String motDePasse,
    @NotNull User.Role role,
    Long teamId
) {}
