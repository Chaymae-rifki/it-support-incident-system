package ma.ensaf.itsupport.dto;

import ma.ensaf.itsupport.entity.User;
import java.time.LocalDateTime;

public record UserDto(
    Long id,
    String nom,
    String prenom,
    String email,
    User.Role role,
    boolean actif,
    Long teamId,
    String teamNom,
    LocalDateTime dateCreation
) {}
