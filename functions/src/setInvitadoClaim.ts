import "./firebase";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

export const setInvitadoClaim = onDocumentCreated("users/{userId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const role = data.role;
  const uid = event.params.userId;

  if (role === "invitado") {
    await getAuth().setCustomUserClaims(uid, { role: "invitado" });
    logger.info(`Assigned invitado role claim to UID ${uid}`);
  }
});
