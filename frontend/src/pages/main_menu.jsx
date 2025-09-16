import React, { useEffect, useState } from "react";
import 'bootstrap/dist/css/bootstrap.min.css';
import { useNavigate } from "react-router-dom"; 
import "./StyleSheet.css";
import Navbar from "../pages/navbar";

function MainMenu() {
  const navigate = useNavigate();
  const [journals, setJournals] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedImage, setSelectedImage] = useState(null); // 👈 for modal image

  useEffect(() => {
    const session_id = localStorage.getItem("session_id");

    fetch("http://127.0.0.1:5000/main_menu", {
      headers: { "Authorization": session_id }
    })
      .then(res => res.json())
      .then(data => {
        setJournals(data.journals || []);
      })
      .catch(err => console.error(err));
  }, []);

  const handleCreate = () => {
    navigate("/journal");
  };

  const handleEdit = (journal) => {
    navigate(`/journal/${journal.id}`); 
  };

  const filteredJournals = journals.filter((item) => {
    const term = searchTerm.toLowerCase();
    const dateString = item.date ? new Date(item.date).toLocaleDateString().toLowerCase() : "";

    return (
      (item.title && item.title.toLowerCase().includes(term)) ||
      (item.description && item.description.toLowerCase().includes(term)) ||
      (item.address && item.address.toLowerCase().includes(term)) ||
      dateString.includes(term)
    );
  });

  const handleDelete = async (id) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this journal?");
    if (!confirmDelete) {
      return;
    }
    
    try {
      const response = await fetch(`http://127.0.0.1:5000/journal/${id}`, {
        method: "DELETE",
        headers: { 
          "Authorization": localStorage.getItem("session_id") 
        }
      });

      const msg = await response.json();
      if (response.ok) {
        setJournals(journals.filter(j => j.id !== id));
        alert(msg.message);
      } else {
        alert(msg.errormsg || "Failed to delete journal");
      }

    } catch (err) {
      console.error(err);
      alert("An error occurred while deleting the journal.");
    }
  };

  return (
    <div className="body_container">
      <Navbar />

      <div className="main-content mt-3 ">
        <h5 className="ms-2 mt-2">All journals: </h5>

        {/* Search Bar */}
        <div className="d-flex justify-content-start ms-3 mb-2">
          <input
            type="text"
            placeholder="Search journals..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="form-control w-50 search_bar border-3"
          />
        </div>

        <ul className="list-group ms-3 me-3 mt-2">
          { filteredJournals.length === 0 ? (
            <li className="list-group-item item_container">No journals Found</li>
          ) : (
            filteredJournals.map((item) => (
              <li key={item.id} className="list-group-item item_container">
                <div className="journal_items">
                  <div className="d-flex justify-content-between align-items-center">
                    <h5 className="title fw-bold mb-3 mt-2">{item.title}</h5>
                    <p>
                      <span className="words">
                        {item.date ? (" " + new Date(item.date).toLocaleDateString()) : " None"}
                      </span>
                    </p>
                  </div>

                  {/* address */}
                  <div className="mb-4">
                    <p className="words">
                      {item.address ? ("📍 " + item.address) : ""}
                    </p>
                  </div>
                  
                  <div className="ms-2">
                    <p className="words"> 
                      {" " + item.description || ""}
                    </p>
                  </div>
                </div>

                {/* Images */}
                <div className="images-container">
                  {item.images && item.images.length > 0 && item.images.map((img, idx) => (
                    <img 
                      key={idx} 
                      alt={`preview-${idx}`} 
                      width="120"
                      className="border rounded me-2 cursor-pointer"
                      src={`data:image/jpeg;base64,${img.images}`} 
                      onClick={() => setSelectedImage(`data:image/jpeg;base64,${img.images}`)} // 👈 open modal
                    />
                  ))}
                </div>

                {/* Edit and Delete buttons */}
                <div className="d-flex justify-content-end">
                  <button className="btn btn-primary btn-sm me-2" onClick={() => handleEdit(item)}>Edit</button>
                  <button 
                    className="btn btn-danger btn-sm" 
                    onClick={() => handleDelete(item.id)}>Delete
                  </button>
                </div>
              </li>
            ))
          )}
        </ul>

        <div className="d-flex justify-content-center">
          <button className="btn btn-success ms-5 my-5" onClick={handleCreate}>Create New Journal</button>
        </div>
      </div> 

      {/* Modal for enlarged image */}
      {selectedImage && (
        <div 
          className="position-fixed top-0 start-0 w-100 h-100 d-flex align-items-center justify-content-center bg-dark bg-opacity-75"
          onClick={() => setSelectedImage(null)} // close on background click
        >
          <img 
            src={selectedImage} 
            alt="Large preview" 
            className="img-fluid rounded shadow-lg" 
            style={{ maxHeight: "90%", maxWidth: "90%" }}
          />
        </div>
      )}
    </div>   
  );
}
export default MainMenu;
