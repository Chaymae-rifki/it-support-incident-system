package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Team;
import org.springframework.data.jpa.repository.JpaRepository;

public interface TeamRepository extends JpaRepository<Team, Long> {
    boolean existsByNomIgnoreCase(String nom);
}
