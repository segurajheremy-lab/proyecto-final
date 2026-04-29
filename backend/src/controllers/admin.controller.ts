import { Request, Response } from 'express';
import { User } from '../models/User.model';
import { Attendance } from '../models/Attendance.model';
import { getFechaHoy } from '../utils/dates';

export const getDailySummary = async (req: Request, res: Response): Promise<void> => {
  try {
    const fecha = getFechaHoy();

    // Trabajadores activos
    const totalTrabajadores = await User.countDocuments({ role: 'worker', activo: true });

    // Asistencias de hoy
    const asistenciasHoy = await Attendance.find({ fecha }).populate('userId', 'nombre');

    let presentes = 0;
    let faltas = 0;
    let tardanzas = 0;

    for (const record of asistenciasHoy) {
      if (['jornada_activa', 'en_refrigerio', 'post_refrigerio', 'finalizado'].includes(record.status)) {
        presentes++;
        if (record.tardanza) {
          tardanzas++;
        }
      } else if (record.status === 'falta' || record.status === 'falta_justificada') {
        faltas++;
      }
    }

    const sinMarcar = Math.max(0, totalTrabajadores - presentes - faltas);

    res.json({
      fecha,
      totalTrabajadores,
      presentes,
      faltas,
      tardanzas,
      sinMarcar,
      asistencias: asistenciasHoy // para mostrar la tabla detallada
    });
  } catch (error) {
    console.error('[AdminController] getDailySummary error:', error);
    res.status(500).json({ message: 'Error interno del servidor' });
  }
};
