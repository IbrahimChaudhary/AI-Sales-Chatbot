import { Loader2 } from "lucide-react";
import React from "react";

export default function Loader() {
  return (
    <div className="flex items-center justify-center p-12">
      <Loader2 className="h-8 w-8 animate-spin" />
    </div>
  );
}
