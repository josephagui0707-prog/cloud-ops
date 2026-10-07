import { useMemo, useState } from 'react';
import {
  ComposableMap,
  Geographies,
  Geography,
  Marker,
} from 'react-simple-maps';
import { ZoomableGroup } from 'react-simple-maps/zoom';
import {
  CheckCircle2,
  Globe2,
  MapPin,
  Search,
  X,
} from 'lucide-react';

import {
  awsContinents,
  awsRegions,
  type AWSRegion,
} from '../data/awsRegions';

type RegionMapProps = {
  value: string;
  onSelect: (region: AWSRegion) => void;
  onClose: () => void;
};

import worldAtlas from 'world-atlas/countries-110m.json';
export default function RegionMap({
  value,
  onSelect,
  onClose,
}: RegionMapProps) {
  const currentRegion =
    awsRegions.find((region) => region.name === value) ??
    awsRegions.find((region) => region.code === value) ??
    awsRegions[0];

  const [selectedCode, setSelectedCode] = useState(
    currentRegion?.code ?? ''
  );
  const [search, setSearch] = useState('');
  const [continent, setContinent] = useState('All');

  const selectedRegion =
    awsRegions.find(
      (region) => region.code === selectedCode
    ) ?? currentRegion;

  const filteredRegions = useMemo(() => {
    const query = search.trim().toLowerCase();

    return awsRegions.filter((region) => {
      const matchesSearch =
        !query ||
        region.name.toLowerCase().includes(query) ||
        region.code.toLowerCase().includes(query) ||
        region.location.toLowerCase().includes(query) ||
        region.country.toLowerCase().includes(query);

      const matchesContinent =
        continent === 'All' ||
        region.continent === continent;

      return matchesSearch && matchesContinent;
    });
  }, [search, continent]);

  const selectRegion = (region: AWSRegion) => {
    setSelectedCode(region.code);
  };

  const confirmSelection = () => {
    if (!selectedRegion) return;
    onSelect(selectedRegion);
    onClose();
  };

  return (
    <div
      className="region-map-overlay"
      role="dialog"
      aria-modal="true"
      aria-label="Seleccionar región AWS"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div className="region-map-modal">
        <div className="region-map-header">
          <div className="region-map-title">
            <span>
              <Globe2 size={20} />
            </span>

            <div>
              <small>AWS GLOBAL REGIONS</small>
              <h2>Seleccionar región</h2>
              <p>
                Explora las regiones comerciales disponibles y
                selecciona dónde se ubicará tu escenario.
              </p>
            </div>
          </div>

          <button
            type="button"
            className="region-map-close"
            onClick={onClose}
            aria-label="Cerrar mapa"
          >
            <X size={18} />
          </button>
        </div>

        <div className="region-map-toolbar">
          <div className="region-map-search">
            <Search size={16} />
            <input
              type="text"
              placeholder="Buscar región, código o ubicación..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />
          </div>

          <select
            value={continent}
            onChange={(event) =>
              setContinent(event.target.value)
            }
          >
            {awsContinents.map((item) => (
              <option key={item} value={item}>
                {item === 'All' ? 'Todos los continentes' : item}
              </option>
            ))}
          </select>
        </div>

        <div className="region-map-content">
          <div className="region-map-visual">
            <div className="region-map-badge">
              <MapPin size={13} />
              {filteredRegions.length} regiones visibles
            </div>

            <ComposableMap
              projection="geoEqualEarth"
              projectionConfig={{
                scale: 145,
              }}
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

                {filteredRegions.map((region) => {
                  const selected =
                    region.code ===
                    selectedRegion?.code;

                  return (
                    <Marker
                      key={region.code}
                      coordinates={
                        region.coordinates
                      }
                      onClick={() =>
                        selectRegion(region)
                      }
                    >
                      <g
                        className={
                          selected
                            ? 'map-marker selected'
                            : 'map-marker'
                        }
                        role="button"
                        tabIndex={0}
                        aria-label={`Seleccionar ${region.name}`}
                      >
                        <circle
                          className={
                            region.access ===
                            'default'
                              ? 'map-marker-dot default'
                              : 'map-marker-dot optin'
                          }
                          r={
                            selected ? 7 : 4.5
                          }
                        />

                        {selected && (
                          <>
                            <circle
                              className="map-marker-pulse"
                              r="12"
                            />

                            <text
                              x="10"
                              y="-13"
                              className="map-marker-label"
                            >
                              {region.code}
                            </text>
                          </>
                        )}
                      </g>
                    </Marker>
                  );
                })}
              </ZoomableGroup>
            </ComposableMap>

            <div className="region-map-legend">
              <span>
                <i className="legend-dot default" />
                Predeterminada
              </span>

              <span>
                <i className="legend-dot optin" />
                Opt-in
              </span>

              <span>
                <i className="legend-dot selected" />
                Seleccionada
              </span>
            </div>
          </div>

          <aside className="region-map-panel">
            <div className="region-map-panel-title">
              <span className="section-kicker">
                REGION CATALOG
              </span>

              <b>
                {filteredRegions.length} resultados
              </b>
            </div>

            <div className="region-list">
              {filteredRegions.map((region) => {
                const selected =
                  selectedRegion?.code ===
                  region.code;

                return (
                  <button
                    type="button"
                    key={region.code}
                    className={
                      selected
                        ? 'region-list-item selected'
                        : 'region-list-item'
                    }
                    onClick={() =>
                      selectRegion(region)
                    }
                  >
                    <span className="region-list-pin">
                      <MapPin size={15} />
                    </span>

                    <span className="region-list-info">
                      <strong>
                        {region.name}
                      </strong>

                      <small>
                        {region.code} ·{' '}
                        {region.location}
                      </small>
                    </span>

                    <span
                      className={
                        region.access ===
                        'default'
                          ? 'region-access default'
                          : 'region-access optin'
                      }
                    >
                      {region.access ===
                      'default'
                        ? 'Default'
                        : 'Opt-in'}
                    </span>
                  </button>
                );
              })}

              {filteredRegions.length ===
                0 && (
                <div className="region-list-empty">
                  <Search size={22} />
                  <b>Sin resultados</b>
                  <span>
                    Prueba otra búsqueda o
                    cambia el continente.
                  </span>
                </div>
              )}
            </div>

            {selectedRegion && (
              <div className="region-selected-card">
                <div className="region-selected-top">
                  <div>
                    <span className="section-kicker">
                      SELECTED REGION
                    </span>

                    <h3>
                      {selectedRegion.name}
                    </h3>
                  </div>

                  <CheckCircle2 size={20} />
                </div>

                <div className="region-selected-code">
                  {selectedRegion.code}
                </div>

                <div className="region-selected-details">
                  <span>
                    <b>Ubicación</b>
                    {selectedRegion.location}
                  </span>

                  <span>
                    <b>País</b>
                    {selectedRegion.country}
                  </span>

                  <span>
                    <b>Continente</b>
                    {selectedRegion.continent}
                  </span>

                  <span>
                    <b>Acceso</b>
                    {selectedRegion.access ===
                    'default'
                      ? 'Habilitada por defecto'
                      : 'Requiere activación'}
                  </span>
                </div>

                <button
                  type="button"
                  className="primary-button"
                  onClick={
                    confirmSelection
                  }
                >
                  <CheckCircle2 size={15} />
                  Seleccionar región
                </button>
              </div>
            )}
          </aside>
        </div>

        <div className="region-map-footer">
          <span>
            <Globe2 size={14} />
            Mapa geográfico interactivo
          </span>

          <span>
            La disponibilidad mostrada corresponde
            al catálogo comercial de AWS; este proyecto
            no realiza cambios reales en una cuenta AWS.
          </span>
        </div>
      </div>
    </div>
  );
}