package ma.ensaf.itsupport.config;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.SlaPolicy;
import ma.ensaf.itsupport.entity.Ticket.TicketPriority;
import ma.ensaf.itsupport.repository.SlaPolicyRepository;
import org.springframework.boot.CommandLineRunner;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class SlaInitializer implements CommandLineRunner {

    private final SlaPolicyRepository repo;

    @Override
    public void run(String... args) {
        if (repo.count() > 0) return;
        repo.save(SlaPolicy.builder().priorite(TicketPriority.CRITIQUE).premiereReponseMinutes(15).resolutionMinutes(4 * 60).build());
        repo.save(SlaPolicy.builder().priorite(TicketPriority.HAUTE).premiereReponseMinutes(60).resolutionMinutes(8 * 60).build());
        repo.save(SlaPolicy.builder().priorite(TicketPriority.MOYENNE).premiereReponseMinutes(4 * 60).resolutionMinutes(24 * 60).build());
        repo.save(SlaPolicy.builder().priorite(TicketPriority.BASSE).premiereReponseMinutes(8 * 60).resolutionMinutes(72 * 60).build());
    }
}