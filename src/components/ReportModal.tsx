import { useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { Download, FileText, ShieldCheck, Server, X, Zap } from 'lucide-react';
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import { usd } from './PageUI';
import type { Simulation } from '../context/SimulationContext';

type ReportModalProps = {
  simulation: Simulation;
  regionCode: string;
  simulationDate: string;
  securityScore: number;
  securityLabel: string;
  architectureState: string;
  architectureFlow: string;
  onClose: () => void;
};
type Metric = { label: string; value: string; accent?: boolean };

const safeText = (value: string | number | undefined | null) => String(value ?? '—').trim() || '—';
const navy = '#0b1f3a';
const blue = '#2563eb';
const blue2 = '#1d4ed8';
const lightBlue = '#eff6ff';
const border = '#dbe4f0';
const muted = '#64748b';
const soft = '#f8fafc';
const ink = '#0f172a';

const Label = ({ children }: { children: ReactNode }) => (
  <span style={{ display: 'block', fontSize: 7.5, letterSpacing: 1, fontWeight: 800, color: muted }}>{children}</span>
);
const MetricCard = ({ label, value, accent }: Metric) => (
  <div style={{ padding: '12px 13px', border: `1px solid ${accent ? '#bfdbfe' : border}`, borderRadius: 10, background: accent ? lightBlue : soft }}>
    <Label>{label.toUpperCase()}</Label>
    <b style={{ display: 'block', marginTop: 6, color: accent ? blue2 : ink, fontSize: 15 }}>{value}</b>
  </div>
);
const Section = ({ title, children, marginTop = 14 }: { title: string; children: ReactNode; marginTop?: number }) => (
  <section style={{ marginTop }}>
    <div style={{ display: 'flex', alignItems: 'center', gap: 9, marginBottom: 8 }}>
      <span style={{ fontSize: 7.5, letterSpacing: 1.1, fontWeight: 900, color: blue }}>{title.toUpperCase()}</span>
      <div style={{ flex: 1, height: 1, background: border }} />
    </div>
    {children}
  </section>
);
const InfoRow = ({ label, value }: { label: string; value: string }) => (
  <div style={{ display: 'grid', gridTemplateColumns: '122px 1fr', gap: 10, padding: '7px 0', borderBottom: `1px solid ${border}`, fontSize: 9 }}>
    <span style={{ color: muted }}>{label}</span>
    <b style={{ color: ink, lineHeight: 1.4 }}>{safeText(value)}</b>
  </div>
);
const PageShell = ({ children }: { children: ReactNode }) => (
  <div style={{
    width: 794,
    height: 1123,
    boxSizing: 'border-box',
    margin: '0 auto 20px',
    padding: '30px 38px 42px',
    border: `1px solid ${border}`,
    background: '#fff',
    color: ink,
    boxShadow: '0 18px 45px rgba(15,23,42,.11)',
    overflow: 'hidden',
    position: 'relative',
    fontFamily: 'Inter, Arial, sans-serif',
  }}>
    {children}
  </div>
);
const ReportHeader = ({ section, title, subtitle }: { section: string; title: string; subtitle: string }) => (
  <div style={{ margin: '-30px -38px 18px', background: `linear-gradient(135deg, ${navy} 0%, #173b68 58%, ${blue2} 100%)`, color: '#fff', padding: '22px 38px 21px', position: 'relative' }}>
    <div style={{ position: 'absolute', left: 38, bottom: 0, width: 86, height: 3, background: '#60a5fa', borderRadius: 99 }} />
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 20 }}>
      <div>
        <div style={{ fontSize: 8, letterSpacing: 1.6, fontWeight: 900, color: '#bfdbfe' }}>CLOUDOPS / {section.toUpperCase()}</div>
        <div style={{ fontSize: 21, fontWeight: 850, marginTop: 7, letterSpacing: -.3 }}>{title}</div>
        <div style={{ fontSize: 9.5, marginTop: 5, color: '#dbeafe' }}>{subtitle}</div>
      </div>
      <div style={{ width: 42, height: 42, borderRadius: 12, display: 'grid', placeItems: 'center', background: 'rgba(255,255,255,.12)', border: '1px solid rgba(255,255,255,.18)' }}>
        <Zap size={20} />
      </div>
    </div>
  </div>
);
const Footer = ({ page }: { page: number }) => (
  <div style={{ position: 'absolute', left: 38, right: 38, bottom: 18, display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 14, paddingTop: 8, borderTop: `1px solid ${border}`, fontSize: 7.2, color: '#94a3b8' }}>
    <span>CloudOps Dashboard · Reporte de planificación</span>
    <span>Generado {new Date().getFullYear()} · Página {page} de 3</span>
  </div>
);

