import { useEffect, useState, useRef } from "react";
import { db } from "./firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import "./App.css";

const App = () => {
  const [formData, setFormData] = useState({
    verbo: "",
    traduccion: "",
    pasado: "",
    participio: "",
    tipo: "regular",
  });

  const [userInfo, setUserInfo] = useState({
    username: "",
    className: "",
  });

  const [isLogged, setIsLogged] = useState(false);
  const [verbsList, setVerbsList] = useState([]);
  const [editingId, setEditingId] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [errorMessage, setErrorMessage] = useState("");

  const formRef = useRef(null); // Referencia al formulario
  const userKey = `${userInfo.className}_${userInfo.username}`;

  // Escuchar cambios desde Firebase
  useEffect(() => {
    if (!isLogged) return;
    const ref = doc(db, "verbLists", userKey);
    const unsubscribe = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        const verbs = docSnap.data().verbs || [];
        // Agregar ID único a cada verbo
        const verbsWithId = verbs.map(verb => ({
          ...verb,
          id: Math.random().toString(36).substr(2, 9) // ID único
        }));
        
        // Ordenar verbos alfabéticamente por traducción (inglés)
        const sortedVerbs = [...verbsWithId].sort((a, b) => 
          a.traduccion.localeCompare(b.traduccion)
        );
        setVerbsList(sortedVerbs);
      }
    });
    return () => unsubscribe();
  }, [isLogged, userKey]);

  // Guardar manualmente
  const saveVerbsToFirestore = async (newVerbsList) => {
    // Eliminar IDs antes de guardar en Firebase
    const verbsToSave = newVerbsList.map(({id, ...rest}) => rest);
    const ref = doc(db, "verbLists", userKey);
    await updateDoc(ref, { verbs: verbsToSave });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
    // Limpiar mensajes de error al cambiar el campo de traducción
    if (name === "traduccion" && errorMessage) {
      setErrorMessage("");
    }
  };

  const handleUserInfoChange = (e) => {
    const { name, value } = e.target;
    setUserInfo((prev) => ({ ...prev, [name]: value }));
  };

  const handleUserSubmit = async (e) => {
    e.preventDefault();
    const ref = doc(db, "verbLists", userKey);
    const docSnap = await getDoc(ref);
    if (!docSnap.exists()) {
      await setDoc(ref, { verbs: [] });
    }
    setIsLogged(true);
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    
    // Validar campos requeridos
    if (formData.tipo !== "phrasal") {
      if (!formData.pasado || !formData.participio) {
        setErrorMessage("Los campos Pasado y Participio son requeridos para verbos regulares e irregulares");
        return;
      }
    }
    
    // Verificar si el verbo en inglés ya existe
    const normalizedEnglish = formData.traduccion.trim().toLowerCase();
    const isDuplicate = verbsList.some((verb) => {
      // Excluir el verbo que estamos editando de la verificación
      if (editingId && verb.id === editingId) return false;
      return verb.traduccion.trim().toLowerCase() === normalizedEnglish;
    });
    
    if (isDuplicate) {
      setErrorMessage("Este verbo en inglés ya ha sido agregado anteriormente");
      return;
    }
    
    if (editingId) {
      // Encontrar el verbo por ID en lugar de índice
      const updated = verbsList.map(verb => 
        verb.id === editingId ? {...formData, id: editingId} : verb
      );
      
      // Ordenar después de actualizar
      const sortedVerbs = [...updated].sort((a, b) => 
        a.traduccion.localeCompare(b.traduccion)
      );
      
      setVerbsList(sortedVerbs);
      saveVerbsToFirestore(sortedVerbs);
      setEditingId(null);
    } else {
      const newVerb = {
        ...formData,
        id: Math.random().toString(36).substr(2, 9) // Nuevo ID único
      };
      
      const updated = [...verbsList, newVerb];
      
      // Ordenar después de agregar
      const sortedVerbs = [...updated].sort((a, b) => 
        a.traduccion.localeCompare(b.traduccion)
      );
      
      setVerbsList(sortedVerbs);
      saveVerbsToFirestore(sortedVerbs);
    }

    setFormData({
      verbo: "",
      traduccion: "",
      pasado: "",
      participio: "",
      tipo: "regular",
    });
    
    setErrorMessage("");
  };

  const handleDelete = (id) => {
    const updated = verbsList.filter(verb => verb.id !== id);
    setVerbsList(updated);
    saveVerbsToFirestore(updated);
  };

  const handleEdit = (verb) => {
    setFormData({
      verbo: verb.verbo,
      traduccion: verb.traduccion,
      pasado: verb.pasado,
      participio: verb.participio,
      tipo: verb.tipo
    });
    setEditingId(verb.id);
    setErrorMessage("");
    
    // Scroll automático al formulario después de un pequeño retraso
    setTimeout(() => {
      if (formRef.current) {
        formRef.current.scrollIntoView({
          behavior: "smooth",
          block: "start"
        });
      }
    }, 50);
  };

  const handleTypeChange = (type) => {
    setFormData({
      ...formData,
      tipo: type
    });
  };

  // Filtrar verbos por término de búsqueda
  const filteredVerbs = verbsList.filter(verb => 
    verb.verbo.toLowerCase().includes(searchTerm.toLowerCase()) ||
    verb.traduccion.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (!isLogged) {
    return (
      <div className="flex-center">
        <form onSubmit={handleUserSubmit} className="login-container">
          <h2>Diccionario de Verbos</h2>
          <div className="form-group">
            <input
              required
              type="text"
              name="username"
              placeholder="Nombre de usuario"
              value={userInfo.username}
              onChange={handleUserInfoChange}
            />
          </div>
          <div className="form-group">
            <input
              required
              type="text"
              name="className"
              placeholder="Nombre de clase"
              value={userInfo.className}
              onChange={handleUserInfoChange}
            />
          </div>
          <button type="submit" className="btn btn-primary">
            Entrar
          </button>
        </form>
      </div>
    );
  }

  return (
    <div className="container">
      <div className="header">
        <h1>Diccionario de Verbos <span className="verb-counter">({verbsList.length})</span></h1>
      </div>
      
      <form ref={formRef} onSubmit={handleSubmit} className="verb-form">
        <input
          type="text"
          name="verbo"
          placeholder="Verbo o Phrasal Verb"
          value={formData.verbo}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="traduccion"
          placeholder="Traducción (inglés)"
          value={formData.traduccion}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="pasado"
          placeholder="Pasado simple"
          value={formData.pasado}
          onChange={handleChange}
        />
        <input
          type="text"
          name="participio"
          placeholder="Participio pasado"
          value={formData.participio}
          onChange={handleChange}
        />
        
        {/* Botones para seleccionar tipo de verbo */}
        <div className="verb-type-container">
          <button
            type="button"
            className={`verb-type-btn regular ${formData.tipo === 'regular' ? 'active' : ''}`}
            onClick={() => handleTypeChange('regular')}
          >
            Regular
          </button>
          <button
            type="button"
            className={`verb-type-btn irregular ${formData.tipo === 'irregular' ? 'active' : ''}`}
            onClick={() => handleTypeChange('irregular')}
          >
            Irregular
          </button>
          <button
            type="button"
            className={`verb-type-btn phrasal ${formData.tipo === 'phrasal' ? 'active' : ''}`}
            onClick={() => handleTypeChange('phrasal')}
          >
            Phrasal Verb
          </button>
        </div>
        
        <button
          type="submit"
          className="btn-submit"
        >
          {editingId ? "Actualizar" : "Agregar"}
        </button>
      </form>

      {/* Mensaje de error */}
      {errorMessage && (
        <div className="error-message">
          {errorMessage}
        </div>
      )}

      {/* Campo de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar verbo o traducción..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th className="verbo-col">Verbo</th>
              <th className="traduccion-col">Traducción</th>
              <th className="pasado-col">Pasado</th>
              <th className="participio-col">Participio</th>
              <th className="tipo-col">Tipo</th>
              <th className="acciones-col">Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVerbs.length > 0 ? (
              filteredVerbs.map((verb) => (
                <tr key={verb.id} className={`${verb.tipo}-row`}>
                  <td>{verb.verbo}</td>
                  <td>{verb.traduccion}</td>
                  <td>{verb.pasado}</td>
                  <td>{verb.participio}</td>
                  <td className={`tipo-cell ${verb.tipo}`}>
                    {verb.tipo === "regular" ? "R" : 
                     verb.tipo === "irregular" ? "I" : "V"}
                  </td>
                  <td>
                    <div className="action-buttons">
                      <button
                        onClick={() => handleEdit(verb)}
                        className="btn-edit"
                      >
                        Editar
                      </button>
                      <button
                        onClick={() => handleDelete(verb.id)}
                        className="btn-delete"
                      >
                        Eliminar
                      </button>
                    </div>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="6" className="empty-message">
                  No se encontraron verbos. ¡Agrega tu primer verbo!
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;