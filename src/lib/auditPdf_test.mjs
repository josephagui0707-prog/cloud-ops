import { jsPDF } from 'jspdf';
const COLORS = { navy: [18, 39, 65], blue: [34, 99, 177], dark: [33, 49, 70], muted: [89, 109, 130], border: [218, 228, 237], pale: [246, 249, 252], teal: [17, 125, 115], white: [255, 255, 255] };
const color = (pdf, c) => pdf.setTextColor(c[0], c[1], c[2]);
const fill = (pdf, c) => pdf.setFillColor(c[0], c[1], c[2]);
const stroke = (pdf, c) => pdf.setDrawColor(c[0], c[1], c[2]);
const safe = (value) => String(value ?? '')
    .replace(/[\u200B-\u200D\uFEFF]/g, '')
    .replace(/[\u2018\u2019]/g, "'").replace(/[\u201C\u201D]/g, '"')
    .replace(/[\u2013\u2014]/g, '-').replace(/\u2022/g, '-')
    .replace(/[\u2190-\u21FF\u2500-\u27FF]/g, '-')
    .replace(/[^\u000A\u000D\u0020-\u00FF]/g, '?');
const flat = (text) => safe(text).replace(/\r/g, '').replace(/\*\*|__|`/g, '').replace(/\[([^\]]+)\]\([^)]*\)/g, '$1').replace(/^#{1,6}\s*/gm, '').trim();
export function createAuditPdf(a, report, filename) {
    const pdf = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4', compress: true });
    const W = 210, H = 297, M = 18, WIDTH = W - 2 * M, TOP = 25, BOTTOM = 274;
    let y = TOP;
    const pagenum = () => pdf.getNumberOfPages();
    const page = () => { pdf.addPage(); y = TOP; };
    const ensure = (need) => { if (y + need > BOTTOM)
        page(); };
    const write = (text, opts = {}) => {
        const fs = opts.fontSize ?? 9.5, lh = opts.leading ?? (fs * 0.48 + 1.2), indent = opts.indent ?? 0;
        const normalized = flat(text);
        if (!normalized)
            return;
        pdf.setFont('helvetica', opts.bold ? 'bold' : 'normal');
        pdf.setFontSize(fs);
        color(pdf, opts.ink ?? COLORS.dark);
        const contentWidth = WIDTH - indent;
        const chunks = normalized.split('\n');
        for (const chunk of chunks) {
            if (!chunk.trim()) {
                ensure(4);
                y += 3;
                continue;
            }
            const lines = pdf.splitTextToSize(chunk, contentWidth);
            for (const line of lines) {
                ensure(lh + 1);
                pdf.text(line, M + indent, y);
                y += lh;
            }
        }
        y += opts.gap ?? 3;
    };
    const title = (text) => {
        ensure(19);
        y += 4;
        fill(pdf, COLORS.blue);
        pdf.roundedRect(M, y - 5, 3, 10, 1, 1, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(14);
        color(pdf, COLORS.navy);
        pdf.text(safe(text), M + 8, y + 2);
        y += 12;
        stroke(pdf, COLORS.border);
        pdf.line(M, y - 4, W - M, y - 4);
    };
    const subsection = (text) => { ensure(12); y += 2; write(text, { fontSize: 11.2, bold: true, ink: COLORS.navy, gap: 4 }); };
    const kv = (label, value) => {
        if (value === undefined || value === null || String(value).trim() === '')
            return;
        write(`${label}: ${String(value)}`, { fontSize: 9.3, gap: 3 });
    };
    const uniqueList = (items) => items.length ? items.join(', ') : 'No identificado en los archivos examinados';
    const counts = { CRÍTICO: 0, ALTO: 0, MEDIO: 0, BAJO: 0 };
    for (const r of a.risks || [])
        if (r.severity in counts)
            counts[r.severity]++;
    const date = new Date(a.createdAt || Date.now());
    const dateLabel = Number.isNaN(date.getTime()) ? 'Sin fecha' : date.toLocaleDateString('es-PE');
    // Portada breve, primera página con metadatos verificables.
    fill(pdf, COLORS.navy);
    pdf.rect(0, 0, W, 57, 'F');
    fill(pdf, COLORS.teal);
    pdf.rect(0, 54, W, 3, 'F');
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(12);
    color(pdf, COLORS.white);
    pdf.text('CLOUDOPS  /  AUDITORÍA INTELIGENTE', M, 22);
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(23);
    pdf.text('Informe técnico de proyecto', M, 37);
    pdf.setFont('helvetica', 'normal');
    pdf.setFontSize(10);
    pdf.text('Evaluación estática para planificación de despliegue en AWS', M, 47);
    y = 70;
    pdf.setFont('helvetica', 'bold');
    pdf.setFontSize(16);
    color(pdf, COLORS.navy);
    const projectLine = pdf.splitTextToSize(safe(a.general.project || filename), WIDTH).slice(0, 3);
    for (const line of projectLine) {
        ensure(8);
        pdf.text(line, M, y);
        y += 7.7;
    }
    y += 2;
    kv('Archivo evaluado', filename);
    kv('Fecha del análisis', dateLabel);
    kv('Modelo utilizado', a.model);
    kv('Método', 'Análisis estático del contenido del ZIP. No se ejecutó el código.');
    y += 5;
    const boxY = y;
    fill(pdf, COLORS.pale);
    stroke(pdf, COLORS.border);
    pdf.roundedRect(M, boxY, WIDTH, 29, 3, 3, 'FD');
    const stats = [['CRÍTICOS', counts.CRÍTICO], ['ALTOS', counts.ALTO], ['MEDIOS', counts.MEDIO], ['BAJOS', counts.BAJO]];
    stats.forEach(([label, n], i) => {
        const x = M + 9 + i * 44;
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(17);
        color(pdf, i === 0 ? [160, 38, 52] : COLORS.navy);
        pdf.text(String(n), x, boxY + 13);
        pdf.setFontSize(8);
        pdf.setFont('helvetica', 'normal');
        color(pdf, COLORS.muted);
        pdf.text(label, x, boxY + 22);
    });
    y = boxY + 38;
    subsection('Alcance y límites');
    write(`${a.coverage.examined.length} archivos examinados de ${a.coverage.eligible} elegibles; ${a.coverage.blocks} bloques analizados y ${a.coverage.excluded.length} exclusiones documentadas. Los resultados requieren validación humana.`, { fontSize: 9.5 });
    title('01  Resumen ejecutivo');
    write(a.general.summary || 'La IA no proporcionó un resumen ejecutivo verificable.');
    title('02  Perfil técnico del proyecto');
    kv('Lenguajes', uniqueList(a.general.detected.languages));
    kv('Frameworks', uniqueList(a.general.detected.frameworks));
    kv('Dependencias principales', uniqueList(a.general.detected.dependencies));
    kv('Bases de datos', uniqueList(a.general.detected.database));
    kv('Infraestructura identificada', uniqueList(a.general.detected.infrastructure));
    title('03  Hallazgos y riesgos priorizados');
    if (!a.risks.length)
        write('No se identificaron hallazgos confirmados en los archivos examinados. Esto no equivale a ausencia de vulnerabilidades.');
    const ORDER = ['CRÍTICO', 'ALTO', 'MEDIO', 'BAJO'];
    for (const [i, r] of [...a.risks].sort((x, z) => ORDER.indexOf(x.severity) - ORDER.indexOf(z.severity)).entries()) {
        ensure(25);
        const badge = r.severity === 'CRÍTICO' ? [168, 40, 55] : r.severity === 'ALTO' ? [181, 81, 36] : r.severity === 'MEDIO' ? [156, 116, 32] : [31, 111, 93];
        fill(pdf, badge);
        pdf.roundedRect(M, y - 3, 22, 7.5, 1.5, 1.5, 'F');
        pdf.setFont('helvetica', 'bold');
        pdf.setFontSize(7.5);
        color(pdf, COLORS.white);
        pdf.text(safe(r.severity), M + 2, y + 2);
        y += 9;
        write(`${i + 1}. ${r.title}`, { fontSize: 11, bold: true, ink: COLORS.navy, gap: 3 });
        kv('Archivo / ubicación', `${r.file || 'No determinado'}${r.line ? ` (línea ${r.line})` : ''}`);
        kv('Clasificación', r.category);
        kv('Evidencia', r.evidence || 'No verificada');
        kv('Impacto potencial', r.impact);
        kv('Medida recomendada', r.recommendation);
        write(`Confianza: ${r.confidence || 'No indicada'} | Evidencia ${r.verified ? 'cotejada' : 'no cotejada'} con el fragmento proporcionado.`, { fontSize: 8.2, ink: COLORS.muted, gap: 6 });
        ensure(4);
        stroke(pdf, COLORS.border);
        pdf.line(M, y - 2, W - M, y - 2);
    }
    title('04  Seguridad del proyecto');
    write(a.security || 'No se dispone de una evaluación adicional de seguridad.');
    title('05  Arquitectura y servicios AWS');
    write(a.architecture || 'No fue posible determinar una arquitectura recomendada con la evidencia disponible.');
    for (const svc of a.aws) {
        subsection(svc.service);
        write(svc.purpose, { gap: 2 });
        write(`Justificación: ${svc.reason}`, { fontSize: 8.9, ink: COLORS.muted, gap: 4 });
    }
    title('06  Seis pilares AWS Well-Architected');
    for (const pillar of a.pillars) {
        subsection(`${pillar.name} - ${pillar.status}`);
        write(pillar.assessment);
    }
    title('07  Rendimiento y escalabilidad');
    write(a.performance || 'Se requieren mediciones para evaluar el rendimiento real.');
    write('No se ejecutaron pruebas de carga ni mediciones de consumo de CPU, memoria o latencia.', { fontSize: 8.8, ink: COLORS.muted });
    title('08  Costos e impacto económico');
    write(a.costs || 'No se dispone de datos suficientes para una estimación económica.');
    write('Este informe no constituye una cotización AWS. Las tarifas deben verificarse en AWS Pricing Calculator según región y parámetros de uso.', { fontSize: 8.8, ink: COLORS.muted });
    title('09  Plan de mejora priorizado');
    if (!a.improvements.length)
        write('No se generaron acciones de mejora.');
    a.improvements.forEach((v, i) => write(`${i + 1}. ${v}`, { gap: 4 }));
    title('10  Alcance y trazabilidad de archivos');
    write(`ZIP con ${a.coverage.totalEntries} entradas; ${a.coverage.eligible} archivos elegibles; ${a.coverage.examined.length} archivos examinados; ${a.coverage.blocks} bloques.`, { fontSize: 9.5 });
    subsection('Archivos examinados');
    a.coverage.examined.forEach(f => write(`${f.path}${f.partial ? ' (parcial)' : ''}`, { fontSize: 8.2, gap: 2 }));
    subsection('Archivos no examinados');
    if (!a.coverage.excluded.length)
        write('No se registraron exclusiones.');
    a.coverage.excluded.forEach(f => write(`${f.path}: ${f.reason}`, { fontSize: 8.2, gap: 2 }));
    title('11  Limitaciones y notas de auditoría');
    write(a.caveat || 'Los hallazgos son asistidos por IA y requieren verificación profesional antes de cambios en producción.');
    write('El análisis es estático, se basa en fragmentos de archivos seleccionados y no debe interpretarse como una prueba de penetración, certificación de seguridad ni despliegue real en AWS.', { fontSize: 9.1 });
    // Anexo: conservar el texto original de Gemini para fidelidad del reporte sin llamadas adicionales.
    if (report.trim()) {
        title('Anexo  /  Informe original de Gemini');
        for (const paragraph of report.replace(/\r/g, '').split(/\n\s*\n/)) {
            if (!paragraph.trim())
                continue;
            const raw = paragraph.trim();
            write(raw, { fontSize: 8.9, gap: 4 });
        }
    }
    const total = pagenum();
    for (let i = 1; i <= total; i++) {
        pdf.setPage(i);
        stroke(pdf, COLORS.border);
        pdf.line(M, 282, W - M, 282);
        pdf.setFont('helvetica', 'normal');
        pdf.setFontSize(8);
        color(pdf, COLORS.muted);
        pdf.text('CloudOps | Informe de análisis estático asistido por Gemini', M, 287);
        pdf.text(`${i} / ${total}`, W - M, 287, { align: 'right' });
    }
    pdf.setProperties({ title: `Auditoría CloudOps - ${safe(a.general.project)}`, subject: 'Evaluación de riesgos, arquitectura y recomendaciones AWS', author: 'CloudOps', keywords: 'AWS, seguridad, análisis estático, auditoría de proyectos' });
    return pdf;
}
