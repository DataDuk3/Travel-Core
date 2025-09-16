import React, { useState, useEffect } from "react";
import Navbar from "./navbar";
import { MapContainer, TileLayer, Marker, useMapEvents } from "react-leaflet";
import "leaflet/dist/leaflet.css";
import L from "leaflet";
import { useNavigate, useParams } from "react-router-dom";

// Fix default marker icon
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: require("leaflet/dist/images/marker-icon-2x.png"),
  iconUrl: require("leaflet/dist/images/marker-icon.png"),
  shadowUrl: require("leaflet/dist/images/marker-shadow.png"),
});

function LocationMarker({ setAddress, setPosition }) {
  useMapEvents({
    click(e) {
      const { lat, lng } = e.latlng;
      setPosition([lat, lng]);

      fetch(
        `https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`
      )
        .then((res) => res.json())
        .then((data) => setAddress(data.display_name || "Address not found"))
        .catch(() => setAddress("Error fetching address"));
    },
  });

  return null;
}

export default function CreateJournal() {
  const navigate = useNavigate();
  const { id } = useParams();

  // State hooks
  const [title, setTitle] = useState("");
  const [date, setDate] = useState("");
  const [description, setDescription] = useState("");
  const [address, setAddress] = useState("");
  const [position, setPosition] = useState(null);
  const [images, setImages] = useState([]); // new uploads
  const [existingImages, setExistingImages] = useState([]); // existing images from DB
  const [preview, setPreview] = useState([]);

  // Fetch journal data if editing
  useEffect(() => {
    if (id) {
      fetch(`http://127.0.0.1:5000/journal/${id}`, {
        headers: {
          Authorization: localStorage.getItem("session_id") || "",
        },
      })
        .then((res) => res.json())
        .then((data) => {
          setTitle(data.title || "");
          setDate(data.date ? new Date(data.date).toISOString().split("T")[0] : "");
          setDescription(data.description || "");
          setAddress(data.address || "");
          setPosition(data.position ? JSON.parse(data.position) : null);

          if (data.images && data.images.length > 0) {
            const existing = data.images.map((img) => ({
              id: img.id,
              src: `data:image/jpeg;base64,${img.images}`,
            }));
            setExistingImages(existing);
            setPreview(existing.map((img) => img.src));
          }
        })
        .catch((err) => console.error("Fetch error:", err));
    }
  }, [id]);

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    setImages(files);
    setPreview([...existingImages.map((img) => img.src), ...files.map((file) => URL.createObjectURL(file))]);
  };

  const handleDelete = (index) => {
    const confirmDelete = window.confirm("Are you sure you want to delete this image?")
    if (!confirmDelete) return;

    const isNew = index >= existingImages.length;
    if (isNew) {
      setImages((prev) => prev.filter((_, i) => i !== index - existingImages.length));
    } else {
      setExistingImages((prev) => prev.filter((_, i) => i !== index));
    }
    setPreview((prev) => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    const confirmSubmit = window.confirm("Are you sure you want to save?")
    if (!confirmSubmit) {
     e.preventDefault();
     return;
    }

    e.preventDefault();
    const formData = new FormData();
    formData.append("session_id", localStorage.getItem("session_id"));
    formData.append("title", title);
    formData.append("date", date);
    formData.append("description", description);
    formData.append("address", address);
    formData.append("position", JSON.stringify(position));

    // Add new images
    images.forEach((img) => formData.append("images", img));

    // Add existing image IDs to keep
    existingImages.forEach((img) => formData.append("keep_images", img.id));

    try {
      const url = id
        ? `http://127.0.0.1:5000/update/${id}`
        : "http://127.0.0.1:5000/create";

      const response = await fetch(url, {
        method: "POST",
        body: formData,
      });

      const data = await response.json();
      alert(data.message ? data.message : data.errormsg);
      navigate("/main_menu");
    } catch (err) {
      alert("Error submitting form: " + err.message);
    }
  };

  return (
    <div>
      <Navbar />
      <form onSubmit={handleSubmit} className="p-3">
        <h4>{id ? "Edit Journal" : "Create Journal"}</h4>

        <div className="inputs mb-2">
          <input
            placeholder="Title"
            value={title}
            required
            onChange={(e) => setTitle(e.target.value)}
            className="form-control mb-2"
          />
          <input
            type="date"
            value={date}
            required
            onChange={(e) => setDate(e.target.value)}
            className="form-control ms-2 mb-2 w-25"
          />
        </div>

        <div className="inputs mb-3">
          <textarea
            placeholder="Description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            className="form-control"
          />
        </div>

        <div className="mb-2">
          <h6>📍 Selected Location:</h6>
          <MapContainer
            center={position || [14.5995, 120.9842]}
            zoom={13}
            style={{ height: "400px", width: "100%" }}
          >
            <TileLayer
              url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
              attribution='&copy; OpenStreetMap contributors'
            />
            <LocationMarker setAddress={setAddress} setPosition={setPosition} />
            {position && <Marker position={position}></Marker>}
          </MapContainer>
        </div>

        <div className="mb-2">
          <p> 📍 {address || "Click on the map to pick a location"}</p>
        </div>

        <div className="inputs mb-2 flex-column">
          <h6>Upload Images</h6>
          <input
            type="file"
            accept="image/*"
            multiple
            onChange={handleFileChange}
            className="form-control"
          />

          <div className="mt-2 d-flex flex-row flex-nowrap overflow-auto">
            {preview.map((src, index) => (
              <div key={index} style={{ position: "relative", marginRight: "10px" }}>
                <img src={src} alt={`preview-${index}`} width="120" className="border rounded" />
                <button
                  type="button"
                  onClick={() => handleDelete(index)}
                  className="img_del">×
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="d-flex justify-content-end">
          <button type="submit" className="btn btn-success me-2">
            {id ? "Save Changes" : "Submit"}
          </button>
          <button className="btn btn-secondary" type="button" onClick={() => {
            if (window.confirm("Are you sure you want to cancel? Any unsaved changes will be lost.")) {
              navigate("/main_menu")}}
          }>Cancel</button>
            
        </div>
      </form>
    </div>
  );
}
