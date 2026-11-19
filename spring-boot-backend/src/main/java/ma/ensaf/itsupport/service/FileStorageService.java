
package ma.ensaf.itsupport.service;

import org.springframework.beans.factory.annotation.Value;
import org.springframework.core.io.Resource;
import org.springframework.core.io.UrlResource;
import org.springframework.stereotype.Service;
import org.springframework.web.multipart.MultipartFile;

import ma.ensaf.itsupport.exception.BusinessException;
import ma.ensaf.itsupport.exception.ResourceNotFoundException;

import java.io.IOException;
import java.net.MalformedURLException;
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

            String filename = UUID.randomUUID() + "_" + Paths.get(
                    file.getOriginalFilename() != null
                            ? file.getOriginalFilename()
                            : "fichier"
            ).getFileName().toString();

            Path target = root.resolve(filename).normalize();

            Files.copy(file.getInputStream(), target);

            return "/uploads/" + filename;

        } catch (IOException ex) {
            throw new BusinessException(
                    "Erreur lors de l'enregistrement de la pièce jointe.");
        }
    }

    public Resource load(String chemin) {
        try {
            String filename = Paths.get(chemin)
                    .getFileName()
                    .toString();

            Path root = Paths.get(uploadDir)
                    .toAbsolutePath()
                    .normalize();

            Path file = root.resolve(filename).normalize();

            if (!file.startsWith(root)) {
                throw new BusinessException("Chemin de fichier invalide.");
            }

            Resource resource = new UrlResource(file.toUri());

            if (resource.exists() && resource.isReadable()) {
                return resource;
            }

            throw new ResourceNotFoundException("Fichier introuvable.");

        } catch (MalformedURLException e) {
            throw new BusinessException("Impossible de lire le fichier.");
        }
    }
}
