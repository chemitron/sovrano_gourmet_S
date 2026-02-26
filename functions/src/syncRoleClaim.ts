import "./firebase";
import { onDocumentWritten } from "firebase-functions/v2/firestore";
import { getAuth } from "firebase-admin/auth";
import * as logger from "firebase-functions/logger";

export const syncRoleClaim = onDocumentWritten("users/{userId}", async (event) => {
  const newData = event.data?.after?.data();
  const newRole = newData?.role;
  const uid = event.params.userId;

  if (!newRole) return;

  await getAuth().setCustomUserClaims(uid, { role: newRole });
  logger.info(`Updated custom claim: role=${newRole} for UID ${uid}`);
});
