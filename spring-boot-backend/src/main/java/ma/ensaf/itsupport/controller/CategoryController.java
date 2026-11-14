package ma.ensaf.itsupport.controller;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.Category;
import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.repository.CategoryRepository;
import ma.ensaf.itsupport.repository.TicketRepository;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.prepost.PreAuthorize;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/api/categories")
@RequiredArgsConstructor
public class CategoryController {

    private final CategoryRepository categoryRepository;
    private final TicketRepository ticketRepository;

    @GetMapping
    public List<Category> findAll() {
        return categoryRepository.findAll();
    }

    @PostMapping
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Category> create(@RequestBody Category cat) {
        return ResponseEntity.status(201).body(categoryRepository.save(cat));
    }

    @DeleteMapping("/{id}")
    @PreAuthorize("hasRole('ADMIN')")
    public ResponseEntity<Void> delete(@PathVariable Long id) {
        if (ticketRepository.countByCategoryId(id) > 0) {
            throw new BusinessException("Impossible de supprimer une catégorie liée à des tickets.");
        }
        categoryRepository.deleteById(id);
        return ResponseEntity.noContent().build();
    }
}
