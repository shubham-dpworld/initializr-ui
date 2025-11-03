// src/App.jsx
import { useEffect, useMemo, useState } from "react";
import "./App.css";

function App() {
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
  const [dependencies, setDependencies] = useState([]);            // array of dep ids
  const [depVersions, setDepVersions] = useState({});              // map: depId -> chosen version string
  const [query, setQuery] = useState("");

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
        setBootVersion(
          data.bootVersion?.default ?? data.bootVersion?.values?.[0]?.id ?? ""
        );
        setJavaVersion(data.javaVersion?.default ?? data.javaVersion?.values?.[0]?.id ?? "");

        setGroupId(data.groupId?.default ?? "com.example");
        setArtifactId(data.artifactId?.default ?? "demo");
        setName(data.name?.default ?? "demo");
        setDescription(data.description?.default ?? "Demo project");
        setPackageName(data.packageName?.default ?? "com.example.demo");
        setVersion(data.version?.default ?? "0.0.1-SNAPSHOT");

        // Seed per-dependency default versions if metadata provides them
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

  const setDependencyVersion = (depId, ver) => {
    setDepVersions((prev) => ({ ...prev, [depId]: ver }));
  };

  const clearDependencies = () => setDependencies([]);

  const filteredGroups = useMemo(() => {
    if (!meta?.dependencies?.values) return [];
    const q = query.trim().toLowerCase();
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
  }, [meta, query]);

  const buildDependenciesParam = () => {
    // For each selected dep, if a version was chosen and the meta actually offers versions, encode as depId:version
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

    const url = `/starter.zip?${params.toString()}`;
    window.location.href = url;
  };

  if (loading) return <div className="loading">Loading…</div>;
  if (error) return <div className="error"><h2>Failed to load metadata</h2><p>{error}</p></div>;
  if (!meta) return <div className="error">No metadata available.</div>;

  return (
    <div className="shell">
      <header className="app-header">
        <div className="brand">
          <span className="logo-dot" aria-hidden />
          <h1>DPW Project Initializer</h1>
        </div>
        <div className="header-actions">
          <button className="btn ghost" onClick={clearDependencies}>
            Clear Dependencies ({dependencies.length})
          </button>
        </div>
      </header>

      <main className="layout">
        {/* Left: Configuration */}
        <section className="panel config">
          <h2 className="panel-title">Configuration</h2>

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
                  <option key={v.id} value={v.id}>{v.name ?? v.id}</option>
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

          <h3 className="subheading">Project metadata</h3>
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

        {/* Right: Dependencies with optional version select */}
        <section className="panel deps">
          <div className="deps-header">
            <h2 className="panel-title">Dependencies</h2>
            <input
              className="search"
              placeholder="Search dependencies…"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
            />
          </div>

          <div className="dep-groups">
            {filteredGroups.map((group) => (
              <fieldset key={group.name} className="dep-group">
                <legend>{group.name}</legend>
                {(group.values || []).map((dep) => {
                  const selected = dependencies.includes(dep.id);
                  const hasVersions =
                    Array.isArray(dep.versions) && dep.versions.length > 0;
                  const chosenVer = depVersions[dep.id] || "";

                  return (
                    <div key={dep.id} className="dep-item">
                      <label style={{ display: "flex", gap: 10, flex: 1 }}>
                        <input
                          type="checkbox"
                          checked={selected}
                          onChange={() => toggleDependency(dep.id)}
                        />
                        <div className="dep-texts" style={{ flex: 1 }}>
                          <span className="dep-name">{dep.name ?? dep.id}</span>
                          {dep.description ? (
                            <span className="dep-desc">{dep.description}</span>
                          ) : null}
                        </div>
                      </label>

                      {hasVersions && (
                        <div className="field" style={{ width: 180 }}>
                          <span>Version</span>
                          <select
                            value={chosenVer}
                            onChange={(e) =>
                              setDependencyVersion(dep.id, e.target.value)
                            }
                          >
                            {dep.versions.map((v) => (
                              <option key={v.id} value={v.id}>
                                {v.name ?? v.id}
                              </option>
                            ))}
                          </select>
                        </div>
                      )}
                    </div>
                  );
                })}
              </fieldset>
            ))}
          </div>
        </section>
      </main>

      <footer className="generate-bar">
        <div className="summary">
          <span className="chip">{type}</span>
          <span className="chip">{language}</span>
          <span className="chip">{packaging}</span>
          <span className="chip">Boot {bootVersion}</span>
          <span className="chip">Java {javaVersion}</span>
          <span className="chip accent">{dependencies.length} deps</span>
        </div>
        <button onClick={handleGenerate} className="btn primary">
          Generate Project
        </button>
      </footer>
    </div>
  );
}

export default App;
