import "./forms.css";

export function TextInput({ label, className = "", ...props }) {
  return (
    <label className={`form-control-wrap ${className}`.trim()}>
      {label && <span>{label}</span>}
      <input {...props} />
    </label>
  );
}

export function SelectInput({ label, children, className = "", ...props }) {
  return (
    <label className={`form-control-wrap ${className}`.trim()}>
      {label && <span>{label}</span>}
      <select {...props}>{children}</select>
    </label>
  );
}

export function TextArea({ label, className = "", ...props }) {
  return (
    <label className={`form-control-wrap ${className}`.trim()}>
      {label && <span>{label}</span>}
      <textarea {...props} />
    </label>
  );
}

export const SearchBar = (props) => <TextInput type="search" {...props} />;
export const DatePicker = (props) => <TextInput type="date" {...props} />;
