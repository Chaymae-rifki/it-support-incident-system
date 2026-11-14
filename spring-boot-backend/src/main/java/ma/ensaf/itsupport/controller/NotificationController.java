package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.NotificationDto;
import ma.ensaf.itsupport.service.NotificationService;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/notifications")
@RequiredArgsConstructor
public class NotificationController {

    private final NotificationService notificationService;

    @GetMapping
    public List<NotificationDto> myNotifications(@AuthenticationPrincipal UserDetails principal) {
        return notificationService.getMyNotifications(principal.getUsername());
    }

    @PutMapping("/{id}/read")
    public NotificationDto markAsRead(@PathVariable Long id, @AuthenticationPrincipal UserDetails principal) {
        return notificationService.markAsRead(id, principal.getUsername());
    }
}
