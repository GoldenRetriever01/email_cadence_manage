import { SendEmailInput, SendEmailOutput } from "../shared/types";

export async function sendEmail(input: SendEmailInput): Promise<SendEmailOutput> {
  const { enrollmentId, contactEmail, subject, body } = input;
  const messageId = `msg_${Date.now()}`;

  // Mock email sending - always succeeds
  console.log(`[SEND_EMAIL] Enrollment: ${enrollmentId}`);
  console.log(`[SEND_EMAIL] To: ${contactEmail}`);
  console.log(`[SEND_EMAIL] Subject: ${subject}`);
  console.log(`[SEND_EMAIL] Body: ${body}`);
  console.log(`[SEND_EMAIL] MessageID: ${messageId}`);

  return {
    success: true,
    messageId,
    timestamp: Date.now(),
  };
}
