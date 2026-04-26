import { Router } from "express";
import { enviarReporte } from "../controllers/reporte.controller";

const router = Router();

router.get("/reporte", enviarReporte);

export default router;