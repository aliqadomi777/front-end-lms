import React from "react";
import ReactQuill from "react-quill";
import "react-quill/dist/quill.snow.css";

const RichTextEditor = ({
  value,
  onChange,
  placeholder,
  className,
  ariaLabel,
  tabIndex,
  ...props
}) => (
  <ReactQuill
    value={value}
    onChange={onChange}
    placeholder={placeholder}
    className={className}
    aria-label={ariaLabel}
    tabIndex={tabIndex}
    modules={{
      toolbar: [
        [{ header: [1, 2, false] }],
        ["bold", "italic", "underline", "strike", "blockquote"],
        [{ list: "ordered" }, { list: "bullet" }],
        ["link", "code"],
        ["clean"],
      ],
    }}
    formats={[
      "header",
      "bold",
      "italic",
      "underline",
      "strike",
      "blockquote",
      "list",
      "bullet",
      "link",
      "code",
    ]}
    {...props}
  />
);

export default RichTextEditor;
