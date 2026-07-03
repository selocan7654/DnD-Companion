import { Navigate, useParams } from 'react-router-dom';

/** S-CHAR-EDIT — redirects to character builder */
export function CharacterEditRedirect() {
  const { id } = useParams<{ id: string }>();

  if (!id) {
    return <Navigate to="/my-characters" replace />;
  }

  return <Navigate to={`/characters/${id}/builder`} replace />;
}
