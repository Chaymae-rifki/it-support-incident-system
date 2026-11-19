
package ma.ensaf.itsupport.dto;

import java.time.LocalDateTime;

public record InterventionDto(
        Long id,
        Long ticketId,
        Long technicienId,
        String technicienNom,
        String diagnostic,
        String actions,
        String piecesRemplacees,
        int tempsPasseMinutes,
        String solution,
        LocalDateTime dateDebut,
        LocalDateTime dateFin,
        LocalDateTime dateCreation
) {
}

