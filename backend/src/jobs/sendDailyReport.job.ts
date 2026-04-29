import cron from 'node-cron';
import { generarExcel } from '../services/reporte.service';
import { enviarCorreo } from '../services/email.service';

console.log('[jobs] Iniciando job: sendDailyReport');

cron.schedule('0 23 * * *', async () => {
  console.log(`[jobs] sendDailyReport ejecutando a las 23:00`);

  try {
    const filePath = await generarExcel();
    console.log(`[jobs] sendDailyReport: Excel generado en ${filePath}`);

    await enviarCorreo(filePath);
    console.log(`[jobs] sendDailyReport: Correo enviado exitosamente`);
  } catch (err) {
    console.error('[jobs] sendDailyReport error:', err);
  }
});
