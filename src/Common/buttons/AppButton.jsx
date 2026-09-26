import "./buttons.css";

const variants = {
  submit: "primary",
  save: "primary",
  cancel: "secondary",
  back: "ghost",
  view: "secondary",
  edit: "secondary",
  delete: "danger",
};

export default function AppButton({ variant = "secondary", type = "button", className = "", children, ...props }) {
  const resolvedVariant = variants[variant] || variant;
  return (
    <button type={type} className={`app-button app-button--${resolvedVariant} ${className}`.trim()} {...props}>
      {children}
    </button>
  );
}

export const BackButton = (props) => <AppButton variant="back" {...props} />;
export const ViewButton = (props) => <AppButton variant="view" {...props} />;
export const SubmitButton = (props) => <AppButton variant="submit" type="submit" {...props} />;
export const CancelButton = (props) => <AppButton variant="cancel" {...props} />;
export const EditButton = (props) => <AppButton variant="edit" {...props} />;
export const DeleteButton = (props) => <AppButton variant="delete" {...props} />;
export const SaveButton = (props) => <AppButton variant="save" {...props} />;
