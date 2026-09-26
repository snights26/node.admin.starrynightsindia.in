import "./AddPackage.css";
import { useNavigate } from "react-router-dom";
import AddPackageForm from "../Forms/Addpackageform";

function AddPackage(){

  const navigate = useNavigate();

  return(
    <div className="addpkg-container">

      <div className="addpkg-header">
        <button
          className="addpkg-back-btn"
          onClick={()=>navigate("/admin/packages")}
        >
          ⬅ Back
        </button>

        <h2>Add Package</h2>
      </div>

      <div className="addpkg-form-wrapper">
        <AddPackageForm mode="add"/>
      </div>

    </div>
  )
}

export default AddPackage;
