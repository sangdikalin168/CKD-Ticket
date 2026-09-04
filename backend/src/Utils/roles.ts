/** Role of the gate kiosk service accounts (CKD-Check-In / CKD-Check-Out).
 *  Created with `npm run kiosk:create-user`, never through the staff UI.
 *  permissions.ts restricts it to the check-in / check-out operations, and
 *  DoorCheckIn.checkinFingerprints narrows its template set by default. */
export const KIOSK_ROLE = "kiosk";
