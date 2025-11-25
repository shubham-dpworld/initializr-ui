import { useEffect, useMemo, useState } from "react";
import "./ProjectGenerator.css";

function ProjectGenerator() {
  const [meta, setMeta] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Core selects
  const [type, setType] = useState("");
  const [language, setLanguage] = useState("");
  const [packaging, setPackaging] = useState("");
  const [bootVersion, setBootVersion] = useState("");
  const [javaVersion, setJavaVersion] = useState("");

  // Text fields
  const [groupId, setGroupId] = useState("");
  const [artifactId, setArtifactId] = useState("");
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [packageName, setPackageName] = useState("");
  const [version, setVersion] = useState("");

  // Dependencies
  const [dependencies, setDependencies] = useState([]);
  const [depVersions, setDepVersions] = useState({});
  const [showDepsModal, setShowDepsModal] = useState(false);
  const [depsQuery, setDepsQuery] = useState("");

  // Boilerplate Codes
  const [boilerplateCodes, setBoilerplateCodes] = useState([]);
  const [showBoilerplateModal, setShowBoilerplateModal] = useState(false);
  const [boilerplateQuery, setBoilerplateQuery] = useState("");

  useEffect(() => {
    const fetchMetadata = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(`/metadata/client?ts=${Date.now()}`, {
          cache: "no-store",
          headers: { Accept: "application/vnd.initializr.v2.1+json" },
        });
        if (!res.ok) throw new Error(`Failed to fetch metadata: ${res.status}`);
        const data = await res.json();
        setMeta(data);

        // Defaults
        setType(data.type?.default ?? data.type?.values?.[0]?.id ?? "");
        setLanguage(data.language?.default ?? data.language?.values?.[0]?.id ?? "");
        setPackaging(data.packaging?.default ?? data.packaging?.values?.[0]?.id ?? "");
        setBootVersion(data.bootVersion?.default ?? data.bootVersion?.values?.[0]?.id ?? "");
        setJavaVersion(data.javaVersion?.default ?? data.javaVersion?.values?.[0]?.id ?? "");

        setGroupId(data.groupId?.default ?? "com.example");
        setArtifactId(data.artifactId?.default ?? "demo");
        setName(data.name?.default ?? "demo");
        setDescription(data.description?.default ?? "Demo project");
        setPackageName(data.packageName?.default ?? "com.example.demo");
        setVersion(data.version?.default ?? "0.0.1-SNAPSHOT");

        // Seed per-dependency default versions
        const seed = {};
        (data.dependencies?.values ?? []).forEach((group) => {
          (group.values ?? []).forEach((dep) => {
            if (dep.defaultVersion) seed[dep.id] = dep.defaultVersion;
            else if (Array.isArray(dep.versions)) {
              const def = dep.versions.find((v) => v.default)?.id;
              if (def) seed[dep.id] = def;
            }
          });
        });
        setDepVersions(seed);
      } catch (err) {
        console.error(err);
        setError(err.message || "Error loading metadata");
      } finally {
        setLoading(false);
      }
    };

    fetchMetadata();
  }, []);

  const toggleDependency = (depId) => {
    setDependencies((prev) =>
      prev.includes(depId) ? prev.filter((x) => x !== depId) : [...prev, depId]
    );
  };

  const toggleBoilerplateCode = (codeId) => {
    setBoilerplateCodes((prev) =>
      prev.includes(codeId) ? prev.filter((x) => x !== codeId) : [...prev, codeId]
    );
  };

  const setDependencyVersion = (depId, ver) => {
    setDepVersions((prev) => ({ ...prev, [depId]: ver }));
  };

  const removeDependency = (depId) => {
    setDependencies((prev) => prev.filter((x) => x !== depId));
  };

  const removeBoilerplate = (codeId) => {
    setBoilerplateCodes((prev) => prev.filter((x) => x !== codeId));
  };

  const clearDependencies = () => setDependencies([]);
  const clearBoilerplateCodes = () => setBoilerplateCodes([]);

  const filteredGroups = useMemo(() => {
    if (!meta?.dependencies?.values) return [];
    const q = depsQuery.trim().toLowerCase();
    if (!q) return meta.dependencies.values;
    return meta.dependencies.values
      .map((group) => {
        const values = (group.values || []).filter((dep) => {
          const hay = `${dep.id} ${dep.name ?? ""} ${dep.description ?? ""}`.toLowerCase();
          return hay.includes(q);
        });
        return { ...group, values };
      })
      .filter((g) => g.values && g.values.length > 0);
  }, [meta, depsQuery]);

  const groupedBoilerplateCodes = useMemo(() => {
    if (!meta?.boilerplateCodeOptions) return {};

    const q = boilerplateQuery.trim().toLowerCase();
    let options = meta.boilerplateCodeOptions;

    if (q) {
      options = options.filter((code) => {
        const hay = `${code.id} ${code.name ?? ""} ${code.description ?? ""}`.toLowerCase();
        return hay.includes(q);
      });
    }

    return options.reduce((acc, code) => {
      const type = code.type || "other";
      if (!acc[type]) acc[type] = [];
      acc[type].push(code);
      return acc;
    }, {});
  }, [meta, boilerplateQuery]);

  const buildDependenciesParam = () => {
    const withVersions = dependencies.map((depId) => {
      const depMeta = findDepMeta(depId);
      const hasVersions = !!(depMeta && Array.isArray(depMeta.versions) && depMeta.versions.length);
      if (hasVersions && depVersions[depId]) {
        return `${depId}:${depVersions[depId]}`;
      }
      return depId;
    });
    return withVersions.join(",");
  };

  const findDepMeta = (depId) => {
    if (!meta?.dependencies?.values) return null;
    for (const group of meta.dependencies.values) {
      const hit = (group.values || []).find((d) => d.id === depId);
      if (hit) return hit;
    }
    return null;
  };

  const findBoilerplateMeta = (codeId) => {
    if (!meta?.boilerplateCodeOptions) return null;
    return meta.boilerplateCodeOptions.find((c) => c.id === codeId);
  };

  const handleGenerate = () => {
    if (!type || !language || !packaging || !bootVersion || !javaVersion) {
      alert("Please select Type, Language, Packaging, Boot and Java versions.");
      return;
    }

    const params = new URLSearchParams({
      type,
      language,
      packaging,
      bootVersion,
      javaVersion,
      groupId,
      artifactId,
      name,
      description,
      packageName,
      version,
    });

    if (dependencies.length > 0) {
      params.set("dependencies", buildDependenciesParam());
    }

    if (boilerplateCodes.length > 0) {
      params.set("boilerplateCode", boilerplateCodes.join(","));
    }

    const url = `/starter.zip?${params.toString()}`;
    window.location.href = url;
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="error"><h2>Failed to load metadata</h2><p>{error}</p></div>;
  if (!meta) return <div className="error">No metadata available.</div>;

  const hasBoilerplateCodes = meta.boilerplateCodeOptions && meta.boilerplateCodeOptions.length > 0;

  return (
    <>
      <main className="layout">
        {/* Left: Configuration */}
        <section className="panel config">
          <h2 className="panel-title">Project Configuration</h2>

          <div className="form-grid">
            <label className="field">
              <span>Project Type</span>
              <select value={type} onChange={(e) => setType(e.target.value)}>
                {meta.type?.values?.map((t) => (
                  <option key={t.id} value={t.id}>{t.name ?? t.id}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Language</span>
              <select value={language} onChange={(e) => setLanguage(e.target.value)}>
                {meta.language?.values?.map((l) => (
                  <option key={l.id} value={l.id}>{l.name ?? l.id}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Packaging</span>
              <select value={packaging} onChange={(e) => setPackaging(e.target.value)}>
                {meta.packaging?.values?.map((p) => (
                  <option key={p.id} value={p.id}>{p.name ?? p.id}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Boot Version</span>
              <select value={bootVersion} onChange={(e) => setBootVersion(e.target.value)}>
                {meta.bootVersion?.values?.map((v) => (
                  <option key={v.id} value={v.name}>{v.name ?? v.id}</option>
                ))}
              </select>
            </label>

            <label className="field">
              <span>Java Version</span>
              <select value={javaVersion} onChange={(e) => setJavaVersion(e.target.value)}>
                {meta.javaVersion?.values?.map((v) => (
                  <option key={v.id} value={v.id}>{v.name ?? v.id}</option>
                ))}
              </select>
            </label>
          </div>

          <h3 className="subheading">Project Metadata</h3>
          <div className="form-grid two-col">
            <label className="field">
              <span>Group</span>
              <input value={groupId} onChange={(e) => setGroupId(e.target.value)} />
            </label>
            <label className="field">
              <span>Artifact</span>
              <input value={artifactId} onChange={(e) => setArtifactId(e.target.value)} />
            </label>
            <label className="field">
              <span>Name</span>
              <input value={name} onChange={(e) => setName(e.target.value)} />
            </label>
            <label className="field">
              <span>Version</span>
              <input value={version} onChange={(e) => setVersion(e.target.value)} />
            </label>
            <label className="field full">
              <span>Description</span>
              <input value={description} onChange={(e) => setDescription(e.target.value)} />
            </label>
            <label className="field full">
              <span>Package Name</span>
              <input value={packageName} onChange={(e) => setPackageName(e.target.value)} />
            </label>
          </div>
        </section>

        {/* Right: Selected Items */}
        <section className="panel selections">
          <h2 className="panel-title">Dependencies & Templates</h2>

          {/* Dependencies Section */}
          <div className="selection-section">
            <div className="section-header">
              <h3>Dependencies</h3>
              <button
                className="btn primary-outline"
                onClick={() => setShowDepsModal(true)}
              >
                Add Dependencies
              </button>
            </div>

            {dependencies.length === 0 ? (
              <div className="empty-state">
                <p>No dependencies selected</p>
                <button
                  className="btn ghost"
                  onClick={() => setShowDepsModal(true)}
                >
                  Browse Dependencies
                </button>
              </div>
            ) : (
              <div className="selected-items">
                {dependencies.map((depId) => {
                  const depMeta = findDepMeta(depId);
                  const hasVersions = depMeta && Array.isArray(depMeta.versions) && depMeta.versions.length > 0;

                  return (
                    <div key={depId} className="selected-item">
                      <div className="item-info">
                        <span className="item-name">{depMeta?.name ?? depId}</span>
                        {depMeta?.description && (
                          <span className="item-desc">{depMeta.description}</span>
                        )}
                      </div>

                      {hasVersions && (
                        <select
                          className="version-select"
                          value={depVersions[depId] || ""}
                          onChange={(e) => setDependencyVersion(depId, e.target.value)}
                        >
                          {depMeta.versions.map((v) => (
                            <option key={v.id} value={v.id}>
                              {v.name ?? v.id}
                            </option>
                          ))}
                        </select>
                      )}

                      <button
                        className="remove-btn"
                        onClick={() => removeDependency(depId)}
                        aria-label="Remove dependency"
                      >
                        ×
                      </button>
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* Boilerplate Templates Section */}
          {hasBoilerplateCodes && (
            <div className="selection-section">
              <div className="section-header">
                <h3>API Integration Templates</h3>
                <button
                  className="btn primary-outline"
                  onClick={() => setShowBoilerplateModal(true)}
                >
                  Add Templates
                </button>
              </div>

              {boilerplateCodes.length === 0 ? (
                <div className="empty-state">
                  <p>No templates selected</p>
                  <button
                    className="btn ghost"
                    onClick={() => setShowBoilerplateModal(true)}
                  >
                    Browse Templates
                  </button>
                </div>
              ) : (
                <div className="selected-items">
                  {boilerplateCodes.map((codeId) => {
                    const codeMeta = findBoilerplateMeta(codeId);

                    return (
                      <div key={codeId} className="selected-item">
                        <div className="item-info">
                          <span className="item-name">
                            {codeMeta?.name ?? codeId}
                            {codeMeta?.type && (
                              <span className="type-badge">{codeMeta.type}</span>
                            )}
                          </span>
                          {codeMeta?.description && (
                            <span className="item-desc">{codeMeta.description}</span>
                          )}
                        </div>

                        <button
                          className="remove-btn"
                          onClick={() => removeBoilerplate(codeId)}
                          aria-label="Remove template"
                        >
                          ×
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </section>
      </main>

      {/* Dependencies Modal */}
      {showDepsModal && (
        <Modal
          title="Add Dependencies"
          onClose={() => {
            setShowDepsModal(false);
            setDepsQuery("");
          }}
        >
          <div className="modal-search">
            <input
              className="search-input"
              placeholder="Search dependencies…"
              value={depsQuery}
              onChange={(e) => setDepsQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-content">
            {filteredGroups.map((group) => (
              <div key={group.name} className="modal-group">
                <h4 className="group-title">{group.name}</h4>
                {(group.values || []).map((dep) => {
                  const selected = dependencies.includes(dep.id);

                  return (
                    <label key={dep.id} className="modal-item">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleDependency(dep.id)}
                      />
                      <div className="modal-item-info">
                        <span className="modal-item-name">{dep.name ?? dep.id}</span>
                        {dep.description && (
                          <span className="modal-item-desc">{dep.description}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}

            {filteredGroups.length === 0 && (
              <div className="no-results">
                <p>No dependencies found matching "{depsQuery}"</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn ghost" onClick={() => setShowDepsModal(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}

      {/* Boilerplate Modal */}
      {showBoilerplateModal && (
        <Modal
          title="Add API Integration Templates"
          onClose={() => {
            setShowBoilerplateModal(false);
            setBoilerplateQuery("");
          }}
        >
          <div className="modal-search">
            <input
              className="search-input"
              placeholder="Search templates…"
              value={boilerplateQuery}
              onChange={(e) => setBoilerplateQuery(e.target.value)}
              autoFocus
            />
          </div>

          <div className="modal-content">
            {Object.entries(groupedBoilerplateCodes).map(([typeName, codes]) => (
              <div key={typeName} className="modal-group">
                <h4 className="group-title">
                  {typeName.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ")}
                </h4>
                {codes.map((code) => {
                  const selected = boilerplateCodes.includes(code.id);

                  return (
                    <label key={code.id} className="modal-item">
                      <input
                        type="checkbox"
                        checked={selected}
                        onChange={() => toggleBoilerplateCode(code.id)}
                      />
                      <div className="modal-item-info">
                        <span className="modal-item-name">
                          {code.name ?? code.id}
                          <span className="type-badge-inline">{code.type}</span>
                        </span>
                        {code.description && (
                          <span className="modal-item-desc">{code.description}</span>
                        )}
                      </div>
                    </label>
                  );
                })}
              </div>
            ))}

            {Object.keys(groupedBoilerplateCodes).length === 0 && (
              <div className="no-results">
                <p>No templates found matching "{boilerplateQuery}"</p>
              </div>
            )}
          </div>

          <div className="modal-footer">
            <button className="btn ghost" onClick={() => setShowBoilerplateModal(false)}>
              Done
            </button>
          </div>
        </Modal>
      )}

      <footer className="generate-bar">
        <div className="summary">
          <span className="chip">{type}</span>
          <span className="chip">{language}</span>
          <span className="chip">{packaging}</span>
          <span className="chip">Boot {bootVersion}</span>
          <span className="chip">Java {javaVersion}</span>
          <span className="chip accent">{dependencies.length} deps</span>
          {boilerplateCodes.length > 0 && (
            <span className="chip accent">{boilerplateCodes.length} templates</span>
          )}
        </div>
        <button onClick={handleGenerate} className="btn primary">
          Generate Project
        </button>
      </footer>
    </>
  );
}

// Modal Component
function Modal({ title, children, onClose }) {
  useEffect(() => {
    const handleEsc = (e) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleEsc);
    document.body.style.overflow = "hidden";

    return () => {
      document.removeEventListener("keydown", handleEsc);
      document.body.style.overflow = "unset";
    };
  }, [onClose]);

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal" onClick={(e) => e.stopPropagation()}>
        <div className="modal-header">
          <h2>{title}</h2>
          <button className="modal-close" onClick={onClose} aria-label="Close">
            ×
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

export default ProjectGenerator;
