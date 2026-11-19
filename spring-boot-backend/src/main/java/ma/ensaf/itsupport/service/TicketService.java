
package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.*;
import ma.ensaf.itsupport.entity.*;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.*;

import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.data.jpa.domain.Specification;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.web.multipart.MultipartFile;

import java.time.LocalDateTime;
import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class TicketService {

    private final TicketRepository ticketRepository;
    private final UserRepository userRepository;
    private final CategoryRepository categoryRepository;
    private final TeamRepository teamRepository;
    private final CommentRepository commentRepository;
    private final AttachmentRepository attachmentRepository;
    private final TicketHistoryRepository historyRepository;
    private final NotificationService notificationService;
    private final FileStorageService fileStorageService;
    private final TicketWorkflow ticketWorkflow;


    public TicketDto create(
            String email,
            CreateTicketRequest req,
            MultipartFile file) {

        User creator = getUser(email);

        Category category = categoryRepository.findById(req.categoryId())
                .orElseThrow(() ->
                        new ResourceNotFoundException("Catégorie introuvable."));

        if (req.titre() == null || req.titre().isBlank()) {
            throw new BusinessException("Le titre est obligatoire.");
        }

        if (req.description() == null || req.description().isBlank()) {
            throw new BusinessException("La description est obligatoire.");
        }

        if (req.priorite() == null) {
            throw new BusinessException("La priorité est obligatoire.");
        }

        Ticket ticket = Ticket.builder()
                .reference("INC-TEMP-" + System.currentTimeMillis())
                .titre(req.titre().trim())
                .description(req.description().trim())
                .priorite(req.priorite())
                .statut(Ticket.TicketStatus.OUVERT)
                .category(category)
                .createur(creator)
                .build();

        ticket = ticketRepository.save(ticket);

        ticket.setReference(
                String.format("INC-2026-%04d", ticket.getId())
        );

        ticket = ticketRepository.save(ticket);

        if (file != null && !file.isEmpty()) {

            String path = fileStorageService.store(file);

            attachmentRepository.save(
                    Attachment.builder()
                            .ticket(ticket)
                            .nomFichier(file.getOriginalFilename())
                            .type(file.getContentType() != null
                                    ? file.getContentType()
                                    : "application/octet-stream")
                            .taille(file.getSize())
                            .chemin(path)
                            .build()
            );
        }

        logHistory(
                ticket,
                creator,
                "Création du ticket",
                null,
                Ticket.TicketStatus.OUVERT.name(),
                "Ticket créé dans la catégorie " + category.getNom()
        );

        // Notification aux administrateurs pour un ticket critique
        if (req.priorite() == Ticket.TicketPriority.CRITIQUE) {

            List<User> admins =
                    userRepository.findByRoleAndActifTrue(User.Role.ADMIN);

            for (User admin : admins) {
                notificationService.notify(
                        admin,
                        ticket,
                        "Ticket CRITIQUE " + ticket.getReference()
                                + " créé par "
                                + creator.getPrenom() + " "
                                + creator.getNom()
                );
            }
        }

        return toDto(ticket);
    }


    @Transactional(readOnly = true)
    public Page<TicketDto> findMyTickets(
            String email,
            Pageable pageable) {

        User user = getUser(email);

        return ticketRepository
                .findByCreateurId(user.getId(), pageable)
                .map(this::toDto);
    }



    @Transactional(readOnly = true)
    public Page<TicketDto> findAll(
            TicketFilter filter,
            Pageable pageable,
            String email) {

        User viewer = getUser(email);

        Specification<Ticket> spec =
                (root, query, cb) -> cb.conjunction();

        // Un employé voit uniquement ses propres tickets
        if (viewer.getRole() == User.Role.EMPLOYE) {

            Long employeeId = viewer.getId();

            spec = spec.and((root, query, cb) ->
                    cb.equal(
                            root.get("createur").get("id"),
                            employeeId
                    )
            );
        }

        // Un technicien voit uniquement les tickets qui lui sont affectés
        if (viewer.getRole() == User.Role.TECHNICIEN) {

            Long technicianId = viewer.getId();

            spec = spec.and((root, query, cb) ->
                    cb.equal(
                            root.get("technicien").get("id"),
                            technicianId
                    )
            );
        }

        if (filter != null) {

            if (filter.statut() != null) {
                spec = spec.and((root, query, cb) ->
                        cb.equal(
                                root.get("statut"),
                                filter.statut()
                        )
                );
            }

            if (filter.priorite() != null) {
                spec = spec.and((root, query, cb) ->
                        cb.equal(
                                root.get("priorite"),
                                filter.priorite()
                        )
                );
            }

            if (filter.categoryId() != null) {
                spec = spec.and((root, query, cb) ->
                        cb.equal(
                                root.get("category").get("id"),
                                filter.categoryId()
                        )
                );
            }

            if (filter.teamId() != null) {
                spec = spec.and((root, query, cb) ->
                        cb.equal(
                                root.get("team").get("id"),
                                filter.teamId()
                        )
                );
            }

            if (filter.q() != null && !filter.q().isBlank()) {

                String pattern =
                        "%" + filter.q().trim().toLowerCase() + "%";

                spec = spec.and((root, query, cb) ->
                        cb.or(
                                cb.like(
                                        cb.lower(root.get("titre")),
                                        pattern
                                ),
                                cb.like(
                                        cb.lower(root.get("reference")),
                                        pattern
                                )
                        )
                );
            }
        }

        return ticketRepository
                .findAll(spec, pageable)
                .map(this::toDto);
    }


    @Transactional(readOnly = true)
    public TicketDetailDto findDetailById(
            Long id,
            String email) {

        User viewer = getUser(email);
        Ticket ticket = getTicket(id);

        verifierAccesTicket(ticket, viewer);

        // Les employés ne voient pas les commentaires internes
        List<Comment> comments =
                viewer.getRole() == User.Role.EMPLOYE
                        ? commentRepository
                                .findByTicketIdAndInterneFalseOrderByDateAsc(id)
                        : commentRepository
                                .findByTicketIdOrderByDateAsc(id);

        return new TicketDetailDto(
                toDto(ticket),

                attachmentRepository.findByTicketId(id)
                        .stream()
                        .map(a -> new AttachmentDto(
                                a.getId(),
                                a.getNomFichier(),
                                a.getType(),
                                a.getTaille(),
                                a.getChemin()
                        ))
                        .toList(),

                comments.stream()
                        .map(c -> new CommentDto(
                                c.getId(),
                                c.getAuteur().getId(),
                                c.getAuteur().getPrenom() + " "
                                        + c.getAuteur().getNom(),
                                c.getAuteur().getRole(),
                                c.getContenu(),
                                c.getDate(),
                                c.isInterne()
                        ))
                        .toList(),

                getHistory(id, email)
        );
    }



    public TicketDto assign(
            Long id,
            AssignTicketRequest req,
            String adminEmail) {

        User admin = getUser(adminEmail);

        verifierRoleGestionnaire(admin);

        Ticket ticket = getTicket(id);

        ensureModifiable(ticket);

        String oldStatus = ticket.getStatut().name();

        if (req.technicienId() != null) {

            User tech = userRepository.findById(req.technicienId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Technicien introuvable."
                            ));

            if (tech.getRole() != User.Role.TECHNICIEN) {
                throw new BusinessException(
                        "L'utilisateur sélectionné n'est pas un technicien."
                );
            }

            ticket.setTechnicien(tech);

            // OUVERT -> AFFECTE
            if (ticket.getStatut() == Ticket.TicketStatus.OUVERT) {

                ticketWorkflow.verifierTransition(
                        ticket.getStatut(),
                        Ticket.TicketStatus.AFFECTE
                );

                ticket.setStatut(Ticket.TicketStatus.AFFECTE);
            }

            // Affecter automatiquement l'équipe du technicien
            if (tech.getTeam() != null && ticket.getTeam() == null) {
                ticket.setTeam(tech.getTeam());
            }

            notificationService.notify(
                    tech,
                    ticket,
                    "Le ticket " + ticket.getReference()
                            + " vous a été affecté."
            );
        }

        if (req.teamId() != null) {

            Team team = teamRepository.findById(req.teamId())
                    .orElseThrow(() ->
                            new ResourceNotFoundException(
                                    "Équipe introuvable."
                            ));

            ticket.setTeam(team);
        }

        ticketRepository.save(ticket);

        logHistory(
                ticket,
                admin,
                "Affectation",
                oldStatus,
                ticket.getStatut().name(),
                "Ticket affecté par " + admin.getPrenom()
        );

        notificationService.notify(
                ticket.getCreateur(),
                ticket,
                "Votre ticket " + ticket.getReference()
                        + " a été affecté."
        );

        return toDto(ticket);
    }


    public TicketDto take(Long id, String techEmail) {

        User tech = getUser(techEmail);

        if (tech.getRole() != User.Role.TECHNICIEN) {
            throw new AccessDeniedException(
                    "Seul un technicien peut prendre en charge un ticket."
            );
        }

        Ticket ticket = getTicket(id);

        ensureModifiable(ticket);

        if (ticket.getTechnicien() != null
                && !ticket.getTechnicien().getId().equals(tech.getId())) {

            throw new BusinessException(
                    "Ce ticket est déjà assigné à un autre technicien."
            );
        }

        String oldStatus = ticket.getStatut().name();

        // Si le ticket est encore OUVERT :
        // OUVERT -> AFFECTE -> EN_COURS
        if (ticket.getStatut() == Ticket.TicketStatus.OUVERT) {

            ticketWorkflow.verifierTransition(
                    Ticket.TicketStatus.OUVERT,
                    Ticket.TicketStatus.AFFECTE
            );

            ticket.setStatut(Ticket.TicketStatus.AFFECTE);
        }

        if (ticket.getStatut() == Ticket.TicketStatus.AFFECTE
                || ticket.getStatut() == Ticket.TicketStatus.EN_ATTENTE) {

            ticketWorkflow.verifierTransition(
                    ticket.getStatut(),
                    Ticket.TicketStatus.EN_COURS
            );

            ticket.setStatut(Ticket.TicketStatus.EN_COURS);
        } else if (ticket.getStatut() != Ticket.TicketStatus.EN_COURS) {

            throw new BusinessException(
                    "Ce ticket ne peut pas être pris en charge dans son état actuel."
            );
        }

        ticket.setTechnicien(tech);

        if (tech.getTeam() != null && ticket.getTeam() == null) {
            ticket.setTeam(tech.getTeam());
        }

        ticketRepository.save(ticket);

        logHistory(
                ticket,
                tech,
                "Prise en charge",
                oldStatus,
                ticket.getStatut().name(),
                "Pris en charge par " + tech.getPrenom()
        );

        notificationService.notify(
                ticket.getCreateur(),
                ticket,
                "Votre ticket " + ticket.getReference()
                        + " est pris en charge."
        );

        return toDto(ticket);
    }


    public TicketDto updateStatus(
            Long id,
            StatusUpdateRequest req,
            String actorEmail) {

        User actor = getUser(actorEmail);

        Ticket ticket = getTicket(id);

        ensureModifiable(ticket);

        if (actor.getRole() != User.Role.TECHNICIEN
                && actor.getRole() != User.Role.ADMIN
                && actor.getRole() != User.Role.IT_MANAGER) {

            throw new AccessDeniedException(
                    "Vous n'avez pas le droit de modifier le statut."
            );
        }

        // Un technicien ne peut modifier que ses propres tickets
        if (actor.getRole() == User.Role.TECHNICIEN
                && (ticket.getTechnicien() == null
                || !ticket.getTechnicien().getId().equals(actor.getId()))) {

            throw new AccessDeniedException(
                    "Vous ne pouvez modifier que les tickets qui vous sont affectés."
            );
        }

        if (req.statut() == null) {
            throw new BusinessException(
                    "Le nouveau statut est obligatoire."
            );
        }

        // Vérifier la transition
        ticketWorkflow.verifierTransition(
                ticket.getStatut(),
                req.statut()
        );

        // La solution est obligatoire pour résoudre
        if (req.statut() == Ticket.TicketStatus.RESOLU
                && (req.solutionAppliquee() == null
                || req.solutionAppliquee().isBlank())
                && (ticket.getSolutionAppliquee() == null
                || ticket.getSolutionAppliquee().isBlank())) {

            throw new BusinessException(
                    "La solution appliquée est obligatoire pour résoudre un ticket."
            );
        }

        String oldStatus = ticket.getStatut().name();

        if (req.solutionAppliquee() != null
                && !req.solutionAppliquee().isBlank()) {

            ticket.setSolutionAppliquee(
                    req.solutionAppliquee().trim()
            );
        }

        ticket.setStatut(req.statut());

        if (req.statut() == Ticket.TicketStatus.RESOLU) {
            ticket.setDateResolution(LocalDateTime.now());
        }

        ticketRepository.save(ticket);

        logHistory(
                ticket,
                actor,
                "Changement de statut",
                oldStatus,
                req.statut().name(),
                "Statut mis à jour"
        );

        notificationService.notify(
                ticket.getCreateur(),
                ticket,
                "Votre ticket " + ticket.getReference()
                        + " est passé au statut "
                        + req.statut().name()
        );

        return toDto(ticket);
    }


    public TicketDto cancel(Long id, String employeeEmail) {

        User emp = getUser(employeeEmail);
        Ticket ticket = getTicket(id);

        if (!ticket.getCreateur().getId().equals(emp.getId())) {
            throw new AccessDeniedException(
                    "Vous ne pouvez annuler que vos propres tickets."
            );
        }

        if (ticket.getStatut() != Ticket.TicketStatus.OUVERT) {
            throw new BusinessException(
                    "Un ticket déjà pris en charge ne peut plus être annulé."
            );
        }

        ticketWorkflow.verifierTransition(
                ticket.getStatut(),
                Ticket.TicketStatus.ANNULE
        );

        ticket.setStatut(Ticket.TicketStatus.ANNULE);

        ticketRepository.save(ticket);

        logHistory(
                ticket,
                emp,
                "Annulation",
                "OUVERT",
                "ANNULE",
                "Annulé par l'employé"
        );

        return toDto(ticket);
    }


    public TicketDto confirmResolution(
            Long id,
            String employeeEmail) {

        User emp = getUser(employeeEmail);
        Ticket ticket = getTicket(id);

        if (!ticket.getCreateur().getId().equals(emp.getId())) {
            throw new AccessDeniedException(
                    "Action réservée au créateur du ticket."
            );
        }

        if (ticket.getStatut() != Ticket.TicketStatus.RESOLU) {
            throw new BusinessException(
                    "Seul un ticket résolu peut être clôturé."
            );
        }

        ticketWorkflow.verifierTransition(
                ticket.getStatut(),
                Ticket.TicketStatus.CLOTURE
        );

        ticket.setStatut(Ticket.TicketStatus.CLOTURE);
        ticket.setDateCloture(LocalDateTime.now());

        ticketRepository.save(ticket);

        logHistory(
                ticket,
                emp,
                "Confirmation résolution",
                "RESOLU",
                "CLOTURE",
                "Clôturé par l'employé"
        );

        return toDto(ticket);
    }



    public TicketDto reopen(
            Long id,
            String motif,
            String employeeEmail) {

        User emp = getUser(employeeEmail);
        Ticket ticket = getTicket(id);

        if (!ticket.getCreateur().getId().equals(emp.getId())) {
            throw new AccessDeniedException(
                    "Action réservée au créateur."
            );
        }

        if (ticket.getStatut() != Ticket.TicketStatus.RESOLU) {
            throw new BusinessException(
                    "Seul un ticket au statut RESOLU peut être rouvert."
            );
        }

        ticketWorkflow.verifierTransition(
                ticket.getStatut(),
                Ticket.TicketStatus.EN_COURS
        );

        String oldStatus = ticket.getStatut().name();

        ticket.setStatut(Ticket.TicketStatus.EN_COURS);
        ticket.setDateResolution(null);

        ticketRepository.save(ticket);

        logHistory(
                ticket,
                emp,
                "Réouverture",
                oldStatus,
                Ticket.TicketStatus.EN_COURS.name(),
                motif != null && !motif.isBlank()
                        ? motif.trim()
                        : "Ticket rouvert par l'employé"
        );

        if (ticket.getTechnicien() != null) {
            notificationService.notify(
                    ticket.getTechnicien(),
                    ticket,
                    "Le ticket " + ticket.getReference()
                            + " a été rouvert."
            );
        }

        return toDto(ticket);
    }


    public CommentDto addComment(
            Long id,
            CreateCommentRequest req,
            String actorEmail) {

        User actor = getUser(actorEmail);
        Ticket ticket = getTicket(id);

        ensureModifiable(ticket);
        verifierAccesTicket(ticket, actor);

        if (req.contenu() == null || req.contenu().isBlank()) {
            throw new BusinessException(
                    "Le contenu du commentaire est obligatoire."
            );
        }

        // Un employé ne peut jamais créer une note interne
        boolean internal =
                actor.getRole() != User.Role.EMPLOYE && req.interne();

        Comment saved = commentRepository.save(
                Comment.builder()
                        .ticket(ticket)
                        .auteur(actor)
                        .contenu(req.contenu().trim())
                        .interne(internal)
                        .build()
        );

        logHistory(
                ticket,
                actor,
                internal ? "Note interne" : "Commentaire",
                ticket.getStatut().name(),
                ticket.getStatut().name(),
                internal
                        ? "Ajout d'une note interne"
                        : "Ajout d'un commentaire"
        );

        if (!internal
                && !actor.getId().equals(ticket.getCreateur().getId())) {

            notificationService.notify(
                    ticket.getCreateur(),
                    ticket,
                    "Nouveau commentaire sur votre ticket "
                            + ticket.getReference()
            );
        }

        return new CommentDto(
                saved.getId(),
                actor.getId(),
                actor.getPrenom() + " " + actor.getNom(),
                actor.getRole(),
                saved.getContenu(),
                saved.getDate(),
                saved.isInterne()
        );
    }



    @Transactional(readOnly = true)
    public List<TicketHistoryDto> getHistory(
            Long id,
            String email) {

        User viewer = getUser(email);
        Ticket ticket = getTicket(id);

        verifierAccesTicket(ticket, viewer);

        return historyRepository
                .findByTicketIdOrderByDateDesc(id)
                .stream()

                // Ne pas exposer les notes internes aux employés
                .filter(h ->
                        viewer.getRole() != User.Role.EMPLOYE
                                || !"Note interne".equals(h.getAction())
                )

                .map(h -> new TicketHistoryDto(
                        h.getId(),
                        h.getAuteur().getPrenom() + " "
                                + h.getAuteur().getNom(),
                        h.getAction(),
                        h.getAncienStatut(),
                        h.getNouveauStatut(),
                        h.getDetails(),
                        h.getDate()
                ))
                .toList();
    }


    private void ensureModifiable(Ticket ticket) {

        if (ticket.getStatut() == Ticket.TicketStatus.ANNULE
                || ticket.getStatut() == Ticket.TicketStatus.CLOTURE) {

            throw new BusinessException(
                    "Un ticket annulé ou clôturé ne peut plus être modifié."
            );
        }
    }

    private void verifierAccesTicket(
            Ticket ticket,
            User viewer) {

        if (viewer.getRole() == User.Role.EMPLOYE
                && !ticket.getCreateur().getId().equals(viewer.getId())) {

            throw new AccessDeniedException(
                    "Vous ne pouvez consulter que vos propres tickets."
            );
        }

        if (viewer.getRole() == User.Role.TECHNICIEN
                && (ticket.getTechnicien() == null
                || !ticket.getTechnicien().getId().equals(viewer.getId()))) {

            throw new AccessDeniedException(
                    "Vous ne pouvez consulter que les tickets qui vous sont affectés."
            );
        }
    }

    private void verifierRoleGestionnaire(User user) {

        if (user.getRole() != User.Role.ADMIN
                && user.getRole() != User.Role.IT_MANAGER) {

            throw new AccessDeniedException(
                    "Seul un administrateur ou un responsable IT peut affecter un ticket."
            );
        }
    }

    private void logHistory(
            Ticket ticket,
            User actor,
            String action,
            String oldStatus,
            String newStatus,
            String details) {

        historyRepository.save(
                TicketHistory.builder()
                        .ticket(ticket)
                        .auteur(actor)
                        .action(action)
                        .ancienStatut(oldStatus)
                        .nouveauStatut(newStatus)
                        .details(details)
                        .build()
        );
    }

    private User getUser(String email) {

        return userRepository.findByEmailIgnoreCase(email)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Utilisateur introuvable."
                        ));
    }

    private Ticket getTicket(Long id) {

        return ticketRepository.findById(id)
                .orElseThrow(() ->
                        new ResourceNotFoundException(
                                "Ticket introuvable."
                        ));
    }



    private TicketDto toDto(Ticket t) {

        return new TicketDto(
                t.getId(),
                t.getReference(),
                t.getTitre(),
                t.getDescription(),

                t.getStatut(),
                t.getPriorite(),

                t.getCategory().getId(),
                t.getCategory().getNom(),

                t.getCreateur().getId(),
                t.getCreateur().getPrenom() + " "
                        + t.getCreateur().getNom(),

                t.getTechnicien() != null
                        ? t.getTechnicien().getId()
                        : null,

                t.getTechnicien() != null
                        ? t.getTechnicien().getPrenom() + " "
                                + t.getTechnicien().getNom()
                        : null,

                t.getTeam() != null
                        ? t.getTeam().getId()
                        : null,

                t.getTeam() != null
                        ? t.getTeam().getNom()
                        : null,

                t.getSolutionAppliquee(),
                t.getDateCreation(),
                t.getDateResolution(),
                t.getDateCloture()
        );
    }
}
