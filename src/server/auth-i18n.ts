import type { TranslationDictionary } from "@better-auth/i18n";

// German translations for better-auth error codes (core + organization plugin).
// Codes not listed here fall back to the original English message.
export const de: TranslationDictionary = {
  // core
  USER_NOT_FOUND: "Benutzer nicht gefunden",
  FAILED_TO_CREATE_USER: "Benutzer konnte nicht erstellt werden",
  FAILED_TO_CREATE_SESSION: "Sitzung konnte nicht erstellt werden",
  FAILED_TO_UPDATE_USER: "Benutzer konnte nicht aktualisiert werden",
  FAILED_TO_GET_SESSION: "Sitzung konnte nicht abgerufen werden",
  INVALID_PASSWORD: "Ungültiges Passwort",
  INVALID_EMAIL: "Ungültige E-Mail-Adresse",
  INVALID_EMAIL_OR_PASSWORD: "Ungültige E-Mail-Adresse oder ungültiges Passwort",
  INVALID_USER: "Ungültiger Benutzer",
  SOCIAL_ACCOUNT_ALREADY_LINKED: "Dieses Konto ist bereits verknüpft",
  PROVIDER_NOT_FOUND: "Anbieter nicht gefunden",
  INVALID_TOKEN: "Ungültiges Token",
  TOKEN_EXPIRED: "Token ist abgelaufen",
  FAILED_TO_GET_USER_INFO: "Benutzerinformationen konnten nicht abgerufen werden",
  USER_EMAIL_NOT_FOUND: "E-Mail-Adresse nicht gefunden",
  EMAIL_NOT_VERIFIED: "E-Mail-Adresse ist nicht bestätigt",
  PASSWORD_TOO_SHORT: "Das Passwort ist zu kurz",
  PASSWORD_TOO_LONG: "Das Passwort ist zu lang",
  USER_ALREADY_EXISTS: "Benutzer existiert bereits",
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    "Benutzer existiert bereits. Bitte eine andere E-Mail-Adresse verwenden",
  EMAIL_CAN_NOT_BE_UPDATED: "E-Mail-Adresse kann nicht geändert werden",
  CHANGE_EMAIL_DISABLED: "Das Ändern der E-Mail-Adresse ist deaktiviert",
  CREDENTIAL_ACCOUNT_NOT_FOUND: "Konto nicht gefunden",
  SESSION_EXPIRED: "Sitzung abgelaufen. Bitte erneut anmelden",
  FAILED_TO_UNLINK_LAST_ACCOUNT: "Das letzte verknüpfte Konto kann nicht entfernt werden",
  ACCOUNT_NOT_FOUND: "Konto nicht gefunden",
  USER_ALREADY_HAS_PASSWORD: "Benutzer hat bereits ein Passwort",
  EMAIL_ALREADY_VERIFIED: "E-Mail-Adresse wurde bereits bestätigt",
  EMAIL_MISMATCH: "E-Mail-Adressen stimmen nicht überein",
  SESSION_NOT_FRESH: "Sitzung ist nicht mehr aktuell. Bitte erneut anmelden",
  LINKED_ACCOUNT_ALREADY_EXISTS: "Verknüpftes Konto existiert bereits",
  VALIDATION_ERROR: "Eingaben sind ungültig",
  MISSING_FIELD: "Pflichtfeld fehlt",
  PASSWORD_ALREADY_SET: "Passwort wurde bereits gesetzt",

  // organization plugin
  YOU_ARE_NOT_ALLOWED_TO_CREATE_A_NEW_ORGANIZATION:
    "Keine Berechtigung, eine neue Organisation zu erstellen",
  YOU_HAVE_REACHED_THE_MAXIMUM_NUMBER_OF_ORGANIZATIONS:
    "Maximale Anzahl an Organisationen erreicht",
  ORGANIZATION_ALREADY_EXISTS: "Organisation existiert bereits",
  ORGANIZATION_SLUG_ALREADY_TAKEN: "Dieser Organisations-Slug ist bereits vergeben",
  ORGANIZATION_NOT_FOUND: "Organisation nicht gefunden",
  USER_IS_NOT_A_MEMBER_OF_THE_ORGANIZATION: "Benutzer ist kein Mitglied dieser Organisation",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_ORGANIZATION:
    "Keine Berechtigung, diese Organisation zu bearbeiten",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_ORGANIZATION:
    "Keine Berechtigung, diese Organisation zu löschen",
  NO_ACTIVE_ORGANIZATION: "Keine aktive Organisation",
  USER_IS_ALREADY_A_MEMBER_OF_THIS_ORGANIZATION:
    "Benutzer ist bereits Mitglied dieser Organisation",
  MEMBER_NOT_FOUND: "Mitglied nicht gefunden",
  ROLE_NOT_FOUND: "Rolle nicht gefunden",
  INVITATION_NOT_FOUND: "Einladung nicht gefunden",
  USER_IS_ALREADY_INVITED_TO_THIS_ORGANIZATION:
    "Benutzer wurde bereits in diese Organisation eingeladen",
  YOU_ARE_NOT_ALLOWED_TO_INVITE_USERS_TO_THIS_ORGANIZATION:
    "Keine Berechtigung, Benutzer in diese Organisation einzuladen",
  YOU_ARE_NOT_THE_RECIPIENT_OF_THE_INVITATION: "Diese Einladung ist an eine andere Person gerichtet",
  YOU_ARE_NOT_ALLOWED_TO_CANCEL_THIS_INVITATION:
    "Keine Berechtigung, diese Einladung zurückzuziehen",
  YOU_ARE_NOT_ALLOWED_TO_DELETE_THIS_MEMBER: "Keine Berechtigung, dieses Mitglied zu entfernen",
  YOU_ARE_NOT_ALLOWED_TO_UPDATE_THIS_MEMBER: "Keine Berechtigung, dieses Mitglied zu bearbeiten",
  YOU_CANNOT_LEAVE_THE_ORGANIZATION_AS_THE_ONLY_OWNER:
    "Die Organisation kann nicht verlassen werden, solange es keinen weiteren Eigentümer gibt",
  ORGANIZATION_MEMBERSHIP_LIMIT_REACHED: "Mitgliederlimit der Organisation erreicht",
  YOU_ARE_NOT_ALLOWED_TO_ACCESS_THIS_ORGANIZATION:
    "Keine Berechtigung für den Zugriff auf diese Organisation",
  YOU_ARE_NOT_A_MEMBER_OF_THIS_ORGANIZATION: "Du bist kein Mitglied dieser Organisation",
};
