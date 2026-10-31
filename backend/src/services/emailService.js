const nodemailer = require("nodemailer");

const sendInvitationEmail = async ({ to, workspaceName, inviterName }) => {
    const transporter = nodemailer.createTransport({
        host: process.env.SMTP_HOST,
        port: Number(process.env.SMTP_PORT || 465),
        secure: process.env.SMTP_SECURE === "true",
        auth: {
            user: process.env.SMTP_USER,
            pass: process.env.SMTP_PASS
        }
    });

    const frontendUrl = process.env.FRONTEND_URL || "http://localhost:5173";

    await transporter.sendMail({
        from: `"ProjectFlow" <${process.env.SMTP_USER}>`,
        to,
        subject: `You've been invited to ${workspaceName} on ProjectFlow`,
        text: `
Hi,

${inviterName} has invited you to join the "${workspaceName}" workspace on ProjectFlow.

Log in to your ProjectFlow account and open the Workspaces page to accept or reject this invitation.

${frontendUrl}/workspaces

This invitation expires in 7 days.

Regards,
ProjectFlow Team
        `
    });
};

module.exports = { sendInvitationEmail };