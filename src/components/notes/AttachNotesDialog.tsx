import { useState } from "react";
import { Dialog } from "../ui/dialog";
import { DialogContent } from "@radix-ui/react-dialog";
import { Notes } from "./NotesPage";
import { useNotes } from "@/context/NotesContext";
import { useSelecteNotes } from "@/context/SelectedNotesContext";

interface AttachNotesCardDialog {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  setInputMode: (mode: "notes" | "normal" | "attach") => void;
}

export function AttachNotesCard({
  open,
  onOpenChange,
  setInputMode
}: AttachNotesCardDialog){
  const { notes } = useNotes();
  // const { selectedNotes, setSelectedNotes } = useSelecteNotes();

  const handleOnOpenChange = (newOpen : boolean) => {
    if (!newOpen){
      onOpenChange(newOpen)
    } else{
      setInputMode("normal")
      onOpenChange(newOpen)
    }
  }

  

  console.log("Entered Attach Notes")
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="w-max bg-white text-black">        
        <div>
            See Notes to Attach to message
        </div>
      </DialogContent>
    </Dialog>
  )
}