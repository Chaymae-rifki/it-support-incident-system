package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.repository.TicketRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import org.springframework.scheduling.annotation.Scheduled;
import org.springframework.stereotype.Component;
import org.springframework.transaction.annotation.Transactional;

import java.time.LocalDateTime;
import java.util.List;

@Component
@RequiredArgsConstructor
public class SlaScheduler {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final NotificationService notificationService;

    @Scheduled(fixedRate = 600_000)
    @Transactional
    public void verifierSla() {
        List<Ticket> aRisque = ticketRepository.findSlaARisque(
                List.of(Ticket.TicketStatus.RESOLU, Ticket.TicketStatus.CLOTURE, Ticket.TicketStatus.ANNULE),
                LocalDateTime.now().plusMinutes(30));

        List<User> managers = userRepository.findByRoleAndActifTrue(User.Role.IT_MANAGER);
        for (Ticket t : aRisque) {
            String msg = "SLA proche/dépassé pour le ticket " + t.getReference();
            for (User manager : managers) {
                notificationService.notify(manager, t, msg);
            }

            if (t.getTechnicien() != null) {
                notificationService.notify(t.getTechnicien(), t, msg);
            }
            t.setSlaAlerteEnvoyee(true);
        }
    }
}