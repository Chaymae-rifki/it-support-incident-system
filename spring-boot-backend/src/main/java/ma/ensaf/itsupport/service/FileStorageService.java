package ma.ensaf.itsupport.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.nio.file.Paths;
import java.util.UUID;

@Service
public class FileStorageService {

    @Value("${app.upload.dir}")
    private String uploadDir;

    public String store(MultipartFile file) {
        try {
            Path root = Paths.get(uploadDir).toAbsolutePath().normalize();
            Files.createDirectories(root);
            String filename = UUID.randomUUID() + "_" + file.getOriginalFilename();
            Path target = root.resolve(filename);
            Files.copy(file.getInputStream(), target);
            return "/uploads/" + filename;
        } catch (IOException ex) {
            throw new RuntimeException("Erreur lors de l'enregistrement de la pièce jointe.", ex);
        }
    }
}
