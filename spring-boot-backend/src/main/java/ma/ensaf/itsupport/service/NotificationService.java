package ma.ensaf.itsupport.service;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.NotificationDto;
import ma.ensaf.itsupport.entity.Notification;
import ma.ensaf.itsupport.entity.Ticket;
import ma.ensaf.itsupport.entity.User;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;
import ma.ensaf.itsupport.repository.NotificationRepository;
import ma.ensaf.itsupport.repository.UserRepository;
import org.springframework.stereotype.Service;
import org.springframework.transaction.annotation.Transactional;

import java.util.List;

@Service
@RequiredArgsConstructor
@Transactional
public class NotificationService {

        private final NotificationRepository notificationRepository;
        private final UserRepository userRepository;

        public void notify(User target, Ticket ticket, String message) {
                notificationRepository.save(Notification.builder()
                                .user(target)
                                .ticket(ticket)
                                .message(message)
                                .lue(false)
                                .build());
        }

        @Transactional(readOnly = true)
        public List<NotificationDto> getMyNotifications(String email) {
                User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
                return notificationRepository.findByUserIdOrderByDateDesc(user.getId()).stream()
                                .map(n -> new NotificationDto(
                                                n.getId(),
                                                n.getTicket() != null ? n.getTicket().getId() : null,
                                                n.getTicket() != null ? n.getTicket().getReference() : null,
                                                n.getMessage(),
                                                n.isLue(),
                                                n.getDate()))
                                .toList();
        }

        public NotificationDto markAsRead(Long id, String email) {
                User user = userRepository.findByEmailIgnoreCase(email).orElseThrow();
                Notification n = notificationRepository.findById(id)
                                .filter(item -> item.getUser().getId().equals(user.getId()))
                                .orElseThrow(() -> new ResourceNotFoundException("Notification introuvable."));
                n.setLue(true);
                notificationRepository.save(n);
                return new NotificationDto(n.getId(),
                                n.getTicket() != null ? n.getTicket().getId() : null,
                                n.getTicket() != null ? n.getTicket().getReference() : null,
                                n.getMessage(), n.isLue(), n.getDate());
        }

        public Long countUnread(String email) {
                User user = userRepository.findByEmailIgnoreCase(email)
                                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

                return notificationRepository.countByUserIdAndLueFalse(user.getId());
        }

        public void markAllAsRead(String email) {
                User user = userRepository.findByEmailIgnoreCase(email)
                                .orElseThrow(() -> new ResourceNotFoundException("Utilisateur introuvable."));

                notificationRepository
                                .findByUserIdOrderByDateDesc(user.getId())
                                .forEach(notification -> notification.setLue(true));
        }
}
