package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.AssetDto;
import ma.ensaf.itsupport.dto.AssetRequest;
import ma.ensaf.itsupport.entity.Asset;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.AssetRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class AssetService {

    private final AssetRepository assetRepository;
    private final UserRepository userRepository;

    @Transactional(readOnly = true)
    public Page<AssetDto> list(String q, Pageable pageable, String email) {
        Page<Asset> assets;

        if (q == null || q.isBlank()) {
            assets = assetRepository.findAll(pageable);
        } else {
            assets = assetRepository
                    .findByNomContainingIgnoreCaseOrCodeInventaireContainingIgnoreCase(
                            q, q, pageable);
        }

        return assets.map(this::toDto);
    }

    @Transactional(readOnly = true)
    public List<AssetDto> mine(String email) {
        User user = getUser(email);

        return assetRepository.findByAffecteAId(user.getId())
                .stream()
                .map(this::toDto)
                .toList();
    }

    @Transactional(readOnly = true)
    public AssetDto get(Long id, String email) {
        return toDto(getAsset(id));
    }

    public AssetDto create(AssetRequest req, String email) {
        if (assetRepository.existsByCodeInventaireIgnoreCase(req.codeInventaire())) {
            throw new BusinessException("Ce code inventaire existe déjà.");
        }

        Asset asset = new Asset();
        applyRequest(asset, req);

        return toDto(assetRepository.save(asset));
    }

    public AssetDto update(Long id, AssetRequest req, String email) {
        Asset asset = getAsset(id);

        assetRepository.findByCodeInventaireIgnoreCase(req.codeInventaire())
                .filter(existing -> !existing.getId().equals(id))
                .ifPresent(existing -> {
                    throw new BusinessException("Ce code inventaire existe déjà.");
                });

        applyRequest(asset, req);

        return toDto(assetRepository.save(asset));
    }

    public void delete(Long id, String email) {
        Asset asset = getAsset(id);
        assetRepository.delete(asset);
    }

    private void applyRequest(Asset asset, AssetRequest req) {
        asset.setCodeInventaire(req.codeInventaire());
        asset.setNom(req.nom());
        asset.setType(req.type());
        asset.setMarque(req.marque());
        asset.setModele(req.modele());
        asset.setNumeroSerie(req.numeroSerie());
        asset.setEtat(req.etat());
        asset.setDateAchat(req.dateAchat());

        if (req.affecteAId() == null) {
            asset.setAffecteA(null);
        } else {
            User user = userRepository.findById(req.affecteAId())
                    .orElseThrow(() -> new ResourceNotFoundException(
                            "Utilisateur introuvable."));
            asset.setAffecteA(user);
        }
    }

    private Asset getAsset(Long id) {
        return assetRepository.findById(id)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Équipement introuvable."));
    }

    private User getUser(String email) {
        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() -> new ResourceNotFoundException(
                        "Utilisateur introuvable."));
    }

    private AssetDto toDto(Asset asset) {
        User user = asset.getAffecteA();

        return new AssetDto(
                asset.getId(),
                asset.getCodeInventaire(),
                asset.getNom(),
                asset.getType(),
                asset.getMarque(),
                asset.getModele(),
                asset.getNumeroSerie(),
                asset.getEtat(),
                asset.getDateAchat(),
                user != null ? user.getId() : null,
                user != null ? user.getEmail() : null
        );
    }
}