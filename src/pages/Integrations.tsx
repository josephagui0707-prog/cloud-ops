import { useEffect, useMemo, useState } from 'react';
import { motion } from 'framer-motion';
import {
  Activity,
  AlertTriangle,
  ArrowRightLeft,
  BadgeDollarSign,
  Languages,
  RefreshCcw,
  Search,
  ShieldAlert,
  Sparkles,
  Square,
  Volume2,
} from 'lucide-react';
import { toast } from 'sonner';

import {
  Card,
  Page,
  Title,
  staggerContainer,
  staggerItem,
  usd,
} from '../components/PageUI';
import { useSimulation } from '../context/SimulationContext';

type TranslationResponse = {
  responseData?: {
    translatedText?: string;
  };
  responseStatus?: number;
  responseDetails?: string;
};

type FxResponse = {
  date?: string;
  base?: string;
  quote?: string;
  rate?: number;
};

type NvdDescription = {
  lang: string;
  value: string;
};

type NvdMetric = {
  cvssData?: {
    baseScore?: number;
    baseSeverity?: string;
  };
};

type NvdVulnerability = {
  cve?: {
    id?: string;
    published?: string;
    descriptions?: NvdDescription[];
    metrics?: {
      cvssMetricV40?: NvdMetric[];
      cvssMetricV31?: NvdMetric[];
      cvssMetricV30?: NvdMetric[];
      cvssMetricV2?: NvdMetric[];
    };
  };
};

type NvdResponse = {
  totalResults?: number;
  vulnerabilities?: NvdVulnerability[];
};

type CveItem = {
  id: string;
  description: string;
  published: string;
  score: number | null;
  severity: string;
};

const languages = [
  ['es', 'Español'],
  ['en', 'Inglés'],
  ['pt', 'Portugués'],
  ['fr', 'Francés'],
  ['de', 'Alemán'],
  ['it', 'Italiano'],
] as const;

const speechLocales: Record<string, string> = {
  es: 'es-ES',
  en: 'en-US',
  pt: 'pt-BR',
  fr: 'fr-FR',
  de: 'de-DE',
  it: 'it-IT',
};

const currencies = [
  ['PEN', 'Sol peruano'],
  ['EUR', 'Euro'],
  ['GBP', 'Libra esterlina'],
  ['BRL', 'Real brasileño'],
  ['JPY', 'Yen japonés'],
] as const;


function truncateUtf8(value: string, maxBytes: number) {
  const encoder = new TextEncoder();
  let result = '';

  for (const char of value) {
    const candidate = result + char;
    if (encoder.encode(candidate).length > maxBytes) break;
    result = candidate;
  }

  return result;
}

const money = (value: number, currency: string) =>
  new Intl.NumberFormat('es-PE', {
    style: 'currency',
    currency,
    maximumFractionDigits: currency === 'JPY' ? 0 : 2,
  }).format(value);

function getCvss(cve: NvdVulnerability['cve']) {
  const metrics = cve?.metrics;
  const metric =
    metrics?.cvssMetricV40?.[0] ??
    metrics?.cvssMetricV31?.[0] ??
    metrics?.cvssMetricV30?.[0] ??
    metrics?.cvssMetricV2?.[0];

  const score = metric?.cvssData?.baseScore;
  const severity = metric?.cvssData?.baseSeverity;

  return {
    score: typeof score === 'number' ? score : null,
    severity: severity ?? 'Sin clasificar',
  };
}

