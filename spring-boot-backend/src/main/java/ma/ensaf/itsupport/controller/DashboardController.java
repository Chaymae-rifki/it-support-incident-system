package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.DashboardStatsDto;
import ma.ensaf.itsupport.dto.TechnicianLoadDto;
import ma.ensaf.itsupport.service.DashboardService;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/dashboard")
@RequiredArgsConstructor
public class DashboardController {

    private final DashboardService dashboardService;

    @GetMapping("/stats")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER','TECHNICIEN')")
    public DashboardStatsDto stats(@AuthenticationPrincipal UserDetails principal) {
        return dashboardService.getStats(principal.getUsername());
    }

    @GetMapping("/technicians")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public List<TechnicianLoadDto> technicians() {
        return dashboardService.getTechnicianLoad();
    }
}