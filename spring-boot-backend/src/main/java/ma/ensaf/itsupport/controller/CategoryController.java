package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.Category;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.repository.CategoryRepository;
import ma.ensaf.itsupport.repository.TicketRepository;
import ma.ensaf.itsupport.service.AuditService;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.security.core.annotation.AuthenticationPrincipal;
import org.springframework.security.core.userdetails.UserDetails;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final TicketRepository ticketRepository;
    private final AuditService auditService;

    @GetMapping
    @PreAuthorize("isAuthenticated()")
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public ResponseEntity<Category> create(@RequestBody Category cat, @AuthenticationPrincipal UserDetails p) {
        if (cat.getNom() == null || cat.getNom().isBlank()) throw new BusinessException("Le nom est obligatoire.");
        if (categoryRepository.existsByNomIgnoreCase(cat.getNom().trim())) throw new BusinessException("Cette catégorie existe déjà.");
        cat.setId(null);
        cat.setNom(cat.getNom().trim());
        Category saved = categoryRepository.save(cat);
        auditService.log(p.getUsername(), "CREATION_CATEGORIE", "Category", saved.getId(), saved.getNom());
        return ResponseEntity.status(201).body(saved);
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasAnyRole('ADMIN','IT_MANAGER')")
    public ResponseEntity<Void> delete(@PathVariable Long id, @AuthenticationPrincipal UserDetails p) {
        if (ticketRepository.countByCategoryId(id) > 0) {
            throw new BusinessException("Impossible de supprimer une catégorie liée à des tickets.");
        }
        categoryRepository.deleteById(id);
        auditService.log(p.getUsername(), "SUPPRESSION_CATEGORIE", "Category", id, null);
        return ResponseEntity.noContent().build();
    }
}