package ma.ensaf.itsupport.dto;

import jakarta.validation.constraints.NotBlank;
import jakarta.validation.constraints.NotNull;
import ma.ensaf.itsupport.entity.Asset.AssetState;
import ma.ensaf.itsupport.entity.Asset.AssetType;
import java.time.LocalDate;

public record AssetRequest(
        @NotBlank String codeInventaire,
        @NotBlank String nom,
        @NotNull AssetType type,
        String marque,
        String modele,
        String numeroSerie,
        @NotNull AssetState etat,
        LocalDate dateAchat,
        Long affecteAId
) {}