import "./EditPackage.css";
import { useNavigate, useParams } from "react-router-dom";
import { useEffect, useState } from "react";
import AddPackageForm from "../Forms/Addpackageform";
import api from "../../Utils/api";

function EditPackage(){

  const navigate = useNavigate();
  const { id } = useParams();

  const [data,setData] = useState(null);

  useEffect(()=>{
    const loadPackage = async () => {
      try {
        const pkg = await api.get(`/packages/${id}`);
        setData(pkg);
      } catch (error) {
        console.error("Failed to load package", error);
        setData(null);
      }
    };

    loadPackage();
  },[id]);

  return(
    <div className="editpkg-container">

      <div className="editpkg-header">
        <button
          className="editpkg-back-btn"
          onClick={()=>navigate("/admin/packages")}
        >
          ⬅ Back
        </button>

        <h2>Edit Package</h2>
      </div>

      <div className="editpkg-form-wrapper">
        {data && <AddPackageForm mode="edit" data={data}/>}
      </div>

    </div>
  )
}

export default EditPackage;
