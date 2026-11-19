package ma.ensaf.itsupport.controller;

import jakarta.validation.Valid;
import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.dto.AssetDto;
import ma.ensaf.itsupport.dto.AssetRequest;
import ma.ensaf.itsupport.service.AssetService;
import org.springframework.data.domain.Page;
import org.springframework.data.domain.Pageable;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/assets")
@RequiredArgsConstructor
public class AssetController {

    private final AssetService assetService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public Page<AssetDto> list(@RequestParam(required = false) String q, Pageable pageable, @AuthenticationPrincipal UserDetails p) {
        return assetService.list(q, pageable, p.getUsername());
    }

    @GetMapping("/mine")
    @PreAuthorize("isAuthenticated()")
    public List<AssetDto> mine(@AuthenticationPrincipal UserDetails p) {
        return assetService.mine(p.getUsername());
    }

    @GetMapping("/{id}")
    @PreAuthorize("isAuthenticated()")
    public AssetDto get(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        return assetService.get(id, p.getUsername());
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public ResponseEntity<AssetDto> create(@Valid @RequestBody AssetRequest req, @AuthenticationPrincipal UserDetails p) {
        return ResponseEntity.status(201).body(assetService.create(req, p.getUsername()));
    }

    @PutMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public AssetDto update(@PathVariable Long id, @Valid @RequestBody AssetRequest req, @AuthenticationPrincipal UserDetails p) {
        return assetService.update(id, req, p.getUsername());
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        assetService.delete(id, p.getUsername());
        return ResponseEntity.noContent().build();
    }
}