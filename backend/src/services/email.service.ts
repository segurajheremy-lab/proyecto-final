import nodemailer from "nodemailer";

export const enviarCorreo = async (
  buffer: Buffer,
  destinatario: string
): Promise<void> => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: destinatario,
    subject: "Reporte de Asistencia",
    text: "Adjunto el reporte de asistencia en Excel.",
    attachments: [
      {
        filename: `reporte-${new Date().toISOString().split("T")[0]}.xlsx`,
        content: buffer,
      },
    ],
  });
};