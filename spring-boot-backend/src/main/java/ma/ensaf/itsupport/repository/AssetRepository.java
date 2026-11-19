package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Asset;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.repository.JpaRepository;

import java.util.List;
import java.util.Optional;

public interface AssetRepository extends JpaRepository<Asset, Long> {

    boolean existsByCodeInventaireIgnoreCase(String codeInventaire);

    Optional<Asset> findByCodeInventaireIgnoreCase(String codeInventaire);

    List<Asset> findByAffecteAId(Long userId);

    Page<Asset> findByNomContainingIgnoreCaseOrCodeInventaireContainingIgnoreCase(
            String nom, String codeInventaire, Pageable pageable
    );
}