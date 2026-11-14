package ma.ensaf.itsupport.dto;

import java.util.List;

public record DashboardStatsDto(
    String scope,
    long total,
    long ouverts,
    long enCours,
    long resolus,
    long clotures,
    double tempsMoyenResolutionHeures,
    long tauxResolutionPourcent,
    List<CountItem> parCategorie,
    List<CountItem> parPriorite
) {
    public record CountItem(String label, long count) {}
}
