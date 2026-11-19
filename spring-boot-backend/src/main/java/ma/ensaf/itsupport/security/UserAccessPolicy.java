package ma.ensaf.itsupport.security;

import ma.ensaf.itsupport.entity.User;
import org.springframework.security.access.AccessDeniedException;
import org.springframework.stereotype.Component;

@Component
public class UserAccessPolicy {

    /** ADMIN : tout. IT_MANAGER : uniquement EMPLOYE et TECHNICIEN. Les autres : rien. */
    public void checkCanManage(User actor, User.Role cible) {
        switch (actor.getRole()) {
            case ADMIN -> { }
            case IT_MANAGER -> {
                if (cible != User.Role.EMPLOYE && cible != User.Role.TECHNICIEN) deny();
            }
            default -> deny();
        }
    }

    private void deny() {
        throw new AccessDeniedException("Seul un administrateur peut gérer les comptes ADMIN et IT_MANAGER.");
    }
}