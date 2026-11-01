const { Resend } = require("resend");

const sendInvitationEmail = async ({
    to,
    workspaceName,
    inviterName
}) => {
    const resend = new Resend(process.env.RESEND_API_KEY);

    const frontendUrl =
        process.env.FRONTEND_URL ||
        "http://localhost:5173";

    const { data, error } = await resend.emails.send({
        from: process.env.EMAIL_FROM,
        to: [to],
        subject: `You've been invited to ${workspaceName} on ProjectFlow`,
        text: `
Hi,

${inviterName} has invited you to join the "${workspaceName}" workspace on ProjectFlow.

Login to your ProjectFlow account and open the Workspaces page to accept or reject this invitation.

${frontendUrl}/workspaces

This invitation expires in 7 days.

Regards,
ProjectFlow Team
        `
    });

    if (error) {
        console.error("Resend email error:", error);
        throw new Error(error.message);
    }

    return data;
};

module.exports = { sendInvitationEmail };
