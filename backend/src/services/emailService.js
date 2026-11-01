
const sendInvitationEmail = async ({
    to,
    workspaceName,
    inviterName
}) => {
    try {
        const frontendUrl =
            process.env.FRONTEND_URL ||
            "http://localhost:5173";

        const response = await fetch(
            "https://api.brevo.com/v3/smtp/email",
            {
                method: "POST",
                headers: {
                    "accept": "application/json",
                    "api-key": process.env.BREVO_API_KEY,
                    "content-type": "application/json"
                },
                body: JSON.stringify({
                    sender: {
                        name: "ProjectFlow",
                        email: process.env.BREVO_SENDER_EMAIL
                    },
                    to: [
                        {
                            email: to
                        }
                    ],
                    subject: `You've been invited to ${workspaceName} on ProjectFlow`,
                    textContent: `
Hi,

${inviterName} has invited you to join the "${workspaceName}" workspace on ProjectFlow.

Login to your ProjectFlow account and open the Workspaces page to accept or reject this invitation.

Visit: ${frontendUrl}/workspaces

This invitation expires in 7 days.

Regards,
ProjectFlow Team
                    `
                })
            }
        );

        const result = await response.json();

        if (!response.ok) {
            console.error("Brevo Email Error:", result);
            throw new Error(
                result.message || "Failed to send invitation email"
            );
        }

        console.log("Invitation email sent successfully:", result.messageId);

        return result;

    } catch (error) {
        console.error("Email Service Error:", error.message);
        throw error;
    }
};

module.exports = { sendInvitationEmail };
