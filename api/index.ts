import express from "express";
import { google } from "googleapis";
import dotenv from "dotenv";
import nodemailer from "nodemailer";

dotenv.config();

const app = express();
app.use(express.json());

// Google Sheets Sync API
app.post("/api/sync-to-sheets", async (req, res) => {
  const { name, email, service, message } = req.body;

  const authEmail = process.env.GOOGLE_SERVICE_ACCOUNT_EMAIL;
  let authKey = process.env.GOOGLE_PRIVATE_KEY;
  const spreadsheetId = process.env.GOOGLE_SPREADSHEET_ID;

  if (authKey) {
    const originalLength = authKey.length;
    console.log(`[DEBUG] Raw Key Start: ${authKey.substring(0, 50)}`);
    
    // 1. Remove any surrounding quotes and whitespace
    authKey = authKey.trim().replace(/^["']|["']$/g, "");
    
    // 2. Unescape newlines (handles \n, \\n, and actual newlines)
    authKey = authKey.replace(/\\n/g, "\n").replace(/\\\\n/g, "\n");
    
    // 3. Robust PEM Normalization
    // Find the actual start and end of the key content
    const match = authKey.match(/-----BEGIN (.*)-----([\s\S]*)-----END (.*)-----/);
    
    if (match) {
      const keyType = match[1]; // e.g., "PRIVATE KEY" or "RSA PRIVATE KEY"
      const base64Content = match[2].replace(/\s/g, ""); // Remove all whitespace
      
      // Reconstruct with standard 64-character line breaks
      const lines = base64Content.match(/.{1,64}/g) || [];
      authKey = `-----BEGIN ${keyType}-----\n${lines.join("\n")}\n-----END ${keyType}-----`;
    } else {
      // If no headers found, check if it's just the base64 part
      const cleaned = authKey.replace(/\s/g, "");
      if (cleaned.length > 500) { // Likely a key
        const lines = cleaned.match(/.{1,64}/g) || [];
        authKey = `-----BEGIN PRIVATE KEY-----\n${lines.join("\n")}\n-----END PRIVATE KEY-----`;
      }
    }
  }

  if (!authEmail || !authKey || !spreadsheetId) {
    console.error("Missing Google Sheets configuration");
    return res.status(500).json({ error: "Google Sheets not configured" });
  }

  let auth;
  try {
    auth = new google.auth.JWT({
      email: authEmail,
      key: authKey,
      scopes: ["https://www.googleapis.com/auth/spreadsheets"]
    });
  } catch (jwtError) {
    console.error("JWT Initialization Error:", jwtError);
    return res.status(500).json({ error: "Failed to initialize Google Auth" });
  }

  try {
    const sheets = google.sheets({ version: "v4", auth });
    
    await sheets.spreadsheets.values.append({
      spreadsheetId,
      range: "Sheet1!A:E",
      valueInputOption: "USER_ENTERED",
      requestBody: {
        values: [
          [
            new Date().toISOString(),
            name,
            email,
            service,
            message
          ]
        ]
      }
    });

    res.json({ success: true });
  } catch (error) {
    console.error("Error syncing to Google Sheets:", error);
    res.status(500).json({ error: "Failed to sync to Google Sheets" });
  }
});

// Email Notification API
app.post("/api/send-email-notification", async (req, res) => {
  const { name, email, service, message } = req.body;

  const smtpHost = process.env.SMTP_HOST;
  const smtpPort = process.env.SMTP_PORT;
  const smtpUser = process.env.SMTP_USER;
  const smtpPass = process.env.SMTP_PASS;
  const adminEmail = process.env.VITE_ADMIN_EMAIL || "lumaphotographstudio@gmail.com";

  console.log(`[Email Debug] Attempting to send email to ${adminEmail}`);

  if (!smtpHost || !smtpPort || !smtpUser || !smtpPass) {
    const missing = [];
    if (!smtpHost) missing.push("SMTP_HOST");
    if (!smtpPort) missing.push("SMTP_PORT");
    if (!smtpUser) missing.push("SMTP_USER");
    if (!smtpPass) missing.push("SMTP_PASS");
    
    console.error(`Missing SMTP configuration: ${missing.join(", ")}`);
    return res.status(500).json({ error: `Missing configuration: ${missing.join(", ")}` });
  }

  // Use 'service: gmail' if host is gmail, otherwise use host/port
  const transportConfig: any = smtpHost.includes("gmail.com") 
    ? {
        service: 'gmail',
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      }
    : {
        host: smtpHost,
        port: parseInt(smtpPort),
        secure: smtpPort === "465",
        auth: {
          user: smtpUser,
          pass: smtpPass,
        },
      };

  const transporter = nodemailer.createTransport(transportConfig);

  const mailOptions = {
    from: `"Luma Photography" <${smtpUser}>`,
    to: adminEmail,
    subject: `New Inquiry from ${name}`,
    text: `
      New Inquiry Received:
      
      Name: ${name}
      Email: ${email}
      Service: ${service}
      Message: ${message}
      
      Date: ${new Date().toLocaleString()}
    `,
    html: `
      <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
        <h2 style="color: #333; border-bottom: 2px solid #eee; padding-bottom: 10px;">New Inquiry Received</h2>
        <p><strong>Name:</strong> ${name}</p>
        <p><strong>Email:</strong> ${email}</p>
        <p><strong>Service:</strong> ${service}</p>
        <div style="background: #f9f9f9; padding: 15px; border-radius: 5px; margin-top: 10px;">
          <strong>Message:</strong><br/>
          ${message.replace(/\n/g, '<br/>')}
        </div>
        <p style="color: #888; font-size: 12px; margin-top: 20px;">Submitted on: ${new Date().toLocaleString()}</p>
      </div>
    `,
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log("[Email Debug] Email sent successfully:", info.messageId);
    res.json({ success: true });
  } catch (error) {
    console.error("[Email Debug] Error sending email notification:", error);
    res.status(500).json({ error: error instanceof Error ? error.message : "Failed to send email notification" });
  }
});

export default app;
