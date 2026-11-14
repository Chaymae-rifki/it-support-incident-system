package ma.ensaf.itsupport.repository;

import ma.ensaf.itsupport.entity.Comment;
import org.springframework.data.jpa.repository.JpaRepository;
import java.util.List;

public interface CommentRepository extends JpaRepository<Comment, Long> {
    List<Comment> findByTicketIdOrderByDateAsc(Long ticketId);
    List<Comment> findByTicketIdAndInterneFalseOrderByDateAsc(Long ticketId);
}
