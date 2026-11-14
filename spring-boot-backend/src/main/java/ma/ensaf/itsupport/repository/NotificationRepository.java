package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Notification;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface NotificationRepository extends JpaRepository<Notification, Long> {
    List<Notification> findByUserIdOrderByDateDesc(Long userId);
    long countByUserIdAndLueFalse(Long userId);
}
