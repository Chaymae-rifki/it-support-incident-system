
package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotBlank;
import java.time.LocalDateTime;

public record CreateInterventionRequest(
        @NotBlank String diagnostic,
        String actions,
        String piecesRemplacees,
        @Min(0) int tempsPasseMinutes,
        String solution,
        LocalDateTime dateDebut,
        LocalDateTime dateFin
) {
}
