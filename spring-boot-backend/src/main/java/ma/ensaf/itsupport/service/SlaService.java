package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.repository.SlaPolicyRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.Set;

@Service
@RequiredArgsConstructor
public class SlaService {

    private final SlaPolicyRepository policyRepository;

    private static final Set<Ticket.TicketStatus> FINAUX =
            Set.of(Ticket.TicketStatus.RESOLU, Ticket.TicketStatus.CLOTURE, Ticket.TicketStatus.ANNULE);

    /** Calcule les échéances à partir de la date de création et de la priorité. */
    public void apply(Ticket t) {
        policyRepository.findByPriorite(t.getPriorite()).ifPresent(p -> {
            t.setDateEcheancePremiereReponse(t.getDateCreation().plusMinutes(p.getPremiereReponseMinutes()));
            t.setDateEcheanceResolution(t.getDateCreation().plusMinutes(p.getResolutionMinutes()));
        });
    }

    public boolean isDepasse(Ticket t) {
        if (t.getDateEcheanceResolution() == null) return false;
        if (t.getDateResolution() != null) return t.getDateResolution().isAfter(t.getDateEcheanceResolution());
        return !FINAUX.contains(t.getStatut()) && LocalDateTime.now().isAfter(t.getDateEcheanceResolution());
    }
}