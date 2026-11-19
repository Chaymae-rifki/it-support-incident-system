package ma.ensaf.itsupport.config;

import lombok.RequiredArgsConstructor;
import ma.ensaf.itsupport.entity.*;
import ma.ensaf.itsupport.repository.*;
import org.springframework.boot.CommandLineRunner;
import org.springframework.security.crypto.password.PasswordEncoder;
import org.springframework.stereotype.Component;

@Component
@RequiredArgsConstructor
public class DataInitializer implements CommandLineRunner {

    private final UserRepository userRepository;
    private final TeamRepository teamRepository;
    private final CategoryRepository categoryRepository;
    private final PasswordEncoder passwordEncoder;

    @Override
    public void run(String... args) {
        if (userRepository.count() > 0) return;

        Team matTeam = teamRepository.save(Team.builder().nom("Support Poste & Matériel").description("Matériel et périphériques").build());
        Team netTeam = teamRepository.save(Team.builder().nom("Réseau & Infrastructure").description("Wi-Fi, VPN et serveurs").build());
        Team appTeam = teamRepository.save(Team.builder().nom("Applications & Accès").description("ERP, messagerie et comptes").build());

        categoryRepository.save(Category.builder().nom("Matériel").description("PC, écran, imprimante").build());
        categoryRepository.save(Category.builder().nom("Logiciel").description("Logiciels métier").build());
        categoryRepository.save(Category.builder().nom("Réseau").description("Wi-Fi, VPN").build());
        categoryRepository.save(Category.builder().nom("Accès / Compte").description("Droits et mots de passe").build());
        categoryRepository.save(Category.builder().nom("Autre").description("Autre demande").build());

        String pwd = passwordEncoder.encode("Password123!");
        userRepository.save(User.builder().nom("Rifki").prenom("Chaymae").email("admin@deskflow.ma").motDePasse(pwd).role(User.Role.ADMIN).build());
        userRepository.save(User.builder().nom("Oubouni").prenom("Imane").email("imane.tech@deskflow.ma").motDePasse(pwd).role(User.Role.TECHNICIEN).team(appTeam).build());
        userRepository.save(User.builder().nom("Bennani").prenom("Youssef").email("youssef.tech@deskflow.ma").motDePasse(pwd).role(User.Role.TECHNICIEN).team(netTeam).build());
        userRepository.save(User.builder().nom("Alaoui").prenom("Hamza").email("manager@deskflow.ma").motDePasse(pwd).role(User.Role.IT_MANAGER).build());
        userRepository.save(User.builder().nom("El Amrani").prenom("Karim").email("karim.tech@deskflow.ma").motDePasse(pwd).role(User.Role.TECHNICIEN).team(matTeam).build());
        userRepository.save(User.builder().nom("Tazi").prenom("Salma").email("salma.employe@deskflow.ma").motDePasse(pwd).role(User.Role.EMPLOYE).build());
    }
}
