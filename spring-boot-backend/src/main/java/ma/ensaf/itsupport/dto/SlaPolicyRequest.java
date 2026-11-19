package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.Min;
import jakarta.validation.constraints.NotNull;

public record SlaPolicyRequest(
        @NotNull @Min(1) Integer premiereReponseMinutes,
        @NotNull @Min(1) Integer resolutionMinutes
) {}