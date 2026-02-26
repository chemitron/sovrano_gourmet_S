import "./firebase";
import { onDocumentCreated } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

export const setGuestClaim = onDocumentCreated("users/{userId}", async (event) => {
  const data = event.data?.data();
  if (!data) return;

  const role = data.role;
  const uid = event.params.userId;

  if (role === "guest") {
    await getAuth().setCustomUserClaims(uid, { role: "guest" });
    logger.info(`Assigned guest role claim to UID ${uid}`);
  }
});
