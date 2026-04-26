import nodemailer from "nodemailer";

export const enviarCorreo = async (filePath: string) => {
  const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
      user: process.env.MAIL_USER,
      pass: process.env.MAIL_PASS,
    },
  });

  await transporter.sendMail({
    from: process.env.MAIL_FROM,
    to: process.env.MAIL_USER, // o el destino que necesites
    subject: "Reporte de Asistencia",
    text: "Adjunto reporte en Excel",
    attachments: [
      {
        filename: "reporte.xlsx",
        path: filePath,
      },
    ],
  });
};