export default function Integrations() {
  const { simulation } = useSimulation();

  const architectureText = useMemo(() => {
    if (!simulation) {
      return 'La solución Cloud utiliza servicios de cómputo, almacenamiento, base de datos, red y seguridad para construir una arquitectura escalable.';
    }

    const services = simulation.selectedServices.length
      ? simulation.selectedServices.join(', ')
      : 'servicios por definir';

    return `La simulación ${simulation.name} está desplegada en ${simulation.region}, considera ${simulation.users.toLocaleString()} usuarios y utiliza ${services}. El costo mensual estimado es ${usd(simulation.monthlyCost)}.`;
  }, [simulation]);

  const [sourceLanguage, setSourceLanguage] = useState('es');
  const [targetLanguage, setTargetLanguage] = useState('en');
  const [sourceText, setSourceText] = useState(architectureText);
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);

  const [fxAmount, setFxAmount] = useState(
    simulation?.monthlyCost && simulation.monthlyCost > 0
      ? simulation.monthlyCost
      : 100
  );
  const [fxCurrency, setFxCurrency] = useState('PEN');
  const [fxRate, setFxRate] = useState<number | null>(null);
  const [fxDate, setFxDate] = useState('');
  const [isConverting, setIsConverting] = useState(false);

  const [cveQuery, setCveQuery] = useState('mysql');
  const [cveItems, setCveItems] = useState<CveItem[]>([]);
  const [cveTotal, setCveTotal] = useState<number | null>(null);
  const [isSearchingCve, setIsSearchingCve] = useState(false);

  useEffect(() => {
    setSourceText(architectureText);
  }, [architectureText]);

  useEffect(() => {
    if (simulation?.monthlyCost && simulation.monthlyCost > 0) {
      setFxAmount(simulation.monthlyCost);
    }
  }, [simulation?.monthlyCost]);

  useEffect(() => {
    return () => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const translate = async () => {
    const text = sourceText.trim();

    if (!text) {
      toast.error('Escribe un texto para traducir.');
      return;
    }

    if (sourceLanguage === targetLanguage) {
      setTranslatedText(text);
      toast.info('El idioma de origen y destino es el mismo.');
      return;
    }

    setIsTranslating(true);

    try {
      const params = new URLSearchParams({
        q: truncateUtf8(text, 480),
        langpair: `${sourceLanguage}|${targetLanguage}`,
      });

      const response = await fetch(
        `https://api.mymemory.translated.net/get?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as TranslationResponse;
      const result = data.responseData?.translatedText?.trim();

      if (!result) {
        throw new Error(data.responseDetails || 'Sin traducción disponible');
      }

      setTranslatedText(result);
      toast.success('Traducción completada con API externa.');
    } catch {
      toast.error('No se pudo conectar con la API de traducción.');
    } finally {
      setIsTranslating(false);
    }
  };

  const speak = () => {
    const text = (translatedText || sourceText).trim();

    if (!text) {
      toast.error('No hay texto para reproducir.');
      return;
    }

    if (!('speechSynthesis' in window)) {
      toast.error('Este navegador no soporta síntesis de voz.');
      return;
    }

    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    const language = translatedText ? targetLanguage : sourceLanguage;
    utterance.lang = speechLocales[language] ?? language;
    utterance.rate = 0.95;

    const voices = window.speechSynthesis.getVoices();
    const matchingVoice = voices.find((voice) =>
      voice.lang.toLowerCase().startsWith(language.toLowerCase())
    );

    if (matchingVoice) {
      utterance.voice = matchingVoice;
    }

    utterance.onstart = () => setIsSpeaking(true);
    utterance.onend = () => setIsSpeaking(false);
    utterance.onerror = () => {
      setIsSpeaking(false);
      toast.error('No se pudo reproducir la voz.');
    };

    window.speechSynthesis.speak(utterance);
  };

  const stopSpeech = () => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
    setIsSpeaking(false);
  };

  const swapLanguages = () => {
    setSourceLanguage(targetLanguage);
    setTargetLanguage(sourceLanguage);
    setSourceText(translatedText || sourceText);
    setTranslatedText(sourceText);
  };

  const convertCurrency = async () => {
    if (!Number.isFinite(fxAmount) || fxAmount < 0) {
      toast.error('Ingresa un monto válido.');
      return;
    }

    setIsConverting(true);

    try {
      const response = await fetch(
        `https://api.frankfurter.dev/v2/rate/USD/${fxCurrency}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as FxResponse;

      if (typeof data.rate !== 'number') {
        throw new Error('Tipo de cambio no disponible');
      }

      setFxRate(data.rate);
      setFxDate(data.date ?? '');
      toast.success('Tipo de cambio actualizado.');
    } catch {
      toast.error('No se pudo consultar el tipo de cambio.');
    } finally {
      setIsConverting(false);
    }
  };

  const searchCves = async () => {
    const query = cveQuery.trim();

    if (query.length < 2) {
      toast.error('Escribe al menos 2 caracteres.');
      return;
    }

    setIsSearchingCve(true);

    try {
      const params = new URLSearchParams({
        keywordSearch: query,
        resultsPerPage: '5',
      });

      const response = await fetch(
        `https://services.nvd.nist.gov/rest/json/cves/2.0?${params.toString()}`
      );

      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }

      const data = (await response.json()) as NvdResponse;
      const items = (data.vulnerabilities ?? []).map((item) => {
        const cve = item.cve;
        const english = cve?.descriptions?.find(
          (description) => description.lang === 'en'
        );
        const first = cve?.descriptions?.[0];
        const cvss = getCvss(cve);

        return {
          id: cve?.id ?? 'CVE sin ID',
          description:
            english?.value ?? first?.value ?? 'Sin descripción disponible.',
          published: cve?.published ?? '',
          score: cvss.score,
          severity: cvss.severity,
        };
      });

      setCveItems(items);
      setCveTotal(data.totalResults ?? items.length);

      if (!items.length) {
        toast.info('No se encontraron vulnerabilidades para esa búsqueda.');
      } else {
        toast.success('Inteligencia de vulnerabilidades actualizada.');
      }
    } catch {
      toast.error('No se pudo consultar la base pública de vulnerabilidades.');
    } finally {
      setIsSearchingCve(false);
    }
  };

  const convertedAmount = fxRate === null ? null : fxAmount * fxRate;
  const annualConverted =
    fxRate === null || !simulation ? null : simulation.annualCost * fxRate;

  return (
    <Page>
      <motion.div
        variants={staggerContainer}
        initial="hidden"
        animate="show"
      >
        <Title
          t="APIs e Integraciones"
          s="Servicios gratuitos para demostrar traducción, voz, FinOps y seguridad sin depender de una cuenta AWS"
          tag="CLOUD EXTENSIONS"
        />

        <motion.div
          className="simulation-meta-strip"
          variants={staggerItem}
        >
          <span>
            <b>Modo</b> Integraciones públicas
          </span>
          <span>
            <b>Cuenta AWS</b> No requerida
          </span>
          <span>
            <b>Escenario</b> {simulation?.name ?? 'Sin simulación activa'}
          </span>
          <span>
            <b>Objetivo</b> Demostración académica
          </span>
        </motion.div>

        <motion.div
          className="stats-grid"
          variants={staggerContainer}
          style={{ marginTop: 16 }}
        >
          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon blue"><Languages size={20} /></span>
              <span className="mini-badge">TRANSLATE</span>
            </div>
            <span className="stat-label">Traducción externa</span>
            <strong>6 idiomas</strong>
            <small>Alternativa académica a Amazon Translate</small>
          </Card>

          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon green"><Volume2 size={20} /></span>
              <span className="mini-badge">POLLY-LIKE</span>
            </div>
            <span className="stat-label">Texto a voz</span>
            <strong>Navegador</strong>
            <small>Web Speech API sin claves ni credenciales</small>
          </Card>

          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon amber"><BadgeDollarSign size={20} /></span>
              <span className="mini-badge">FINOPS</span>
            </div>
            <span className="stat-label">Conversión monetaria</span>
            <strong>USD → PEN</strong>
            <small>Presupuesto Cloud expresado en moneda local</small>
          </Card>

          <Card className="stat-card premium" hoverable>
            <div className="stat-top">
              <span className="stat-icon blue"><ShieldAlert size={20} /></span>
              <span className="mini-badge">THREAT INTEL</span>
            </div>
            <span className="stat-label">Vulnerabilidades públicas</span>
            <strong>NVD CVE</strong>
            <small>Referencia a Inspector / Security Hub</small>
          </Card>
        </motion.div>

        <motion.div
          className="content-grid"
          variants={staggerContainer}
          style={{ marginTop: 16, alignItems: 'start' }}
        >
          <Card>
            <div className="card-header">
              <div>
                <span className="section-kicker">SMART LANGUAGE</span>
                <h3>Traducir y reproducir arquitectura</h3>
                <p>Traduce el resumen de la simulación y luego conviértelo a voz.</p>
              </div>
              <Sparkles size={20} />
            </div>

            <div className="form-grid" style={{ marginTop: 14 }}>
              <label>
                <span>Idioma de origen</span>
                <select
                  value={sourceLanguage}
                  onChange={(event) => setSourceLanguage(event.target.value)}
                >
                  {languages.map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>

              <label>
                <span>Idioma de destino</span>
                <select
                  value={targetLanguage}
                  onChange={(event) => setTargetLanguage(event.target.value)}
                >
                  {languages.map(([code, label]) => (
                    <option key={code} value={code}>{label}</option>
                  ))}
                </select>
              </label>

              <label className="wide">
                <span>Texto de arquitectura</span>
                <textarea
                  value={sourceText}
                  maxLength={450}
                  onChange={(event) => setSourceText(event.target.value)}
                  placeholder="Describe la arquitectura Cloud..."
                />
                <small style={{ color: 'var(--muted)' }}>
                  {sourceText.length}/450 caracteres
                </small>
              </label>
            </div>

            <div
              style={{
                display: 'flex',
                gap: 8,
                flexWrap: 'wrap',
                marginTop: 12,
              }}
            >
              <button
                type="button"
                className="primary-button"
                onClick={translate}
                disabled={isTranslating}
              >
                {isTranslating ? <RefreshCcw size={16} /> : <Languages size={16} />}
                {isTranslating ? 'Traduciendo...' : 'Traducir con API'}
              </button>

              <button
                type="button"
                className="mini-badge"
                onClick={swapLanguages}
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: 'var(--card)',
                  color: 'var(--text)',
                }}
              >
                <ArrowRightLeft size={14} /> Cambiar idiomas
              </button>

              <button
                type="button"
                className="mini-badge"
                onClick={isSpeaking ? stopSpeech : speak}
                style={{
                  cursor: 'pointer',
                  border: '1px solid var(--border)',
                  background: isSpeaking ? 'var(--soft-amber)' : 'var(--card)',
                  color: 'var(--text)',
                }}
              >
                {isSpeaking ? <Square size={13} /> : <Volume2 size={14} />}
                {isSpeaking ? 'Detener voz' : 'Reproducir voz'}
              </button>
            </div>

            <div
              style={{
                marginTop: 14,
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: 14,
                minHeight: 105,
                background: 'var(--fill)',
              }}
            >
              <span className="section-kicker">RESULTADO</span>
              <p
                style={{
                  margin: '8px 0 0',
                  color: translatedText ? 'var(--text)' : 'var(--muted)',
                  lineHeight: 1.65,
                  fontSize: 13,
                }}
              >
                {translatedText || 'Aquí aparecerá la traducción obtenida desde la API pública.'}
              </p>
            </div>
          </Card>

          <Card>
            <div className="card-header">
              <div>
                <span className="section-kicker">FINOPS LIVE</span>
                <h3>Presupuesto en moneda local</h3>
                <p>Convierte el costo de referencia desde USD usando una tasa externa.</p>
              </div>
              <BadgeDollarSign size={20} />
            </div>

            <div className="form-grid" style={{ marginTop: 14 }}>
              <label>
                <span>Monto en USD</span>
                <input
                  type="number"
                  min="0"
                  step="0.01"
                  value={fxAmount}
                  onChange={(event) => setFxAmount(Number(event.target.value))}
                />
              </label>

              <label>
                <span>Moneda de destino</span>
                <select
                  value={fxCurrency}
                  onChange={(event) => {
                    setFxCurrency(event.target.value);
                    setFxRate(null);
                    setFxDate('');
                  }}
                >
                  {currencies.map(([code, label]) => (
                    <option key={code} value={code}>{code} · {label}</option>
                  ))}
                </select>
              </label>
            </div>

            <button
              type="button"
              className="primary-button"
              onClick={convertCurrency}
              disabled={isConverting}
              style={{ marginTop: 12 }}
            >
              {isConverting ? <RefreshCcw size={16} /> : <ArrowRightLeft size={16} />}
              {isConverting ? 'Consultando...' : 'Consultar tipo de cambio'}
            </button>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: '1fr 1fr',
                gap: 10,
                marginTop: 14,
              }}
            >
              <div
                style={{
                  padding: 13,
                  borderRadius: 12,
                  background: 'var(--soft-blue)',
                  border: '1px solid var(--blue-line)',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Conversión</span>
                <strong style={{ display: 'block', marginTop: 4, fontSize: 19 }}>
                  {convertedAmount === null
                    ? '—'
                    : money(convertedAmount, fxCurrency)}
                </strong>
                <small style={{ color: 'var(--muted)' }}>
                  {fxRate === null ? 'Pendiente de consulta' : `1 USD = ${fxRate.toFixed(4)} ${fxCurrency}`}
                </small>
              </div>

              <div
                style={{
                  padding: 13,
                  borderRadius: 12,
                  background: 'var(--fill)',
                  border: '1px solid var(--border)',
                }}
              >
                <span style={{ fontSize: 10, color: 'var(--muted)' }}>Costo anual del escenario</span>
                <strong style={{ display: 'block', marginTop: 4, fontSize: 19 }}>
                  {annualConverted === null
                    ? '—'
                    : money(annualConverted, fxCurrency)}
                </strong>
                <small style={{ color: 'var(--muted)' }}>
                  {fxDate ? `Tasa publicada: ${fxDate}` : 'Usa la simulación activa'}
                </small>
              </div>
            </div>
          </Card>
        </motion.div>

        <motion.div variants={staggerItem} style={{ marginTop: 16 }}>
          <Card>
            <div className="card-header">
              <div>
                <span className="section-kicker">SECURITY INTELLIGENCE</span>
                <h3>Consulta de vulnerabilidades CVE</h3>
                <p>
                  Busca vulnerabilidades públicas por tecnología para complementar la evaluación de seguridad.
                </p>
              </div>
              <ShieldAlert size={20} />
            </div>

            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'minmax(0, 1fr) auto',
                gap: 10,
                alignItems: 'end',
              }}
            >
              <label style={{ display: 'grid', gap: 7 }}>
                <span style={{ fontSize: 12, fontWeight: 700, color: 'var(--muted-4)' }}>
                  Tecnología o producto
                </span>
                <div className="search-box" style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Search size={16} />
                  <input
                    value={cveQuery}
                    onChange={(event) => setCveQuery(event.target.value)}
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') void searchCves();
                    }}
                    placeholder="Ej.: MySQL, Linux, Apache, nginx"
                    style={{ border: 0, boxShadow: 'none', paddingLeft: 0 }}
                  />
                </div>
              </label>

              <button
                type="button"
                className="primary-button"
                onClick={searchCves}
                disabled={isSearchingCve}
              >
                {isSearchingCve ? <RefreshCcw size={16} /> : <Search size={16} />}
                {isSearchingCve ? 'Buscando...' : 'Buscar CVE'}
              </button>
            </div>

            {cveTotal !== null && (
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: 8,
                  marginTop: 12,
                  color: 'var(--muted)',
                  fontSize: 11,
                }}
              >
                <Activity size={14} />
                {cveTotal.toLocaleString()} coincidencias encontradas; se muestran hasta 5 resultados.
              </div>
            )}

            <div style={{ display: 'grid', gap: 10, marginTop: 14 }}>
              {cveItems.length === 0 ? (
                <div
                  style={{
                    border: '1px dashed var(--border-strong)',
                    borderRadius: 12,
                    padding: 18,
                    color: 'var(--muted)',
                    fontSize: 12,
                    textAlign: 'center',
                  }}
                >
                  Busca una tecnología para consultar datos reales de vulnerabilidades públicas.
                </div>
              ) : (
                cveItems.map((item) => {
                  const critical = item.score !== null && item.score >= 9;
                  const high = item.score !== null && item.score >= 7;

                  return (
                    <div
                      key={item.id}
                      className="integration-cve-row"
                      style={{
                        display: 'grid',
                        gridTemplateColumns: '150px minmax(0, 1fr) 110px',
                        gap: 14,
                        alignItems: 'start',
                        border: '1px solid var(--border)',
                        borderRadius: 12,
                        padding: 13,
                        background: 'var(--fill)',
                      }}
                    >
                      <div>
                        <b style={{ fontSize: 12 }}>{item.id}</b>
                        <small style={{ display: 'block', marginTop: 4, color: 'var(--muted)' }}>
                          {item.published
                            ? new Date(item.published).toLocaleDateString('es-PE')
                            : 'Fecha no disponible'}
                        </small>
                      </div>

                      <p
                        style={{
                          margin: 0,
                          color: 'var(--muted)',
                          fontSize: 11,
                          lineHeight: 1.55,
                        }}
                      >
                        {item.description}
                      </p>

                      <div style={{ textAlign: 'right' }}>
                        <span
                          className="status-badge"
                          style={{
                            background: critical
                              ? 'rgba(220,38,38,.10)'
                              : high
                              ? 'var(--soft-amber)'
                              : 'var(--soft-green)',
                            color: critical
                              ? '#DC2626'
                              : high
                              ? '#B45309'
                              : '#15803D',
                          }}
                        >
                          {item.score === null ? 'N/A' : `CVSS ${item.score.toFixed(1)}`}
                        </span>
                        <small style={{ display: 'block', marginTop: 5, color: 'var(--muted)' }}>
                          {item.severity}
                        </small>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>
        </motion.div>

        <motion.div
          className="pricing-note"
          variants={staggerItem}
          style={{ marginTop: 16 }}
        >
          <AlertTriangle size={18} />
          <div>
            <b>Importante para la sustentación</b>
            <span>
              Estas integraciones no son servicios de AWS. Se usan como equivalentes gratuitos para demostrar el flujo técnico de consumo de APIs, manejo de respuestas JSON, estados de carga, errores y uso de información externa dentro de una simulación Cloud.
            </span>
          </div>
        </motion.div>
      </motion.div>
    </Page>
  );
}
