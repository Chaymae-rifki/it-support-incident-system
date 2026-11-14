package ma.ensaf.itsupport.dto;

public record AttachmentDto(
    Long id,
    String nomFichier,
    String type,
    long taille,
    String chemin
) {}
