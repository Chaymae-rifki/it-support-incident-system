CREATE DATABASE IF NOT EXISTS it_support_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE it_support_db;

CREATE TABLE teams (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(100) NOT NULL,
    description TEXT
);

CREATE TABLE categories (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(80) NOT NULL,
    description TEXT
);

CREATE TABLE users (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    nom VARCHAR(80) NOT NULL,
    prenom VARCHAR(80) NOT NULL,
    email VARCHAR(150) NOT NULL UNIQUE,
    mot_de_passe VARCHAR(255) NOT NULL,
    role ENUM('EMPLOYE', 'TECHNICIEN', 'ADMIN') NOT NULL,
    actif BOOLEAN NOT NULL DEFAULT TRUE,
    team_id BIGINT NULL,
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_user_team FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL
);

CREATE TABLE tickets (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    reference VARCHAR(30) NOT NULL UNIQUE,
    titre VARCHAR(200) NOT NULL,
    description TEXT NOT NULL,
    statut ENUM('OUVERT', 'AFFECTE', 'EN_COURS', 'EN_ATTENTE', 'RESOLU', 'CLOTURE', 'ANNULE') NOT NULL DEFAULT 'OUVERT',
    priorite ENUM('BASSE', 'MOYENNE', 'HAUTE', 'CRITIQUE') NOT NULL,
    category_id BIGINT NOT NULL,
    createur_id BIGINT NOT NULL,
    technicien_id BIGINT NULL,
    team_id BIGINT NULL,
    solution_appliquee TEXT NULL,
    date_creation DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    date_resolution DATETIME NULL,
    date_cloture DATETIME NULL,
    CONSTRAINT fk_ticket_cat FOREIGN KEY (category_id) REFERENCES categories(id),
    CONSTRAINT fk_ticket_createur FOREIGN KEY (createur_id) REFERENCES users(id),
    CONSTRAINT fk_ticket_tech FOREIGN KEY (technicien_id) REFERENCES users(id)
);

CREATE TABLE comments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    auteur_id BIGINT NOT NULL,
    contenu TEXT NOT NULL,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    interne BOOLEAN NOT NULL DEFAULT FALSE,
    CONSTRAINT fk_comment_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_comment_auteur FOREIGN KEY (auteur_id) REFERENCES users(id)
);

CREATE TABLE attachments (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    nom_fichier VARCHAR(255) NOT NULL,
    type VARCHAR(100) NOT NULL,
    chemin VARCHAR(500) NOT NULL,
    CONSTRAINT fk_att_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE
);

CREATE TABLE ticket_history (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    ticket_id BIGINT NOT NULL,
    auteur_id BIGINT NOT NULL,
    action VARCHAR(120) NOT NULL,
    ancien_statut VARCHAR(30),
    nouveau_statut VARCHAR(30),
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_hist_ticket FOREIGN KEY (ticket_id) REFERENCES tickets(id) ON DELETE CASCADE,
    CONSTRAINT fk_hist_auteur FOREIGN KEY (auteur_id) REFERENCES users(id)
);

CREATE TABLE notifications (
    id BIGINT AUTO_INCREMENT PRIMARY KEY,
    user_id BIGINT NOT NULL,
    ticket_id BIGINT NULL,
    message TEXT NOT NULL,
    lue BOOLEAN NOT NULL DEFAULT FALSE,
    date DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_notif_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE
);

INSERT INTO teams (nom, description) VALUES
('Support Poste & Matériel', 'Postes, écrans, imprimantes'),
('Réseau & Infrastructure', 'Wi-Fi, VPN, pare-feu'),
('Applications & Accès', 'ERP, messagerie, droits RBAC');

INSERT INTO categories (nom, description) VALUES
('Matériel', 'Panne physique ou périphérique'),
('Logiciel', 'Application métier ou installation'),
('Réseau', 'Connectivité VPN, Wi-Fi ou LAN'),
('Accès / Compte', 'Authentification et habilitations'),
('Autre', 'Demande diverse');

INSERT INTO users (nom, prenom, email, mot_de_passe, role, team_id) VALUES
('Rifki', 'Chaymae', 'admin@deskflow.ma', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'ADMIN', NULL),
('Oubouni', 'Imane', 'imane.tech@deskflow.ma', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'TECHNICIEN', 3),
('Tazi', 'Salma', 'salma.employe@deskflow.ma', '$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'EMPLOYE', NULL);

ALTER TABLE users MODIFY role ENUM('EMPLOYE','TECHNICIEN','IT_MANAGER','ADMIN') NOT NULL;