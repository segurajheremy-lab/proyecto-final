import cron from 'node-cron';
import { generarExcelBuffer } from '../services/reporte.service';
import { enviarCorreo } from '../services/email.service';
import { getFechaHoy } from '../utils/dates';

console.log('[jobs] Iniciando job: sendDailyReport');

cron.schedule('0 23 * * *', async () => {
  console.log(`[jobs] sendDailyReport ejecutando a las 23:00`);

  try {
    const fecha = getFechaHoy();
    const buffer = await generarExcelBuffer(fecha);
    console.log(`[jobs] sendDailyReport: Excel generado para la fecha ${fecha}`);

    // Usaremos MAIL_USER como destino por defecto, o el que esté configurado
    const destinatario = process.env.MAIL_USER as string;
    await enviarCorreo(buffer, destinatario);
    
    console.log(`[jobs] sendDailyReport: Correo enviado exitosamente a ${destinatario}`);
  } catch (err) {
    console.error('[jobs] sendDailyReport error:', err);
  }
});
