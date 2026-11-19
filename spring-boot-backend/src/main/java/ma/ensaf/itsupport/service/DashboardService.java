package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.DashboardStatsDto;
import ma.ensaf.itsupport.dto.TechnicianLoadDto;
import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.repository.CategoryRepository;
import ma.ensaf.itsupport.repository.TicketRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.time.Duration;
import java.util.Arrays;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional(readOnly = true)
public class DashboardService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;

    public DashboardStatsDto getStats(String email) {
        User current = userRepository.findByEmailIgnoreCase(email).orElseThrow();
        boolean isTech = current.getRole() == User.Role.TECHNICIEN;

        List<Ticket> base = isTech
                ? ticketRepository.findByTechnicienId(current.getId())
                : ticketRepository.findAll();

        long ouverts = base.stream().filter(t -> t.getStatut() == Ticket.TicketStatus.OUVERT).count();
        long enCours = base.stream().filter(t -> t.getStatut() == Ticket.TicketStatus.EN_COURS).count();
        long resolus = base.stream().filter(t -> t.getStatut() == Ticket.TicketStatus.RESOLU).count();
        long clotures = base.stream().filter(t -> t.getStatut() == Ticket.TicketStatus.CLOTURE).count();

        double avgHours = base.stream()
                .filter(t -> t.getDateResolution() != null)
                .mapToDouble(t -> Duration.between(t.getDateCreation(), t.getDateResolution()).toMinutes() / 60.0)
                .average()
                .orElse(0.0);

        long nonAnnules = base.stream().filter(t -> t.getStatut() != Ticket.TicketStatus.ANNULE).count();
        long taux = nonAnnules > 0 ? Math.round(((resolus + clotures) * 100.0) / nonAnnules) : 0;

        var parCategorie = categoryRepository.findAll().stream()
                .map(c -> new DashboardStatsDto.CountItem(c.getNom(),
                        base.stream().filter(t -> t.getCategory().getId().equals(c.getId())).count()))
                .toList();

        var parPriorite = Arrays.stream(Ticket.TicketPriority.values())
                .map(p -> new DashboardStatsDto.CountItem(p.name(),
                        base.stream().filter(t -> t.getPriorite() == p).count()))
                .toList();

        return new DashboardStatsDto(
                isTech ? "PERSONNEL" : "GLOBAL",
                base.size(), ouverts, enCours, resolus, clotures,
                Math.round(avgHours * 10.0) / 10.0, taux,
                parCategorie, parPriorite
        );
    }
    public List<TechnicianLoadDto> getTechnicianLoad() {

    List<User> technicians =
            userRepository.findByRoleAndActifTrue(User.Role.TECHNICIEN);

    return technicians.stream()
            .map(technician -> {

                List<Ticket> tickets =
                        ticketRepository.findByTechnicienId(technician.getId());

                long actifs = tickets.stream()
                        .filter(ticket ->
                                ticket.getStatut() == Ticket.TicketStatus.AFFECTE
                                || ticket.getStatut() == Ticket.TicketStatus.EN_COURS
                                || ticket.getStatut() == Ticket.TicketStatus.EN_ATTENTE
                        )
                        .count();

                long resolus = tickets.stream()
                        .filter(ticket ->
                                ticket.getStatut() == Ticket.TicketStatus.RESOLU
                                || ticket.getStatut() == Ticket.TicketStatus.CLOTURE
                        )
                        .count();

                return new TechnicianLoadDto(
                        technician.getId(),
                        technician.getPrenom() + " " + technician.getNom(),
                        actifs,
                        resolus
                );
            })
            .toList();
}
}
