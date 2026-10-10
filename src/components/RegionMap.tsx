
import { useEffect, useMemo, useRef, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
  Line,
  ZoomableGroup,
} from 'react-simple-maps';
import {
  CheckCircle2,
  Globe2,
  MapPin,
  RotateCw,
  Search,
  X,
} from 'lucide-react';

import worldAtlas from 'world-atlas/countries-110m.json';
import {
  awsContinents,
  awsRegions,
  type AWSRegion,
} from '../data/awsRegions';
import {
  estimateRegionLatency,
  latencyOrigins,
  latencyProfiles,
  payloadChoices,
} from '../lib/regionLatency';

type Props = {
  value: string;
  onSelect: (region: AWSRegion) => void;
  onClose: () => void;
  originId: string;
  profileId: string;
  payloadMiB: number;
  onSettingsChange: (
    originId: string,
    profileId: string,
    payloadMiB: number
  ) => void;
};

const clamp = (
  value: number,
  min: number,
  max: number
): number => Math.max(min, Math.min(max, value));

export default function RegionMap({
  value,
  onSelect,
  onClose,
  originId,
  profileId,
  payloadMiB,
  onSettingsChange,
}: Props) {
  const initial =
    awsRegions.find(
      (r) => r.code === value || r.name === value
    ) ?? awsRegions[0];

  const [selectedCode, setSelectedCode] = useState(initial.code);
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('All');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const [replay, setReplay] = useState(0);
  const [phase, setPhase] = useState('Enviando datos');

  const mapRef = useRef<HTMLDivElement>(null);
  const packetRefs = useRef<Array<SVGCircleElement | null>>([]);

  const origin =
    latencyOrigins.find((x) => x.id === originId) ??
    latencyOrigins[0];

  const profile =
    latencyProfiles.find((x) => x.id === profileId) ??
    latencyProfiles[0];

  const selected =
    awsRegions.find((r) => r.code === selectedCode) ??
    initial;

  const latency = estimateRegionLatency(
    origin.coordinates,
    selected.coordinates,
    profile,
    payloadMiB
  );

  const filtered = useMemo(
    () =>
      awsRegions.filter(
        (r) =>
          (continent === 'All' ||
            r.continent === continent) &&
          [
            r.name,
            r.code,
            r.location,
            r.country,
          ].some((x) =>
            x
              .toLowerCase()
              .includes(search.toLowerCase().trim())
          )
      ),
    [continent, search]
  );

  // La animación está desacelerada para poder observarla.
  // No representa milisegundos reales en pantalla.
  const outboundMs = clamp(latency.rttMs * 9, 550, 2400);
  const streamMs = clamp(
    latency.transferMs * 0.06,
    350,
    2600
  );

  const cycleMs = outboundMs * 2 + streamMs + 400;

  useEffect(() => {
    const container = mapRef.current;

    const path =
      container?.querySelector<SVGPathElement>(
        '.latency-live-track'
      );

    const packets = packetRefs.current;

    if (!path || packets.length === 0) return;

    let length = 0;

    try {
      length = path.getTotalLength();
    } catch {
      return;
    }

    if (!Number.isFinite(length) || length <= 0) return;

    let frame = 0;
    let started: number | null = null;
    let lastPhase = '';

    const render = (time: number) => {
      if (started === null) started = time;

      const elapsed = (time - started) % cycleMs;

      const returning =
        elapsed >= outboundMs + streamMs;

      const nextPhase = returning
        ? 'Recibiendo respuesta'
        : elapsed >= outboundMs
          ? 'Transfiriendo datos'
          : 'Enviando datos';

      if (nextPhase !== lastPhase) {
        lastPhase = nextPhase;
        setPhase(nextPhase);
      }

      packets.forEach((circle, i) => {
        if (!circle) return;

        const spacing =
          i * Math.min(115, outboundMs / 5);

        const travel = returning
          ? (
              elapsed -
              outboundMs -
              streamMs -
              spacing
            ) / outboundMs
          : (elapsed - spacing) / outboundMs;

        const visible =
          travel >= 0 && travel <= 1;

        const progress = clamp(
          returning ? 1 - travel : travel,
          0,
          1
        );

        const point = path.getPointAtLength(
          length * progress
        );

        circle.setAttribute('cx', String(point.x));
        circle.setAttribute('cy', String(point.y));

        circle.style.opacity = visible
          ? String(1 - i * 0.18)
          : '0';

        circle.style.fill = returning
          ? '#22c55e'
          : '#38bdf8';
      });

      frame = window.requestAnimationFrame(render);
    };

    frame = window.requestAnimationFrame(render);

    return () => {
      window.cancelAnimationFrame(frame);
    };
  }, [
    selectedCode,
    originId,
    profileId,
    payloadMiB,
    replay,
    outboundMs,
    streamMs,
    cycleMs,
  ]);

  const changeRegion = (region: AWSRegion) => {
    setSelectedCode(region.code);
    setReplay((x) => x + 1);
  };

  const confirmSelection = () => {
    onSelect(selected);
    onClose();
  };

  return (
    <div
      className="region-map-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Elegir región AWS"
      onMouseDown={(e) => {
        if (e.target === e.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="region-map-modal latency-clean-modal">
        <header className="region-map-header">
          <div className="region-map-title">
            <span>
              <Globe2 size={20} />
            </span>

            <div>
              <h2>¿Dónde alojar tu proyecto?</h2>
              <p>
                Selecciona una región y compara la
                rapidez de conexión estimada.
              </p>
            </div>
          </div>

          <button
            className="region-map-close"
            type="button"
            onClick={onClose}
            aria-label="Cerrar"
          >
            <X size={18} />
          </button>
        </header>

        <div className="region-map-toolbar">
          <div className="region-map-search">
            <Search size={16} />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Buscar ciudad o región..."
              aria-label="Buscar región"
            />
          </div>

          <select
            value={continent}
            onChange={(e) => setContinent(e.target.value)}
            aria-label="Filtrar continente"
          >
            {awsContinents.map((item) => (
              <option value={item} key={item}>
                {item === 'All'
                  ? 'Todo el mundo'
                  : item}
              </option>
            ))}
          </select>
        </div>

        <div className="region-map-content">
          <div
            className="region-map-visual latency-live-map"
            ref={mapRef}
          >
            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{ scale: 145 }}
              width={900}
              height={520}
              className="aws-world-map"
            >
              <ZoomableGroup
                center={[10, 5]}
                zoom={1}
                minZoom={1}
                maxZoom={4}
              >
                <Geographies geography={worldAtlas as any}>
                  {({ geographies }) =>
                    geographies.map((geo) => (
                      <Geography
                        key={geo.rsmKey}
                        geography={geo}
                        className="world-country"
                      />
                    ))
                  }
                </Geographies>
                <Line
                  from={origin.coordinates}
                  to={selected.coordinates}
                  className="latency-live-track"
                />

                {Array.from(
                  { length: 4 },
                  (_, i) => (
                    <circle
                      key={i}
                      ref={(node) => {
                        packetRefs.current[i] = node;
                      }}
                      r={i === 0 ? 5 : 3.5}
                      className="latency-moving-packet"
                      cx={0}
                      cy={0}
                    />
                  )
                )}

                <Marker coordinates={origin.coordinates}>
                  <circle
                    r={7}
                    className="latency-start-dot"
                  />
                  <text
                    x={10}
                    y={-13}
                    className="map-marker-label"
                  >
                    Origen
                  </text>
                </Marker>

                {filtered.map((region) => (
                  <Marker
                    key={region.code}
                    coordinates={region.coordinates}
                    onClick={() => changeRegion(region)}
                  >
                    <g
                      className={
                        region.code === selectedCode
                          ? 'map-marker selected'
                          : 'map-marker'
                      }
                      role="button"
                      tabIndex={0}
                      aria-label={`Seleccionar ${region.name}`}
                      onKeyDown={(e) => {
                        if (
                          e.key === 'Enter' ||
                          e.key === ' '
                        ) {
                          e.preventDefault();
                          changeRegion(region);
                        }
                      }}
                    >
                      <circle
                        r={
                          region.code === selectedCode
                            ? 7
                            : 4.5
                        }
                        className={`map-marker-dot ${
                          region.access === 'default'
                            ? 'default'
                            : 'optin'
                        }`}
                      />

                      {region.code === selectedCode && (
                        <>
                          <circle
                            r={12}
                            className="map-marker-pulse"
                          />
                          <text
                            x={10}
                            y={-13}
                            className="map-marker-label"
                          >
                            {region.code}
                          </text>
                        </>
                      )}
                    </g>
                  </Marker>
                ))}
              </ZoomableGroup>
            </ComposableMap>

            <div className="latency-live-caption">
              <span className="latency-live-pulse" />
              {phase}

              <button
                type="button"
                onClick={() =>
                  setReplay((x) => x + 1)
                }
                title="Reiniciar animación"
                aria-label="Repetir animación"
              >
                <RotateCw size={15} />
              </button>
            </div>
          </div>

          <aside className="region-map-panel latency-clean-panel">
            <div className="latency-clean-controls">
              <label>
                Desde
                <select
                  value={origin.id}
                  onChange={(e) =>
                    onSettingsChange(
                      e.target.value,
                      profile.id,
                      payloadMiB
                    )
                  }
                >
                  {latencyOrigins.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>

              <label>
                Conexión
                <select
                  value={profile.id}
                  onChange={(e) =>
                    onSettingsChange(
                      origin.id,
                      e.target.value,
                      payloadMiB
                    )
                  }
                >
                  {latencyProfiles.map((x) => (
                    <option key={x.id} value={x.id}>
                      {x.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <div
              className="latency-clean-result"
              aria-live="polite"
            >
              <span>Región elegida</span>

              <h3>{selected.name}</h3>

              <small>
                {selected.code} · {selected.country}
              </small>

              <div className="latency-clean-number">
                <strong>~{latency.rttMs} ms</strong>
                <span>
                  Latencia de ida y vuelta (RTT)
                </span>
              </div>

              <div className="latency-clean-bench">
                <span>
                  {latency.category === 'Baja'
                    ? 'Respuesta rápida'
                    : latency.category === 'Media'
                      ? 'Respuesta moderada'
                      : 'Respuesta más lenta'}
                </span>

                <div>
                  <i
                    style={{
                      width: `${clamp(
                        (latency.rttMs / 350) * 100,
                        4,
                        100
                      )}%`,
                    }}
                  />
                </div>
              </div>

              <details
                open={detailsOpen}
                onToggle={(e) =>
                  setDetailsOpen(e.currentTarget.open)
                }
              >
                <summary>
                  Ver detalles de transferencia
                </summary>

                <label>
                  Tamaño de datos
                  <select
                    value={payloadMiB}
                    onChange={(e) =>
                      onSettingsChange(
                        origin.id,
                        profile.id,
                        Number(e.target.value)
                      )
                    }
                  >
                    {payloadChoices.map((x) => (
                      <option key={x} value={x}>
                        {x} MiB
                      </option>
                    ))}
                  </select>
                </label>

                <p>
                  Velocidad de conexión:{' '}
                  {profile.megabitsPerSecond} Mbps
                </p>

                <p>
                  Transferencia estimada:{' '}
                  {latency.transferMs} ms
                </p>

                <p>
                  Tiempo total orientativo:{' '}
                  {latency.totalMs} ms
                </p>
              </details>
            </div>

            <div className="latency-clean-list-title">
              Otras regiones
              <span>{filtered.length}</span>
            </div>

            <div className="region-list latency-clean-list">
              {filtered.map((region) => (
                <button
                  key={region.code}
                  type="button"
                  className={
                    selectedCode === region.code
                      ? 'region-list-item selected'
                      : 'region-list-item'
                  }
                  onClick={() => changeRegion(region)}
                >
                  <MapPin size={14} />

                  <span className="region-list-info">
                    <strong>{region.name}</strong>
                    <small>{region.code}</small>
                  </span>

                  <b className="region-list-latency">
                    ~
                    {
                      estimateRegionLatency(
                        origin.coordinates,
                        region.coordinates,
                        profile,
                        payloadMiB
                      ).rttMs
                    }{' '}
                    ms
                  </b>
                </button>
              ))}

              {filtered.length === 0 && (
                <p>
                  No hay regiones que coincidan
                  con la búsqueda.
                </p>
              )}
            </div>

            <button
              className="primary-button latency-clean-confirm"
              type="button"
              onClick={confirmSelection}
            >
              <CheckCircle2 size={16} />
              Usar esta región
            </button>
          </aside>
        </div>

        <footer className="region-map-footer">
          <span>
            Animación ilustrativa: su velocidad
            cambia con el perfil de red.
          </span>
          <span>
            Estimaciones educativas; no son
            mediciones reales de AWS.
          </span>
        </footer>
      </div>
    </div>
  );
}
