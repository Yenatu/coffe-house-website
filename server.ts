import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import nodemailer from "nodemailer";

async function startServer() {
  const app = express();
  const PORT = 3000;

  // Middleware
  app.use(express.json());

  // API endpoint to send order notification emails
  app.post("/api/send-order-email", async (req, res) => {
    try {
      const { order } = req.body;
      if (!order) {
        return res.status(400).json({ error: "Missing order details" });
      }

      const emailRecipient = "ayeneaddisie19@gmail.com";
      const subject = `☕ New Order Received: ${order.pickupCode} (${order.shopName})`;

      // Generate HTML email content
      const itemsListHtml = order.items.map((item: any) => {
        const custDetails = item.customization
          ? [
              item.customization.size && item.customization.size !== 'None' ? `Size: ${item.customization.size}` : null,
              item.customization.milk && item.customization.milk !== 'None' && item.customization.milk !== 'No Milk' ? `Milk: ${item.customization.milk}` : null,
              item.customization.sweetener && item.customization.sweetener !== 'None' ? `${item.customization.sweetener} (${item.customization.sweetenerPumps} Pumps)` : null,
              item.customization.shots > 0 ? `${item.customization.shots} Shots` : null,
              item.customization.specialInstructions ? `<i>"${item.customization.specialInstructions}"</i>` : null,
            ].filter(Boolean).join(" • ")
          : "";

        return `
          <div style="border-bottom: 1px solid #f0eded; padding: 10px 0;">
            <div style="display: flex; justify-content: space-between; font-weight: bold; font-size: 14px; color: #1c1917;">
              <span>x${item.quantity} ${item.menuItem.name}</span>
              <span>$${item.totalPrice.toFixed(2)}</span>
            </div>
            ${custDetails ? `<p style="font-size: 12px; color: #78716c; margin: 4px 0 0 0;">${custDetails}</p>` : ""}
          </div>
        `;
      }).join("");

      const emailHtml = `
        <div style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 24px; border: 1px solid #e7e5e4; border-radius: 16px; background-color: #fafaf9; color: #1c1917;">
          <div style="text-align: center; margin-bottom: 24px; border-bottom: 2px solid #78350f; padding-bottom: 16px;">
            <p style="text-transform: uppercase; font-size: 11px; letter-spacing: 0.1em; color: #b45309; font-weight: bold; margin: 0 0 4px 0;">New Incoming Order</p>
            <h1 style="font-family: serif; font-size: 24px; color: #451a03; margin: 0; font-weight: 900;">SUPER DOUBLE A</h1>
          </div>

          <div style="background-color: #fef3c7; border: 1px dashed #d97706; border-radius: 12px; padding: 16px; margin-bottom: 24px; text-align: center;">
            <p style="font-size: 11px; text-transform: uppercase; color: #b45309; font-weight: bold; margin: 0 0 4px 0;">Counter Pickup Passcode</p>
            <span style="font-family: monospace; font-size: 28px; font-weight: 900; color: #78350f; letter-spacing: 2px;">${order.pickupCode}</span>
            <p style="font-size: 13px; color: #78350f; font-weight: bold; margin: 8px 0 0 0;">Pickup Time: ${order.pickupTime}</p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #78716c; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin-top: 0;">Order Details</h3>
            <p style="font-size: 13px; margin: 6px 0;"><strong>Shop:</strong> ${order.shopName}</p>
            <p style="font-size: 13px; margin: 6px 0;"><strong>Address:</strong> ${order.shopAddress}</p>
            <p style="font-size: 13px; margin: 6px 0;"><strong>Date/Time:</strong> ${new Date(order.orderDate).toLocaleString()}</p>
            <p style="font-size: 13px; margin: 6px 0;"><strong>Order ID:</strong> <code style="font-size: 11px; background: #e7e5e4; padding: 2px 4px; border-radius: 4px;">${order.id}</code></p>
          </div>

          <div style="margin-bottom: 24px;">
            <h3 style="font-size: 14px; text-transform: uppercase; color: #78716c; border-bottom: 1px solid #e7e5e4; padding-bottom: 8px; margin-top: 0;">Items Ordered</h3>
            ${itemsListHtml}
          </div>

          <div style="background-color: #f5f5f4; border-radius: 12px; padding: 16px; margin-bottom: 24px;">
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #44403c; margin-bottom: 6px;">
              <span>Subtotal</span>
              <span>$${order.subtotal.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #44403c; margin-bottom: 6px;">
              <span>Tax</span>
              <span>$${order.tax.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 13px; color: #44403c; margin-bottom: 6px;">
              <span>Tip</span>
              <span>$${order.tip.toFixed(2)}</span>
            </div>
            <div style="display: flex; justify-content: space-between; font-size: 15px; font-weight: bold; color: #1c1917; border-top: 1px solid #e7e5e4; padding-top: 8px; margin-top: 8px;">
              <span>Total Revenue</span>
              <span>$${order.total.toFixed(2)}</span>
            </div>
          </div>

          <div style="text-align: center; font-size: 11px; color: #a8a29e; border-top: 1px solid #e7e5e4; padding-top: 16px;">
            <p style="margin: 0 0 4px 0;">Sent to Cafe Owner / Barista Live Dispatch</p>
            <p style="margin: 0;">SUPER DOUBLE A • Order Ahead Service Sandbox</p>
          </div>
        </div>
      `;

      let sentMethod = null;

      // 1. Try Resend if configured
      if (process.env.RESEND_API_KEY) {
        try {
          const resendResponse = await fetch("https://api.resend.com/emails", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
            },
            body: JSON.stringify({
              from: "SUPER DOUBLE A <onboarding@resend.dev>",
              to: [emailRecipient],
              subject: subject,
              html: emailHtml,
            }),
          });
          if (resendResponse.ok) {
            sentMethod = "resend";
          } else {
            console.warn("Resend API responded with error:", await resendResponse.text());
          }
        } catch (resendErr) {
          console.error("Resend API failed:", resendErr);
        }
      }

      // 2. Try SMTP if configured (and Resend was not used/failed)
      if (!sentMethod && process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
        try {
          const transporter = nodemailer.createTransport({
            host: process.env.SMTP_HOST,
            port: Number(process.env.SMTP_PORT) || 587,
            secure: Number(process.env.SMTP_PORT) === 465,
            auth: {
              user: process.env.SMTP_USER,
              pass: process.env.SMTP_PASS,
            },
          });

          await transporter.sendMail({
            from: `"SUPER DOUBLE A" <${process.env.SMTP_USER}>`,
            to: emailRecipient,
            subject: subject,
            html: emailHtml,
          });

          sentMethod = "smtp";
        } catch (smtpErr) {
          console.error("SMTP delivery failed:", smtpErr);
        }
      }

      // 3. Fallback to server logs so that the local/preview environment still succeeds gracefully
      if (!sentMethod) {
        console.log(`\n========================================`);
        console.log(`✉️ EMAIL NOTIFICATION [SIMULATED]`);
        console.log(`To: ${emailRecipient}`);
        console.log(`Subject: ${subject}`);
        console.log(`----------------------------------------`);
        console.log(`Order ID: ${order.id}`);
        console.log(`Pickup Code: ${order.pickupCode}`);
        console.log(`Total: $${order.total.toFixed(2)}`);
        console.log(`Configure 'RESEND_API_KEY' or SMTP in the Settings Panel or .env file to enable real delivery.`);
        console.log(`========================================\n`);
        sentMethod = "console_log_fallback";
      }

      return res.json({ success: true, method: sentMethod });
    } catch (err: any) {
      console.error("Error sending order email:", err);
      return res.status(500).json({ error: err.message || "Failed to process email delivery" });
    }
  });

  // Vite middleware for development
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Server running on http://localhost:${PORT}`);
  });
}

startServer();
