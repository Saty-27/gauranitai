import fs from "fs";
import path from "path";

interface MailOptions {
  to: string;
  subject: string;
  body: string;
}

export async function sendEmail({ to, subject, body }: MailOptions): Promise<void> {
  console.log(`✉️ [MOCK EMAIL SENT]`);
  console.log(`To: ${to}`);
  console.log(`Subject: ${subject}`);
  console.log(`Body:\n${body}`);
  console.log(`-----------------------------------`);

  try {
    // Log to a file in the project directory for verification
    const logFilePath = path.join(process.cwd(), "email_logs.json");
    let logs: any[] = [];
    if (fs.existsSync(logFilePath)) {
      try {
        const fileContent = fs.readFileSync(logFilePath, "utf-8");
        logs = JSON.parse(fileContent);
      } catch (e) {
        logs = [];
      }
    }
    logs.push({
      to,
      subject,
      body,
      timestamp: new Date().toISOString(),
    });
    fs.writeFileSync(logFilePath, JSON.stringify(logs, null, 2), "utf-8");
    console.log(`Saved email log entry to email_logs.json`);
  } catch (error) {
    console.error("Failed to write to email_logs.json:", error);
  }
}
