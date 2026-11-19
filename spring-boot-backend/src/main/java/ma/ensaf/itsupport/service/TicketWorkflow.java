
package ma.ensaf.itsupport.service;

import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.exception.BusinessException;
import org.springframework.stereotype.Component;

import java.util.EnumMap;
import java.util.EnumSet;
import java.util.Map;
import java.util.Set;

@Component
public class TicketWorkflow {

    private static final Map<Ticket.TicketStatus, Set<Ticket.TicketStatus>> TRANSITIONS =
            new EnumMap<>(Ticket.TicketStatus.class);

    static {
        TRANSITIONS.put(Ticket.TicketStatus.OUVERT,
                EnumSet.of(
                        Ticket.TicketStatus.AFFECTE,
                        Ticket.TicketStatus.ANNULE
                ));

        TRANSITIONS.put(Ticket.TicketStatus.AFFECTE,
                EnumSet.of(
                        Ticket.TicketStatus.EN_COURS,
                        Ticket.TicketStatus.ANNULE
                ));

        TRANSITIONS.put(Ticket.TicketStatus.EN_COURS,
                EnumSet.of(
                        Ticket.TicketStatus.EN_ATTENTE,
                        Ticket.TicketStatus.RESOLU
                ));

        TRANSITIONS.put(Ticket.TicketStatus.EN_ATTENTE,
                EnumSet.of(
                        Ticket.TicketStatus.EN_COURS
                ));

        TRANSITIONS.put(Ticket.TicketStatus.RESOLU,
                EnumSet.of(
                        Ticket.TicketStatus.CLOTURE,
                        Ticket.TicketStatus.EN_COURS
                ));

        TRANSITIONS.put(Ticket.TicketStatus.CLOTURE,
                EnumSet.noneOf(Ticket.TicketStatus.class));

        TRANSITIONS.put(Ticket.TicketStatus.ANNULE,
                EnumSet.noneOf(Ticket.TicketStatus.class));
    }

    public boolean estTransitionAutorisee(
            Ticket.TicketStatus ancienStatut,
            Ticket.TicketStatus nouveauStatut) {

        if (ancienStatut == null || nouveauStatut == null) {
            return false;
        }

        return TRANSITIONS
                .getOrDefault(
                        ancienStatut,
                        EnumSet.noneOf(Ticket.TicketStatus.class)
                )
                .contains(nouveauStatut);
    }

    public void verifierTransition(
            Ticket.TicketStatus ancienStatut,
            Ticket.TicketStatus nouveauStatut) {

        if (!estTransitionAutorisee(ancienStatut, nouveauStatut)) {
            throw new BusinessException(
                    "Transition de statut non autorisée : "
                            + ancienStatut + " -> " + nouveauStatut
            );
        }
    }
}