export function ReportModal({ simulation, regionCode, simulationDate, securityScore, securityLabel, architectureState, architectureFlow, onClose }: ReportModalProps) {
  const [isDownloading, setIsDownloading] = useState(false);
  const pageRefs = useRef<Array<HTMLDivElement | null>>([]);

  const metrics: Metric[] = [
    { label: 'Costo mensual', value: usd(simulation.monthlyCost), accent: true },
    { label: 'Costo anual', value: usd(simulation.annualCost) },
    { label: 'Usuarios estimados', value: simulation.users.toLocaleString() },
    { label: 'Servicios', value: String(simulation.selectedServices.length) },
  ];
  const distribution = useMemo(() => {
    const items = simulation.costItems.filter((item) => item.monthly > 0);
    const total = items.reduce((sum, item) => sum + item.monthly, 0) || 1;
    return items.map((item) => ({ name: item.service, value: item.monthly, percent: item.monthly / total * 100 }));
  }, [simulation.costItems]);
  const projection = useMemo(() => Array.from({ length: 12 }, (_, i) => ({ month: i + 1, value: simulation.monthlyCost * (i + 1) })), [simulation.monthlyCost]);
  const paidCount = simulation.costItems.filter((item) => item.monthly > 0).length;
  const freeCount = simulation.costItems.filter((item) => item.monthly === 0).length;

  useEffect(() => {
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => { document.body.style.overflow = previous; };
  }, []);

  const downloadPdf = async () => {
    if (isDownloading) return;
    setIsDownloading(true);
    try {
      const pages = pageRefs.current.filter(Boolean) as HTMLDivElement[];
      const doc = new jsPDF({ unit: 'pt', format: 'a4', orientation: 'portrait' });
      const pdfWidth = doc.internal.pageSize.getWidth();
      const pdfHeight = doc.internal.pageSize.getHeight();
      for (let i = 0; i < pages.length; i += 1) {
        const canvas = await html2canvas(pages[i], {
          scale: 2,
          useCORS: true,
          logging: false,
          backgroundColor: '#ffffff',
          width: 794,
          height: 1123,
          windowWidth: 794,
          windowHeight: 1123,
        });
        if (i > 0) doc.addPage();
        doc.addImage(canvas.toDataURL('image/png', 1), 'PNG', 0, 0, pdfWidth, pdfHeight, undefined, 'FAST');
      }
      const filename = `Reporte_CloudOps_${safeText(simulation.name).replace(/[^a-zA-Z0-9áéíóúÁÉÍÓÚñÑ_-]+/g, '_').replace(/^_+|_+$/g, '') || 'simulacion'}.pdf`;
      doc.save(filename);
    } finally { setIsDownloading(false); }
  };

  return (
    <AnimatePresence>
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} onClick={onClose} style={{ position: 'fixed', inset: 0, zIndex: 1400, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: 14, background: 'rgba(2,6,23,.72)', backdropFilter: 'blur(7px)' }}>
        <motion.div initial={{ opacity: 0, y: 18, scale: .985 }} animate={{ opacity: 1, y: 0, scale: 1 }} onClick={(e) => e.stopPropagation()} role="dialog" aria-modal="true" style={{ width: 'min(96vw, 1000px)', maxHeight: '94vh', display: 'flex', flexDirection: 'column', overflow: 'hidden', border: `1px solid var(--border)`, borderRadius: 20, background: 'var(--card)', boxShadow: '0 35px 100px rgba(0,0,0,.34)' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 12, padding: '13px 16px', borderBottom: `1px solid var(--border)`, background: 'var(--card)' }}>
            <div>
              <span className="section-kicker">REPORT PREVIEW</span>
              <h2 style={{ margin: '4px 0 2px', color: 'var(--text)', fontSize: 18 }}>Reporte de planificación</h2>
              <span style={{ color: 'var(--muted)', fontSize: 11 }}>Vista previa del documento final · {simulation.name}</span>
            </div>
            <button type="button" onClick={onClose} aria-label="Cerrar" style={{ width: 34, height: 34, display: 'grid', placeItems: 'center', border: `1px solid var(--border)`, borderRadius: 10, background: 'var(--fill)', color: 'var(--muted)', cursor: 'pointer' }}><X size={16} /></button>
          </div>

          <div style={{ overflow: 'auto', padding: 18, background: 'var(--fill)' }}>
            <div style={{ width: 794, margin: '0 auto' }}>
              <div ref={(node) => { pageRefs.current[0] = node; }}>
                <PageShell>
                  <ReportHeader section="Executive Summary" title="Reporte de planificación" subtitle="Resumen ejecutivo de la simulación activa" />
                  <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between', gap: 20 }}>
                    <div style={{ minWidth: 0 }}>
                      <div style={{ fontSize: 23, fontWeight: 850, letterSpacing: -.4 }}>{simulation.name}</div>
                      <div style={{ marginTop: 5, color: muted, fontSize: 10 }}>{simulation.type} · {simulation.region} · {regionCode}</div>
                    </div>
                    <div style={{ padding: '7px 10px', borderRadius: 8, background: soft, border: `1px solid ${border}`, color: muted, fontSize: 8.5, whiteSpace: 'nowrap' }}>GENERADO · {simulationDate}</div>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 8, marginTop: 14 }}>
                    {metrics.map((metric) => <MetricCard key={metric.label} {...metric} />)}
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '1.08fr .92fr', gap: 12, marginTop: 15 }}>
                    <div style={{ padding: 13, border: `1px solid ${border}`, borderRadius: 10, background: '#fff' }}>
                      <Label>CONFIGURACIÓN DEL ESCENARIO</Label>
                      <div style={{ marginTop: 4 }}>
                        <InfoRow label="Tipo de aplicación" value={simulation.type} />
                        <InfoRow label="Región" value={`${simulation.region} (${regionCode})`} />
                        <InfoRow label="Disponibilidad" value={simulation.availability} />
                        <InfoRow label="Objetivo" value={simulation.objective} />
                        <InfoRow label="Usuarios estimados" value={simulation.users.toLocaleString()} />
                      </div>
                    </div>
                    <div style={{ padding: 13, border: `1px solid ${border}`, borderRadius: 10, background: soft }}>
                      <Label>ESTADO OPERATIVO</Label>
                      <div style={{ display: 'grid', gap: 10, marginTop: 8 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><Server size={18} color={blue} /><div><small style={{ display: 'block', color: muted, fontSize: 8 }}>Arquitectura</small><b style={{ fontSize: 10 }}>{architectureState}</b></div></div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}><ShieldCheck size={18} color={blue} /><div><small style={{ display: 'block', color: muted, fontSize: 8 }}>Seguridad</small><b style={{ fontSize: 10 }}>{securityLabel} · {securityScore}/100</b></div></div>
                        <div style={{ paddingTop: 8, borderTop: `1px solid ${border}`, fontSize: 8.8, color: muted, lineHeight: 1.45 }}>{architectureFlow || 'Sin flujo definido.'}</div>
                      </div>
                    </div>
                  </div>

                  <Section title="Descripción">
                    <div style={{ padding: 12, borderRadius: 9, background: soft, border: `1px solid ${border}`, fontSize: 9.5, lineHeight: 1.55, color: '#475569' }}>{simulation.description || 'Sin descripción registrada.'}</div>
                  </Section>

                  <Section title="Servicios seleccionados" marginTop={13}>
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4,1fr)', gap: 7 }}>
                      {simulation.selectedServices.map((service) => <div key={service} style={{ padding: '8px 9px', border: `1px solid #cfe0ff`, borderRadius: 8, background: lightBlue, display: 'flex', alignItems: 'center', gap: 6, minHeight: 31 }}><FileText size={10} color={blue} /><b style={{ fontSize: 8.5, color: '#1e3a8a' }}>{service}</b></div>)}
                    </div>
                  </Section>
                  <Footer page={1} />
                </PageShell>
              </div>

              <div ref={(node) => { pageRefs.current[1] = node; }}>
                <PageShell>
                  <ReportHeader section="FinOps" title="Análisis financiero" subtitle="Costos, consumo y distribución de la simulación" />
                  <div style={{ display: 'grid', gridTemplateColumns: '1.2fr .8fr 1fr', gap: 9 }}>
                    <div style={{ padding: 14, borderRadius: 10, border: `1px solid #bfdbfe`, background: lightBlue }}><Label>COSTO MENSUAL</Label><div style={{ marginTop: 6, fontSize: 22, fontWeight: 850, color: blue2 }}>{usd(simulation.monthlyCost)}</div><div style={{ marginTop: 4, fontSize: 8.5, color: muted }}>Estimación del escenario activo</div></div>
                    <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${border}`, background: soft }}><Label>COSTO ANUAL</Label><div style={{ marginTop: 6, fontSize: 18, fontWeight: 850 }}>{usd(simulation.annualCost)}</div><div style={{ marginTop: 4, fontSize: 8.5, color: muted }}>Proyección a 12 meses</div></div>
                    <div style={{ padding: 14, borderRadius: 10, border: `1px solid ${border}`, background: soft }}><Label>ESTRUCTURA DE COSTO</Label><div style={{ display: 'flex', gap: 18, marginTop: 8 }}><div><b style={{ fontSize: 17 }}>{paidCount}</b><small style={{ display: 'block', color: muted, fontSize: 8 }}>con costo</small></div><div><b style={{ fontSize: 17 }}>{freeCount}</b><small style={{ display: 'block', color: muted, fontSize: 8 }}>sin costo directo</small></div></div></div>
                  </div>

                  <Section title="Detalle de costos" marginTop={15}>
                    <div style={{ border: `1px solid ${border}`, borderRadius: 10, overflow: 'hidden' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: '1.35fr .88fr .83fr .68fr', padding: '8px 10px', background: '#eef3f8', fontSize: 7.6, fontWeight: 900, color: muted }}><span>SERVICIO</span><span>CONSUMO</span><span>TARIFA</span><span style={{ textAlign: 'right' }}>SUBTOTAL</span></div>
                      {simulation.costItems.map((item) => <div key={item.service} style={{ display: 'grid', gridTemplateColumns: '1.35fr .88fr .83fr .68fr', padding: '8px 10px', borderTop: `1px solid ${border}`, fontSize: 8.3, alignItems: 'center', minHeight: 42 }}><span><b style={{ display: 'block' }}>{item.service}</b><small style={{ color: muted, fontSize: 7.3 }}>{item.detail}</small></span><span style={{ color: muted }}>{item.usage}</span><span style={{ color: muted }}>{item.rate === 0 ? 'Sin costo' : `${usd(item.rate)} ${item.unit}`}</span><strong style={{ textAlign: 'right' }}>{usd(item.monthly)}</strong></div>)}
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '11px 10px', background: lightBlue, borderTop: `1px solid #cfe0ff` }}><b style={{ fontSize: 9 }}>TOTAL ESTIMADO</b><strong style={{ color: blue2, fontSize: 14 }}>{usd(simulation.monthlyCost)} / mes</strong></div>
                    </div>
                  </Section>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 15 }}>
                    <div style={{ padding: 13, border: `1px solid ${border}`, borderRadius: 10, background: '#fff' }}>
                      <Label>DISTRIBUCIÓN DEL COSTO</Label>
                      <div style={{ display: 'grid', gap: 9, marginTop: 11 }}>
                        {distribution.slice(0, 6).map((item) => <div key={item.name}><div style={{ display: 'flex', justifyContent: 'space-between', gap: 8, fontSize: 8.3, marginBottom: 4 }}><b>{item.name}</b><span style={{ color: muted }}>{usd(item.value)} · {item.percent.toFixed(1)}%</span></div><div style={{ height: 8, borderRadius: 99, background: '#e8eef6', overflow: 'hidden' }}><div style={{ width: `${item.percent}%`, height: '100%', background: blue, borderRadius: 99 }} /></div></div>)}
                        {!distribution.length && <span style={{ color: muted, fontSize: 9 }}>Sin servicios con costo directo.</span>}
                      </div>
                    </div>
                    <div style={{ padding: 13, border: `1px solid ${border}`, borderRadius: 10, background: '#fff' }}>
                      <Label>PROYECCIÓN ACUMULADA · 12 MESES</Label>
                      <div style={{ marginTop: 8, height: 190, display: 'flex', alignItems: 'flex-end', gap: 4, padding: '12px 5px 0', borderBottom: `1px solid ${border}` }}>
                        {projection.map((point) => { const h = simulation.annualCost > 0 ? Math.max(8, point.value / simulation.annualCost * 155) : 8; return <div key={point.month} style={{ flex: 1, height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'flex-end', alignItems: 'center', gap: 4 }}><div title={usd(point.value)} style={{ width: '100%', height: h, background: point.month === 12 ? blue2 : '#60a5fa', borderRadius: '4px 4px 1px 1px' }} /><small style={{ fontSize: 6.8, color: muted }}>M{point.month}</small></div>; })}
                      </div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 9, fontSize: 8.5, color: muted }}><span>Mensual: {usd(simulation.monthlyCost)}</span><b style={{ color: ink }}>12 meses: {usd(simulation.annualCost)}</b></div>
                    </div>
                  </div>

                  <div style={{ marginTop: 15, padding: '10px 12px', borderRadius: 9, background: soft, border: `1px solid ${border}`, display: 'flex', justifyContent: 'space-between', gap: 12, fontSize: 8.5 }}><span style={{ color: muted }}>Referencia financiera</span><b style={{ color: ink }}>Modelo simulado del proyecto · no es una cotización oficial de AWS.</b></div>
                  <Footer page={2} />
                </PageShell>
              </div>

              <div ref={(node) => { pageRefs.current[2] = node; }}>
                <PageShell>
                  <ReportHeader section="Architecture & Security" title="Arquitectura y control" subtitle="Vista técnica resumida de la planificación" />

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                    <div style={{ padding: 14, border: `1px solid ${border}`, borderRadius: 10, background: soft }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><Server size={18} color={blue} /><div><Label>ARQUITECTURA</Label><b style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{architectureState}</b></div></div>
                      <div style={{ marginTop: 12, padding: '10px 11px', borderRadius: 8, background: '#fff', border: `1px solid ${border}`, fontSize: 9, lineHeight: 1.55, color: '#475569' }}>{architectureFlow || 'Sin flujo definido.'}</div>
                    </div>
                    <div style={{ padding: 14, border: `1px solid ${border}`, borderRadius: 10, background: soft }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}><ShieldCheck size={18} color={blue} /><div><Label>SEGURIDAD</Label><b style={{ display: 'block', marginTop: 4, fontSize: 12 }}>{securityLabel}</b></div></div>
                      <div style={{ display: 'flex', alignItems: 'end', gap: 9, marginTop: 12 }}><b style={{ fontSize: 28, color: blue2 }}>{securityScore}</b><span style={{ color: muted, fontSize: 8.5, marginBottom: 4 }}>/ 100 · evaluación simulada</span></div>
                      <div style={{ height: 7, marginTop: 8, background: '#e8eef6', borderRadius: 99, overflow: 'hidden' }}><div style={{ width: `${Math.max(0, Math.min(100, securityScore))}%`, height: '100%', background: blue, borderRadius: 99 }} /></div>
                    </div>
                  </div>

                  <Section title="Flujo de arquitectura" marginTop={17}>
                    <div style={{ padding: 13, border: `1px solid ${border}`, borderRadius: 10, background: '#fff' }}>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5,1fr)', gap: 7, alignItems: 'center' }}>
                        {['Entrada', 'DNS', 'Distribución', 'Aplicación', 'Datos'].map((step, index) => <div key={step} style={{ position: 'relative', padding: '12px 8px', textAlign: 'center', borderRadius: 9, background: index === 3 ? lightBlue : soft, border: `1px solid ${index === 3 ? '#bfdbfe' : border}` }}><div style={{ fontSize: 8, color: muted }}>ETAPA {index + 1}</div><b style={{ display: 'block', marginTop: 4, fontSize: 9 }}>{step}</b>{index < 4 && <span style={{ position: 'absolute', right: -9, top: '50%', transform: 'translateY(-50%)', color: '#94a3b8', fontWeight: 900 }}>›</span>}</div>)}
                      </div>
                      <div style={{ marginTop: 11, padding: '9px 11px', borderRadius: 8, background: navy, color: '#dbeafe', fontSize: 8.7, lineHeight: 1.5 }}>{architectureFlow || 'Flujo no definido en la simulación.'}</div>
                    </div>
                  </Section>

                  <Section title="Matriz de servicios" marginTop={17}>
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8 }}>
                      {simulation.selectedServices.map((service) => {
                        const item = simulation.costItems.find((cost) => cost.service === service);
                        return <div key={service} style={{ padding: 10, border: `1px solid ${border}`, borderRadius: 9, background: soft, display: 'grid', gridTemplateColumns: '1fr auto', gap: 10, alignItems: 'center' }}><div><b style={{ fontSize: 9.3 }}>{service}</b><small style={{ display: 'block', marginTop: 3, color: muted, fontSize: 7.5 }}>{item?.detail || 'Servicio seleccionado'}</small></div><div style={{ textAlign: 'right' }}><b style={{ fontSize: 9 }}>{item && item.monthly > 0 ? usd(item.monthly) : 'Sin costo'}</b><small style={{ display: 'block', color: muted, fontSize: 7 }}>mensual</small></div></div>;
                      })}
                    </div>
                  </Section>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12, marginTop: 16 }}>
                    <div style={{ padding: 13, borderRadius: 10, background: lightBlue, border: `1px solid #bfdbfe` }}><Label>OBJETIVO DEL ESCENARIO</Label><div style={{ marginTop: 7, fontSize: 10, fontWeight: 750, lineHeight: 1.45 }}>{simulation.objective}</div></div>
                    <div style={{ padding: 13, borderRadius: 10, background: soft, border: `1px solid ${border}` }}><Label>DISPONIBILIDAD</Label><div style={{ marginTop: 7, fontSize: 10, fontWeight: 750 }}>{simulation.availability}</div><div style={{ marginTop: 4, color: muted, fontSize: 8.2 }}>{simulation.users.toLocaleString()} usuarios estimados</div></div>
                  </div>

                  <Section title="Nota final" marginTop={16}>
                    <div style={{ padding: 12, border: `1px solid ${border}`, borderRadius: 9, background: soft, fontSize: 9, lineHeight: 1.55, color: '#475569' }}>Este reporte resume la planificación, el costo estimado y los componentes técnicos de la simulación activa. Los valores corresponden al modelo interno del proyecto y están destinados a fines académicos y demostrativos.</div>
                  </Section>
                  <Footer page={3} />
                </PageShell>
              </div>
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, padding: '12px 16px', borderTop: `1px solid var(--border)`, background: 'var(--card)' }}>
            <button type="button" onClick={onClose} style={{ minHeight: 38, padding: '0 14px', border: `1px solid var(--border)`, borderRadius: 8, background: 'var(--fill)', color: 'var(--text)', cursor: 'pointer' }}>Cerrar</button>
            <button type="button" className="primary-button" onClick={downloadPdf} disabled={isDownloading} style={{ minHeight: 38, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: 7, opacity: isDownloading ? .7 : 1 }}><Download size={15} />{isDownloading ? 'Generando PDF…' : 'Descargar PDF'}</button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
export default ReportModal;
