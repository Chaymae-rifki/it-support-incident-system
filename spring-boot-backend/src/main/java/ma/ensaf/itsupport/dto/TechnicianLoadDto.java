
package ma.ensaf.itsupport.dto;

public record TechnicianLoadDto(
        Long technicienId,
        String nom,
        long ticketsActifs,
        long ticketsResolus
) {
}
