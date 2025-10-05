import { getJWTHeaders } from "./auth";

const API_URL = "http://localhost:8000/core/v1"

export interface CreateNotesRequest{
  video_id: string;
  query: string;
}

export async function createNotes(request: CreateNotesRequest){
  const JWTHeaders = await getJWTHeaders();
  try{
    const response = await fetch(`${API_URL}/notes/create_notes`, {
      method: "POST",
      headers: {
        ...JWTHeaders,
        "Content-Type": "application/json",
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Failed to create Notes: ${response.statusText}`)
    }
    const data = await response.json();
    console.log(data);
    return data.content;
  } catch (error) {
    console.error("Failed to create notes", error);
    throw new Error(`Failed to create notes`);
  }
}

export interface UpdateNotesStatus{
  notes_id: string;
  status: string;
}

export async function updateNotesStatus(request: UpdateNotesStatus){
  const JWTHeaders = await getJWTHeaders();
  try {
    const response = await fetch(`${API_URL}/notes/update_notes_status`, {
      method: "POST",
      headers: {
        ...JWTHeaders,
        "Content-Type":"application/json"
      },
      body: JSON.stringify(request)
    });

    if (!response.ok) {
      throw new Error(`Error updating notes status ${response.statusText}`)
    }
    const data = await response.json()
    console.log(data);
    return data.content;
  } catch (error) {
    console.error("Error updating notes status", error)
    throw new Error(`Failed to update notes status`)
  }
}