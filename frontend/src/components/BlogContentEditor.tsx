"use client";

import dynamic from "next/dynamic";
import "suneditor/dist/css/suneditor.min.css";

const SunEditor = dynamic(() => import("suneditor-react"), { ssr: false });

interface Props {
  defaultValue?: string;
  onChange: (value: string) => void;
}

export default function BlogContentEditor({
  defaultValue = "",
  onChange,
}: Props) {
  return (
    <SunEditor
      defaultValue={defaultValue}
      onChange={onChange}
      height="400"
      setOptions={{
        buttonList: [
          ["undo", "redo"],
          ["font", "fontSize", "formatBlock"],
          ["bold", "underline", "italic", "strike"],
          ["fontColor", "hiliteColor", "removeFormat"],
          ["outdent", "indent"],
          ["align", "horizontalRule", "list", "lineHeight"],
          ["table", "link", "image"],
          ["fullScreen", "showBlocks", "codeView"],
        ],
        fullScreenOffset: 0,
      }}
    />
  );
}
