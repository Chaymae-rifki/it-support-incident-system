
package ma.ensaf.itsupport.security;

import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class TicketAccessPolicy {

    public void checkCanView(User user, Ticket ticket) {
        switch (user.getRole()) {
            case ADMIN, IT_MANAGER -> {
                return;
            }
            case EMPLOYE -> {
                if (ticket.getCreateur() != null
                        && ticket.getCreateur().getId().equals(user.getId())) {
                    return;
                }
            }
            case TECHNICIEN -> {
                if (ticket.getTechnicien() != null
                        && ticket.getTechnicien().getId().equals(user.getId())) {
                    return;
                }
            }
        }

        throw new AccessDeniedException("Accès refusé à ce ticket.");
    }
}

