import { useEffect, useState } from "react";
import { db } from "./firebase";
import {
  doc,
  onSnapshot,
  setDoc,
  updateDoc,
  getDoc,
} from "firebase/firestore";
import "./index.css";

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
  const [editingIndex, setEditingIndex] = useState(null);
  const [searchTerm, setSearchTerm] = useState(""); // Nuevo estado para búsqueda

  const userKey = `${userInfo.className}_${userInfo.username}`;

  // Escuchar cambios desde Firebase
  useEffect(() => {
    if (!isLogged) return;
    const ref = doc(db, "verbLists", userKey);
    const unsubscribe = onSnapshot(ref, (docSnap) => {
      if (docSnap.exists()) {
        setVerbsList(docSnap.data().verbs || []);
      }
    });
    return () => unsubscribe();
  }, [isLogged, userKey]);

  // Guardar manualmente
  const saveVerbsToFirestore = async (newVerbsList) => {
    const ref = doc(db, "verbLists", userKey);
    await updateDoc(ref, { verbs: newVerbsList });
  };

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((f) => ({ ...f, [name]: value }));
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
    if (editingIndex !== null) {
      const updated = [...verbsList];
      updated[editingIndex] = formData;
      setVerbsList(updated);
      saveVerbsToFirestore(updated);
      setEditingIndex(null);
    } else {
      const updated = [...verbsList, formData];
      setVerbsList(updated);
      saveVerbsToFirestore(updated);
    }

    setFormData({
      verbo: "",
      traduccion: "",
      pasado: "",
      participio: "",
      tipo: "regular",
    });
  };

  const handleDelete = (index) => {
    const updated = verbsList.filter((_, i) => i !== index);
    setVerbsList(updated);
    saveVerbsToFirestore(updated);
  };

  const handleEdit = (index) => {
    setFormData(verbsList[index]);
    setEditingIndex(index);
  };

  // Filtrar verbos por término de búsqueda
  const filteredVerbs = verbsList.filter(verb => 
    verb.verbo.toLowerCase().includes(searchTerm.toLowerCase())
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
        <h1>Diccionario de Verbos</h1>
      </div>
      
      <form onSubmit={handleSubmit} className="verb-form">
        <input
          type="text"
          name="verbo"
          placeholder="Verbo"
          value={formData.verbo}
          onChange={handleChange}
          required
        />
        <input
          type="text"
          name="traduccion"
          placeholder="Traducción"
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
          required
        />
        <input
          type="text"
          name="participio"
          placeholder="Participio pasado"
          value={formData.participio}
          onChange={handleChange}
          required
        />
        
        {/* Botones para seleccionar tipo de verbo */}
        <div className="verb-type-container">
          <button
            type="button"
            className={`verb-type-btn regular ${formData.tipo === 'regular' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'regular'})}
          >
            Regular
          </button>
          <button
            type="button"
            className={`verb-type-btn irregular ${formData.tipo === 'irregular' ? 'active' : ''}`}
            onClick={() => setFormData({...formData, tipo: 'irregular'})}
          >
            Irregular
          </button>
        </div>
        
        <button
          type="submit"
          className="btn-submit"
        >
          {editingIndex !== null ? "Actualizar" : "Agregar"}
        </button>
      </form>

      {/* Campo de búsqueda */}
      <div className="search-container">
        <input
          type="text"
          placeholder="Buscar verbo en español..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="search-input"
        />
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Verbo</th>
              <th>Traducción</th>
              <th>Pasado</th>
              <th>Participio</th>
              <th>Tipo</th>
              <th>Acciones</th>
            </tr>
          </thead>
          <tbody>
            {filteredVerbs.map((verb, index) => (
              <tr key={index} className={`${verb.tipo}-row`}>
                <td>{verb.verbo}</td>
                <td>{verb.traduccion}</td>
                <td>{verb.pasado}</td>
                <td>{verb.participio}</td>
                <td className={verb.tipo}>
                  {verb.tipo === "regular" ? "Regular" : "Irregular"}
                </td>
                <td>
                  <div className="action-buttons">
                    <button
                      onClick={() => handleEdit(index)}
                      className="btn-edit"
                    >
                      Editar
                    </button>
                    <button
                      onClick={() => handleDelete(index)}
                      className="btn-delete"
                    >
                      Eliminar
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default App;