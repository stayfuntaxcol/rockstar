import { Routes, Route, Navigate } from "react-router-dom";
import SignIn from "./features/auth/SignIn";
import Pipeline from "./features/pipeline/Pipeline";
import Contacts from "./features/contacts/Contacts";

export default function App(){
  return (
    <Routes>
      <Route path="/" element={<Navigate to="/pipeline" replace />} />
      <Route path="/signin" element={<SignIn />} />
      <Route path="/pipeline" element={<Pipeline />} />
      <Route path="/contacts" element={<Contacts />} />
      <Route path="*" element={<div style={{padding:16}}>404</div>} />
    </Routes>
  );
}
