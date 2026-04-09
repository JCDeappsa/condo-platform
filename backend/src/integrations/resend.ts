import { env } from '../config/env';

interface SendEmailParams {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

export async function sendEmail(params: SendEmailParams): Promise<{ success: boolean; id?: string; error?: string }> {
  if (!env.resendApiKey) {
    console.log('[Email] Resend API key no configurada. Email simulado:', params.subject, '->', params.to);
    return { success: true, id: 'simulated' };
  }

  try {
    const res = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${env.resendApiKey}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        from: env.emailFrom,
        to: params.to,
        subject: params.subject,
        html: params.html,
        text: params.text,
      }),
    });

    const data: any = await res.json();

    if (!res.ok) {
      console.error('[Email] Error de Resend:', data);
      return { success: false, error: data.message || 'Error al enviar email' };
    }

    return { success: true, id: data.id };
  } catch (error: any) {
    console.error('[Email] Error:', error.message);
    return { success: false, error: error.message };
  }
}
