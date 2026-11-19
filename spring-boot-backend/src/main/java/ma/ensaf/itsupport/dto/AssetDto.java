package ma.ensaf.itsupport.dto;

import ma.ensaf.itsupport.entity.Asset.AssetState;
import ma.ensaf.itsupport.entity.Asset.AssetType;
import java.time.LocalDate;

public record AssetDto(
        Long id,
        String codeInventaire,
        String nom,
        AssetType type,
        String marque,
        String modele,
        String numeroSerie,
        AssetState etat,
        LocalDate dateAchat,
        Long affecteAId,
        String affecteANom
) {}