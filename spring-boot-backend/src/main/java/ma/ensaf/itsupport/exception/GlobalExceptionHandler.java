package ma.ensaf.itsupport.exception;

import org.springframework.http.HttpStatus;
import org.springframework.http.ResponseEntity;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.security.authentication.BadCredentialsException;
import org.springframework.web.bind.MethodArgumentNotValidException;
import org.springframework.web.bind.annotation.ExceptionHandler;
import org.springframework.web.bind.annotation.RestControllerAdvice;

import java.time.LocalDateTime;
import java.util.Map;

@RestControllerAdvice
public class GlobalExceptionHandler {

    @ExceptionHandler(ResourceNotFoundException.class)
    public ResponseEntity<?> handleNotFound(ResourceNotFoundException ex) {
        return build(HttpStatus.NOT_FOUND, ex.getMessage());
    }

    @ExceptionHandler(org.springframework.security.authentication.DisabledException.class)
    public ResponseEntity<?> handleDisabled(org.springframework.security.authentication.DisabledException ex) {
        return build(HttpStatus.UNAUTHORIZED, "Compte désactivé. Contactez l'administrateur.");
    }

    @ExceptionHandler(org.springframework.dao.DataIntegrityViolationException.class)
    public ResponseEntity<?> handleIntegrity(org.springframework.dao.DataIntegrityViolationException ex) {
        return build(HttpStatus.CONFLICT,
                "Opération impossible : cet élément est référencé ailleurs. Désactivez-le plutôt que de le supprimer.");
    }

    @ExceptionHandler(BusinessException.class)
    public ResponseEntity<?> handleBusiness(BusinessException ex) {
        return build(HttpStatus.BAD_REQUEST, ex.getMessage());
    }

    @ExceptionHandler(AccessDeniedException.class)
    public ResponseEntity<?> handleAccessDenied(AccessDeniedException ex) {
        return build(HttpStatus.FORBIDDEN, "Accès refusé : droits insuffisants.");
    }

    @ExceptionHandler(BadCredentialsException.class)
    public ResponseEntity<?> handleBadCredentials(BadCredentialsException ex) {
        return build(HttpStatus.UNAUTHORIZED, "E-mail ou mot de passe incorrect.");
    }

    @ExceptionHandler(MethodArgumentNotValidException.class)
    public ResponseEntity<?> handleValidation(MethodArgumentNotValidException ex) {
        String msg = ex.getBindingResult().getFieldErrors().stream()
                .map(err -> err.getField() + " : " + err.getDefaultMessage())
                .findFirst()
                .orElse("Données invalides.");
        return build(HttpStatus.BAD_REQUEST, msg);
    }

    private ResponseEntity<Map<String, Object>> build(HttpStatus status, String message) {
        return ResponseEntity.status(status).body(Map.of(
                "timestamp", LocalDateTime.now().toString(),
                "status", status.value(),
                "message", message));
    }
}
