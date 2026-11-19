package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.NotificationDto;
import ma.ensaf.itsupport.service.NotificationService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;
import java.util.Map;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
@PreAuthorize("isAuthenticated()")
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationDto> myNotifications(@AuthenticationPrincipal UserDetails principal) {
        return notificationService.getMyNotifications(principal.getUsername());
    }

    @GetMapping("/unread-count")
    public Map<String, Long> unreadCount(@AuthenticationPrincipal UserDetails principal) {
        return Map.of("count", notificationService.countUnread(principal.getUsername()));
    }

    @PutMapping("/read-all")
    public void readAll(@AuthenticationPrincipal UserDetails principal) {
        notificationService.markAllAsRead(principal.getUsername());
    }

    @PutMapping("/{id}/read")
    public NotificationDto markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        return notificationService.markAsRead(id, principal.getUsername());
    }
}