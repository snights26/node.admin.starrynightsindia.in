import "./FeaturedRowsList.css";
import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import api from "../../Utils/api";
import Pagination, { usePagination } from "../../Common/Pagination";

function FeaturedRowsList() {
  const navigate = useNavigate();
  const [rows, setRows] = useState([]);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [selectedRow, setSelectedRow] = useState(null);
  const [search, setSearch] = useState("");
  const [isReordering, setIsReordering] = useState(false);
  const filteredRows = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return rows;
    return rows.filter((row) => [row.rowId, row.id, row.title, row.rowTitle, row.type, row.visibleOn]
      .some((value) => String(value || "").toLowerCase().includes(query)));
  }, [rows, search]);
  const { page, pageCount, pageItems, setPage } = usePagination(filteredRows, 5, search);

  useEffect(() => {
    const loadRows = async () => {
      try {
        const data = await api.get("/featured-rows");
        setRows(Array.isArray(data) ? data : []);
      } catch (error) {
        console.error("Failed to load featured rows", error);
        setRows([]);
      }
    };

    loadRows();
  }, []);

  const handleDragEnd = (result) => {
    if (!isReordering || !result.destination) return;
    const items = Array.from(rows);
    const [moved] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, moved);
    setRows(items.map((item, index) => ({ ...item, sequence: index + 1 })));
  };

  const handleSaveOrder = async () => {
    await api.post("/featured-rows/order", rows.map((row) => ({
      rowId: row.rowId || row.id,
      sequence: row.sequence
    })));
    setIsReordering(false);
  };

  const deleteRow = async () => {
    const rowId = selectedRow.rowId || selectedRow.id;
    try {
      await api.delete(`/featured-rows/${rowId}`);
      setRows(rows.filter((row) => (row.rowId || row.id) !== rowId));
    } finally {
      setShowDeleteModal(false);
      setSelectedRow(null);
    }
  };

  const getTypeLabel = (type) => type === "package" ? "Package" : type === "category" ? "Category" : type;
  const getVisibleLabel = (val) => val === "home" ? "Home" : val === "trending" ? "Trending" : val === "both" ? "Both" : val;

  return (
    <>
      <div className="fr-page">
        <div className="fr-header">
          <div className="fr-title">Featured Rows</div>
          <div className="fr-actions">
            <button className="fr-add" onClick={() => navigate("/admin/featured-rows/add")}>Add Row</button>
            <button
              className="fr-reorder"
              type="button"
              disabled={Boolean(search.trim())}
              title={search.trim() ? "Clear search before reordering rows." : undefined}
              onClick={() => setIsReordering((current) => !current)}
            >
              {isReordering ? "Exit Reorder" : "Reorder All"}
            </button>
            <button className="fr-save-order" type="button" disabled={!isReordering} onClick={handleSaveOrder}>Save Order</button>
            <button className="fr-back" onClick={() => navigate("/dashboard")}>Back</button>
          </div>
        </div>

        <input
          className="fr-search"
          type="search"
          placeholder="Search rows by ID, title, type, or visibility..."
          value={search}
          disabled={isReordering}
          onChange={(event) => setSearch(event.target.value)}
        />

        {isReordering && <p className="fr-order-hint">Drag any row to its required position, then select Save Order. Pagination is temporarily hidden so all rows can be ordered together.</p>}

        <div className="fr-table-wrapper">
          <DragDropContext onDragEnd={handleDragEnd}>
            <Droppable droppableId="rows">
              {(provided) => (
                <table className="fr-table" ref={provided.innerRef} {...provided.droppableProps}>
                  <thead>
                    <tr>
                      <th></th>
                      <th>Row ID</th>
                      <th>Title</th>
                      <th>Type</th>
                      <th>Visible On</th>
                      <th>Action</th>
                    </tr>
                  </thead>

                  <tbody>
                    {filteredRows.length === 0 ? (
                      <tr>
                        <td colSpan="6" className="fr-empty">No Rows Found</td>
                      </tr>
                    ) : (
                      (isReordering ? rows : pageItems).map((r, index) => (
                        <Draggable key={r.rowId || r.id} draggableId={r.rowId || r.id} index={index} isDragDisabled={!isReordering}>
                          {(dragProvided, snapshot) => (
                            <tr ref={dragProvided.innerRef} {...dragProvided.draggableProps} className={snapshot.isDragging ? "dragging" : ""}>
                              <td {...dragProvided.dragHandleProps} className="fr-drag">::</td>
                              <td>{r.rowId || r.id}</td>
                              <td>{r.title || r.rowTitle}</td>
                              <td><span className={`fr-badge ${r.type}`}>{getTypeLabel(r.type)}</span></td>
                              <td><span className={`fr-badge visible-${r.visibleOn}`}>{getVisibleLabel(r.visibleOn)}</span></td>
                              <td>
                                <div className="fr-action-btns">
                                  <button className="fr-btn fr-edit" onClick={() => navigate(`/admin/featured-rows/edit/${r.rowId || r.id}`)}>
                                    Edit
                                  </button>
                                  <button className="fr-btn fr-delete" onClick={() => { setSelectedRow(r); setShowDeleteModal(true); }}>
                                    Delete
                                  </button>
                                </div>
                              </td>
                            </tr>
                          )}
                        </Draggable>
                      ))
                    )}
                    {provided.placeholder}
                  </tbody>
                </table>
              )}
            </Droppable>
          </DragDropContext>
        </div>
        {!isReordering && <Pagination page={page} pageCount={pageCount} setPage={setPage} itemCount={filteredRows.length} label="featured rows" />}
      </div>

      {showDeleteModal && (
        <div className="fr-modal-overlay">
          <div className="fr-modal">
            <h3>Delete Row?</h3>
            <p>Are you sure you want to delete <b>{selectedRow?.title || selectedRow?.rowTitle}</b>?</p>
            <div className="fr-modal-actions">
              <button className="fr-cancel" onClick={() => setShowDeleteModal(false)}>Cancel</button>
              <button className="fr-confirm" onClick={deleteRow}>Delete</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

export default FeaturedRowsList;
