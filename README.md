# DeskFlow IT — Système de Gestion des Incidents Informatiques

Application métier réalisée dans le cadre du module **Spring Boot et Angular** — Filière **Génie Logiciel et Intelligence Artificielle (ILIA 2)**, **ENSA Fès** (2026 / 2027).

**Auteures :**
- **Chaymae RIFKI** — [github.com/Chaymae-rifki](https://github.com/Chaymae-rifki)
- **Imane OUBOUNI** — [github.com/imaneoubouni](https://github.com/imaneoubouni)

---

## Architecture Technique

1. **Backend (`spring-boot-backend/`)**
   - Java 17, Spring Boot 3, Spring Web (REST API), Spring Data JPA / Hibernate
   - Spring Security + JWT (stateless) + BCrypt password hashing
   - Validation (`spring-boot-starter-validation`) & gestion globale des exceptions (`@RestControllerAdvice`)
   - Documentation OpenAPI / Swagger UI (`/swagger-ui.html`)

2. **Frontend (`angular-frontend/`)**
   - Angular 18 (Standalone Components), TypeScript
   - Reactive Forms, HttpClient + `JwtInterceptor`
   - Route Guards (`authGuard`, `roleGuard`) selon les rôles `EMPLOYE`, `TECHNICIEN`, `ADMIN`
   - Chart.js pour les graphiques du tableau de bord

3. **Base de données (`database/schema_and_seed.sql`)**
   - Modèle relationnel MySQL (`users`, `teams`, `categories`, `tickets`, `comments`, `attachments`, `ticket_history`, `notifications`)

4. **Tests API (`postman/IT_Support_API.postman_collection.json`)**
   - Collection Postman prête à l'importation pour tester l'authentification JWT et les endpoints métier.

---

## Démarrage Rapide

### 1. Base de données MySQL
Exécutez le script `database/schema_and_seed.sql` sur votre instance MySQL locale (`localhost:3306`).

### 2. Lancer le Backend Spring Boot
```bash
cd spring-boot-backend
mvn spring-boot:run
```
L'API REST démarre sur `http://localhost:8080`.

### 3. Lancer le Frontend Angular
```bash
cd angular-frontend
npm install
ng serve
```
Ouvrez votre navigateur sur `http://localhost:4200`.

---

## Comptes de démonstration (`Password123!`)
| Rôle | E-mail |
|------|--------|
| `ADMIN` | `admin@deskflow.ma` |
| `TECHNICIEN` | `imane.tech@deskflow.ma` |
| `EMPLOYE` | `salma.employe@deskflow.ma` |
