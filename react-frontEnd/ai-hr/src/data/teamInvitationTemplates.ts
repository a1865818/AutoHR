import { EmailTemplate } from "@/interfaces";

export const TEAM_INVITATION_TEMPLATES: EmailTemplate[] = [
  {
    id: "default-invitation",
    name: "Standard Team Invitation",
    subject: "You're invited to join {{companyName}} on AutoHR",
    body: `Dear {{inviteeEmail}},

{{inviterName}} has invited you to join {{companyName}} on AutoHR as a {{role}}.

AutoHR is our comprehensive hiring platform that helps us streamline our recruitment process, manage candidates, and make better hiring decisions.

To accept this invitation and join our team, please click the link below:

{{invitationUrl}}

This invitation will expire in 7 days.

If you have any questions, please don't hesitate to reach out to {{inviterName}}.

Best regards,
The {{companyName}} Team

---
This invitation was sent from AutoHR. If you didn't expect this invitation, please ignore this email.`,
    isDefault: true,
    emailType: "TeamInvitation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  },
  
  {
    id: "executive-invitation",
    name: "Executive Invitation",
    subject: "Strategic Invitation: {{companyName}} Leadership Access",
    body: `Dear {{inviteeEmail}},

I am writing to formally invite you to join {{companyName}}'s leadership team on AutoHR as a {{role}}.

As a key member of our organization, you will have access to our comprehensive hiring analytics and strategic recruitment tools through AutoHR. This platform provides critical insights that support our talent acquisition strategy and organizational growth objectives.

To activate your account and access our hiring dashboard, please use the secure invitation link below:

{{invitationUrl}}

This invitation will expire in 7 days.

Please note that this platform contains sensitive organizational data and should be accessed through secure channels only.

If you require any assistance with account setup or have questions about platform access, please contact me directly.

We look forward to your participation in our hiring initiatives.

Sincerely,
{{inviterName}}
{{companyName}}

---
Confidential invitation from AutoHR. Please verify the sender if you have any concerns.`,
    isDefault: false,
    emailType: "TeamInvitation",
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  },
];