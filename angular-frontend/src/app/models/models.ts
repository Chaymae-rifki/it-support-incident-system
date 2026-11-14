export type UserRole = 'EMPLOYE' | 'TECHNICIEN' | 'ADMIN';
export type TicketStatus = 'OUVERT' | 'AFFECTE' | 'EN_COURS' | 'EN_ATTENTE' | 'RESOLU' | 'CLOTURE' | 'ANNULE';
export type TicketPriority = 'BASSE' | 'MOYENNE' | 'HAUTE' | 'CRITIQUE';

export interface User {
  id: number;
  nom: string;
  prenom: string;
  email: string;
  role: UserRole;
  actif: boolean;
  teamId?: number | null;
  teamNom?: string | null;
  dateCreation: string;
}

export interface Team {
  id: number;
  nom: string;
  description: string;
}

export interface Category {
  id: number;
  nom: string;
  description: string;
}

export interface Ticket {
  id: number;
  reference: string;
  titre: string;
  description: string;
  statut: TicketStatus;
  priorite: TicketPriority;
  categoryId: number;
  categoryNom: string;
  createurId: number;
  createurNom: string;
  technicienId?: number | null;
  technicienNom?: string | null;
  teamId?: number | null;
  teamNom?: string | null;
  solutionAppliquee?: string | null;
  dateCreation: string;
  dateResolution?: string | null;
  dateCloture?: string | null;
}

export interface Comment {
  id: number;
  auteurId: number;
  auteurNom: string;
  auteurRole: UserRole;
  contenu: string;
  date: string;
  interne: boolean;
}

export interface TicketHistory {
  id: number;
  auteurNom: string;
  action: string;
  ancienStatut?: string | null;
  nouveauStatut?: string | null;
  details: string;
  date: string;
}

export interface TicketDetail {
  ticket: Ticket;
  attachments: Array<{ id: number; nomFichier: string; type: string; taille: number; chemin: string }>;
  comments: Comment[];
  history: TicketHistory[];
}

export interface NotificationItem {
  id: number;
  ticketId?: number | null;
  ticketReference?: string | null;
  message: string;
  lue: boolean;
  date: string;
}

export interface DashboardStats {
  scope: 'GLOBAL' | 'PERSONNEL';
  total: number;
  ouverts: number;
  enCours: number;
  resolus: number;
  clotures: number;
  tempsMoyenResolutionHeures: number;
  tauxResolutionPourcent: number;
  parCategorie: Array<{ label: string; count: number }>;
  parPriorite: Array<{ label: string; count: number }>;
}
