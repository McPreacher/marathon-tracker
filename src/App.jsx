import { useState, useEffect, useRef } from 'react';
import { Star, Plus, X, Settings, Edit3, Save, Check, Undo2, Trash2, Download, Upload } from 'lucide-react';
import './App.css';

function App() {
  const [marathons, setMarathons] = useState(() => {
    const saved = localStorage.getItem('marathon_data_warm');
    return saved ? JSON.parse(saved) : [];
  });
  
  const [selectedMarathonId, setSelectedMarathonId] = useState(null);
  const [selectedMovieId, setSelectedMovieId] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isEditingMarathon, setIsEditingMarathon] = useState(false);
  
  const [showAddMarathon, setShowAddMarathon] = useState(false);
  const [newMarathonName, setNewMarathonName] = useState("");
  const [showAddMovie, setShowAddMovie] = useState(false);
  const [newMovieData, setNewMovieData] = useState({ name: "", year: new Date().getFullYear() });

  // Settings State
  const [showSettings, setShowSettings] = useState(false);
  const fileInputRef = useRef(null);

  useEffect(() => {
    localStorage.setItem('marathon_data_warm', JSON.stringify(marathons));
  }, [marathons]);

  const activeMarathon = marathons.find(m => m.id === selectedMarathonId);
  const activeMovie = activeMarathon?.movies?.find(mov => mov.id === selectedMovieId);

  // --- DATA MANAGEMENT FUNCTIONS ---

  const exportToJson = () => {
    const dataStr = JSON.stringify(marathons, null, 2);
    const blob = new Blob([dataStr], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    
    const link = document.createElement("a");
    link.href = url;
    link.download = `marathons_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    setShowSettings(false);
  };

  const importFromJson = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const importedData = JSON.parse(event.target.result);
        if (Array.isArray(importedData)) {
          if (window.confirm("This will replace your current marathon list. Continue?")) {
            setMarathons(importedData);
            setSelectedMarathonId(null);
            setSelectedMovieId(null);
          }
        } else {
          alert("Invalid file format. Please upload a valid Marathon JSON.");
        }
      } catch (err) {
        alert("Error parsing JSON file.");
      }
    };
    reader.readAsText(file);
    setShowSettings(false);
    e.target.value = null; // Reset input
  };

  // --- EXISTING LOGIC ---

  const handleAddMarathon = (e) => {
    e.preventDefault();
    if (!newMarathonName.trim()) return;
    const newM = { id: Date.now(), name: newMarathonName, movies: [] };
    setMarathons([...marathons, newM]);
    setSelectedMarathonId(newM.id);
    setNewMarathonName("");
    setShowAddMarathon(false);
  };

  const deleteMarathon = (id) => {
    if (window.confirm("Are you sure you want to delete this entire marathon and all its movies?")) {
      setMarathons(marathons.filter(m => m.id !== id));
      if (selectedMarathonId === id) setSelectedMarathonId(null);
    }
  };

  const renameMarathon = (newName) => {
    setMarathons(marathons.map(m => 
      m.id === selectedMarathonId ? { ...m, name: newName } : m
    ));
  };

  const handleAddMovie = (e) => {
    e.preventDefault();
    if (!newMovieData.name.trim()) return;
    const newMovie = { 
      id: Date.now(), 
      name: newMovieData.name, 
      year: newMovieData.year, 
      userRating: null, 
      isWatched: false 
    };
    setMarathons(marathons.map(m => 
      m.id === selectedMarathonId ? { ...m, movies: [newMovie, ...m.movies] } : m
    ));
    setSelectedMovieId(newMovie.id);
    setNewMovieData({ name: "", year: new Date().getFullYear() });
    setShowAddMovie(false);
  };

  const updateMovieField = (field, value) => {
    setMarathons(marathons.map(m => 
      m.id === selectedMarathonId ? {
        ...m,
        movies: m.movies.map(mov => mov.id === selectedMovieId ? { ...mov, [field]: value } : mov)
      } : m
    ));
  };

  const setRating = (rating) => {
    const newVal = activeMovie.userRating === rating ? null : rating;
    updateMovieField('userRating', newVal);
  };

  return (
    <div className="container">
      <header className="app-header">
        <span>MOVIE MARATHON MANAGER</span>
        <div className="header-actions">
          <button className="icon-btn" onClick={() => setShowSettings(!showSettings)}>
            <Settings size={18} />
          </button>
          
          {showSettings && (
            <div className="settings-dropdown">
              <button onClick={exportToJson}>
                <Download size={14} /> Save
              </button>
              <button onClick={() => fileInputRef.current.click()}>
                <Upload size={14} /> Load
              </button>
              <input 
                type="file" 
                ref={fileInputRef} 
                style={{display:'none'}} 
                accept=".json" 
                onChange={importFromJson} 
              />
            </div>
          )}
        </div>
      </header>

      <div className="main-layout">
        <section className="column">
          <div className="column-header">
            <h3>Marathons</h3>
            <button onClick={() => setShowAddMarathon(!showAddMarathon)} className="teal-btn-sm">
              {showAddMarathon ? <Undo2 size={20} /> : <Plus size={24} strokeWidth={3} />}
            </button>
          </div>

          {showAddMarathon && (
            <form className="inline-add-form" onSubmit={handleAddMarathon}>
              <input 
                autoFocus
                placeholder="New Marathon Name..." 
                value={newMarathonName}
                onChange={(e) => setNewMarathonName(e.target.value)}
              />
              <button type="submit" className="form-check-btn"><Check size={20} strokeWidth={3}/></button>
            </form>
          )}

          <div className="list-box">
            {marathons.map(m => (
              <div 
                key={m.id} 
                className={`list-item ${selectedMarathonId === m.id ? 'selected' : ''}`}
                onClick={() => {setSelectedMarathonId(m.id); setSelectedMovieId(null); setShowAddMovie(false); setIsEditingMarathon(false);}}
              >
                <span>{m.name}</span>
                <button className="del-btn" title="Delete Marathon" onClick={(e) => {e.stopPropagation(); deleteMarathon(m.id)}}>
                  <Trash2 size={16}/>
                </button>
              </div>
            ))}
          </div>
        </section>

        <section className="column">
          <div className="column-header">
            {isEditingMarathon ? (
              <div className="inline-edit-header">
                <input 
                  autoFocus
                  className="header-edit-input"
                  value={activeMarathon?.name || ""}
                  onChange={(e) => renameMarathon(e.target.value)}
                  onBlur={() => setIsEditingMarathon(false)}
                />
                <button onClick={() => setIsEditingMarathon(false)} className="teal-btn-sm">
                  <Check size={20} strokeWidth={3} />
                </button>
              </div>
            ) : (
              <div className="header-title-row">
                <h3>{activeMarathon ? activeMarathon.name : "Movies"}</h3>
                {activeMarathon && (
                  <button onClick={() => setIsEditingMarathon(true)} className="icon-btn-tiny" title="Rename Marathon">
                    <Edit3 size={14} />
                  </button>
                )}
              </div>
            )}
            
            {selectedMarathonId && !isEditingMarathon && (
              <button onClick={() => setShowAddMovie(!showAddMovie)} className="teal-btn-sm">
                {showAddMovie ? <Undo2 size={20} /> : <Plus size={24} strokeWidth={3} />}
              </button>
            )}
          </div>

          {showAddMovie && (
            <form className="inline-add-form movie-grid-add" onSubmit={handleAddMovie}>
              <input 
                placeholder="Movie Title" 
                value={newMovieData.name}
                onChange={(e) => setNewMovieData({...newMovieData, name: e.target.value})}
              />
              <input 
                type="number" 
                className="year-input"
                value={newMovieData.year}
                onChange={(e) => setNewMovieData({...newMovieData, year: e.target.value})}
              />
              <button type="submit" className="form-check-btn"><Check size={20} strokeWidth={3}/></button>
            </form>
          )}

          <div className="list-box">
            {activeMarathon?.movies.map(mov => (
              <div 
                key={mov.id} 
                className={`list-item ${selectedMovieId === mov.id ? 'selected' : ''} ${mov.isWatched ? 'watched' : ''}`}
                onClick={() => {setSelectedMovieId(mov.id); setIsEditing(false);}}
              >
                <div className="movie-item-main">
                  {mov.name} ({mov.year})
                </div>
                
                {mov.isWatched && (
                  <div className="list-rating-container">
                    {mov.userRating ? (
                      <div className="mini-star-row">
                        {[1, 2, 3, 4, 5].map(s => (
                          <Star 
                            key={s} 
                            size={12} 
                            fill={mov.userRating >= s ? "var(--star-gold)" : "none"} 
                            color={mov.userRating >= s ? "var(--star-gold)" : "rgba(255,255,255,0.1)"}
                          />
                        ))}
                      </div>
                    ) : (
                      <span className="rating-badge">not rated</span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          {activeMovie && (
            <div className="details-panel">
              <div className="column-header" style={{border:'none', padding:0, marginBottom:'15px'}}>
                <h3 style={{color:'var(--accent-warm)'}}>Movie Details</h3>
                <button onClick={() => setIsEditing(!isEditing)} className="teal-btn-sm">
                  {isEditing ? <Save size={20} /> : <Edit3 size={20} />}
                </button>
              </div>
              
              <div className="grid-form">
                <label>Name:</label>
                <input 
                  type="text" 
                  disabled={!isEditing}
                  value={activeMovie.name}
                  onChange={(e) => updateMovieField('name', e.target.value)}
                />

                <label>Year:</label>
                <input 
                  type="number" 
                  disabled={!isEditing}
                  value={activeMovie.year}
                  onChange={(e) => updateMovieField('year', e.target.value)}
                />

                <label>Rating:</label>
                <div className="star-row">
                  {[1, 2, 3, 4, 5].map(s => (
                    <Star 
                      key={s}
                      size={24}
                      fill={activeMovie.userRating >= s ? "var(--star-gold)" : "none"}
                      color={activeMovie.userRating >= s ? "var(--star-gold)" : "var(--text-dim)"}
                      className={activeMovie.userRating >= s ? "star-active" : ""}
                      onClick={() => setRating(s)}
                    />
                  ))}
                </div>

                <label>Watched:</label>
                <input 
                  type="checkbox" 
                  checked={activeMovie.isWatched}
                  onChange={(e) => updateMovieField('isWatched', e.target.checked)}
                  style={{width:'20px', height:'20px', cursor:'pointer'}}
                />
              </div>
              <button className="delete-movie-btn" onClick={() => {
                if(window.confirm("Delete movie?")) {
                  setMarathons(marathons.map(m => m.id === selectedMarathonId ? 
                    {...m, movies: m.movies.filter(mov => mov.id !== selectedMovieId)} : m));
                  setSelectedMovieId(null);
                }
              }}>
                DELETE MOVIE FROM LIST
              </button>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}

export default App;