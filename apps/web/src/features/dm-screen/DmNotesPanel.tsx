import { useState } from 'react';
import { ArrowDown, ArrowUp, Loader2, Pencil, Plus, Trash2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { LoadingSpinner } from '@/components/LoadingSpinner';
import { toast } from '@/hooks/use-toast';
import { getApiErrorMessage } from '@/lib/api-error';
import {
  useCreateDmNoteMutation,
  useDeleteDmNoteMutation,
  useGetDmNotesQuery,
  useReorderDmNotesMutation,
  useUpdateDmNoteMutation,
} from '@/store/api/campaignsApi';
import type { DmNote } from '@/types/api';

interface DmNotesPanelProps {
  campaignId: string;
}

export function DmNotesPanel({ campaignId }: DmNotesPanelProps) {
  const { data, isLoading, isError } = useGetDmNotesQuery(campaignId);
  const [createNote, { isLoading: isCreating }] = useCreateDmNoteMutation();
  const [updateNote, { isLoading: isUpdating }] = useUpdateDmNoteMutation();
  const [deleteNote, { isLoading: isDeleting }] = useDeleteDmNoteMutation();
  const [reorderNotes, { isLoading: isReordering }] = useReorderDmNotesMutation();

  const [showCreate, setShowCreate] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');
  const [deleteConfirmId, setDeleteConfirmId] = useState<string | null>(null);
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());

  const notes = data?.data ?? [];
  const busy = isCreating || isUpdating || isDeleting || isReordering;

  const handleCreate = async () => {
    const title = newTitle.trim();
    if (!title) {
      toast({ title: 'Title is required' });
      return;
    }
    try {
      await createNote({
        campaignId,
        body: { title, content: newContent.trim() || undefined },
      }).unwrap();
      setNewTitle('');
      setNewContent('');
      setShowCreate(false);
      toast({ title: 'Note created' });
    } catch (error) {
      toast({
        title: 'Failed to create note',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const startEdit = (note: DmNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content ?? '');
  };

  const saveEdit = async () => {
    if (!editingId) return;
    const title = editTitle.trim();
    if (!title) {
      toast({ title: 'Title is required' });
      return;
    }
    try {
      await updateNote({
        campaignId,
        noteId: editingId,
        body: { title, content: editContent },
      }).unwrap();
      setEditingId(null);
      toast({ title: 'Note updated' });
    } catch (error) {
      toast({
        title: 'Failed to update note',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const confirmDelete = async (noteId: string) => {
    try {
      await deleteNote({ campaignId, noteId }).unwrap();
      setDeleteConfirmId(null);
      toast({ title: 'Note deleted' });
    } catch (error) {
      toast({
        title: 'Failed to delete note',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const moveNote = async (noteId: string, direction: -1 | 1) => {
    const index = notes.findIndex((n) => n.id === noteId);
    const target = index + direction;
    if (index < 0 || target < 0 || target >= notes.length) return;
    const next = [...notes];
    const [removed] = next.splice(index, 1);
    next.splice(target, 0, removed);
    try {
      await reorderNotes({
        campaignId,
        noteIds: next.map((n) => n.id),
      }).unwrap();
    } catch (error) {
      toast({
        title: 'Failed to reorder notes',
        description: getApiErrorMessage(error, 'Something went wrong'),
      });
    }
  };

  const toggleExpanded = (id: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (isLoading) {
    return <LoadingSpinner label="Loading DM notes" />;
  }

  if (isError) {
    return (
      <Alert variant="destructive">
        <AlertDescription>Failed to load DM notes.</AlertDescription>
      </Alert>
    );
  }

  return (
    <section className="space-y-4" aria-labelledby="dm-notes-heading">
      <div className="flex items-center justify-between gap-2">
        <h2 id="dm-notes-heading" className="text-lg font-semibold">
          DM Notes
        </h2>
        <Button
          type="button"
          size="sm"
          onClick={() => setShowCreate((v) => !v)}
          aria-expanded={showCreate}
        >
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add note
        </Button>
      </div>

      {showCreate ? (
        <Card>
          <CardHeader className="p-4 pb-2">
            <CardTitle className="text-base">New note</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3 p-4 pt-0">
            <div className="space-y-1">
              <Label htmlFor="new-note-title">Title</Label>
              <Input
                id="new-note-title"
                value={newTitle}
                onChange={(e) => setNewTitle(e.target.value)}
                maxLength={200}
                disabled={busy}
              />
            </div>
            <div className="space-y-1">
              <Label htmlFor="new-note-content">Content</Label>
              <Textarea
                id="new-note-content"
                value={newContent}
                onChange={(e) => setNewContent(e.target.value)}
                rows={4}
                disabled={busy}
              />
            </div>
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => setShowCreate(false)}
                disabled={busy}
              >
                Cancel
              </Button>
              <Button
                type="button"
                onClick={() => void handleCreate()}
                disabled={busy}
                aria-busy={isCreating}
              >
                {isCreating ? (
                  <Loader2 className="h-4 w-4 animate-spin" aria-hidden="true" />
                ) : null}
                Save
              </Button>
            </div>
          </CardContent>
        </Card>
      ) : null}

      {notes.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No notes yet. Click + to create your first note.
        </p>
      ) : (
        <ul className="space-y-3">
          {notes.map((note, index) => {
            const isEditing = editingId === note.id;
            const isExpanded = expandedIds.has(note.id);
            const preview =
              note.content && note.content.length > 120 && !isExpanded
                ? `${note.content.slice(0, 120)}…`
                : note.content;

            return (
              <li key={note.id}>
                <Card>
                  <CardHeader className="space-y-2 p-4 pb-2">
                    {isEditing ? (
                      <div className="space-y-1">
                        <Label htmlFor={`edit-title-${note.id}`}>Title</Label>
                        <Input
                          id={`edit-title-${note.id}`}
                          value={editTitle}
                          onChange={(e) => setEditTitle(e.target.value)}
                          disabled={busy}
                        />
                      </div>
                    ) : (
                      <CardTitle className="text-base">{note.title}</CardTitle>
                    )}
                  </CardHeader>
                  <CardContent className="space-y-3 p-4 pt-0">
                    {isEditing ? (
                      <div className="space-y-1">
                        <Label htmlFor={`edit-content-${note.id}`}>Content</Label>
                        <Textarea
                          id={`edit-content-${note.id}`}
                          value={editContent}
                          onChange={(e) => setEditContent(e.target.value)}
                          rows={4}
                          disabled={busy}
                        />
                        <div className="flex justify-end gap-2">
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => setEditingId(null)}
                            disabled={busy}
                          >
                            Cancel
                          </Button>
                          <Button
                            type="button"
                            size="sm"
                            onClick={() => void saveEdit()}
                            disabled={busy}
                          >
                            Save
                          </Button>
                        </div>
                      </div>
                    ) : (
                      <>
                        {preview ? (
                          <p className="whitespace-pre-wrap text-sm text-muted-foreground">
                            {preview}
                          </p>
                        ) : (
                          <p className="text-sm italic text-muted-foreground">Empty note</p>
                        )}
                        {note.content && note.content.length > 120 ? (
                          <Button
                            type="button"
                            variant="link"
                            size="sm"
                            className="h-auto p-0"
                            onClick={() => toggleExpanded(note.id)}
                          >
                            {isExpanded ? 'Show less' : 'Show more'}
                          </Button>
                        ) : null}
                        <div className="flex flex-wrap gap-1">
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Move ${note.title} up`}
                            disabled={busy || index === 0}
                            onClick={() => void moveNote(note.id, -1)}
                          >
                            <ArrowUp className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Move ${note.title} down`}
                            disabled={busy || index === notes.length - 1}
                            onClick={() => void moveNote(note.id, 1)}
                          >
                            <ArrowDown className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Edit ${note.title}`}
                            disabled={busy}
                            onClick={() => startEdit(note)}
                          >
                            <Pencil className="h-4 w-4" aria-hidden="true" />
                          </Button>
                          <Button
                            type="button"
                            size="icon"
                            variant="ghost"
                            aria-label={`Delete ${note.title}`}
                            disabled={busy}
                            onClick={() => setDeleteConfirmId(note.id)}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        </div>
                      </>
                    )}
                  </CardContent>
                </Card>

                {deleteConfirmId === note.id ? (
                  <div
                    className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
                    role="dialog"
                    aria-modal="true"
                    aria-labelledby={`delete-note-${note.id}`}
                  >
                    <div className="w-full max-w-sm rounded-lg border bg-background p-6 shadow-lg">
                      <h3 id={`delete-note-${note.id}`} className="text-lg font-semibold">
                        Delete note?
                      </h3>
                      <p className="mt-2 text-sm text-muted-foreground">
                        This will permanently delete &quot;{note.title}&quot;.
                      </p>
                      <div className="mt-4 flex justify-end gap-2">
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => setDeleteConfirmId(null)}
                          disabled={isDeleting}
                        >
                          Cancel
                        </Button>
                        <Button
                          type="button"
                          variant="destructive"
                          onClick={() => void confirmDelete(note.id)}
                          disabled={isDeleting}
                          aria-busy={isDeleting}
                        >
                          Delete
                        </Button>
                      </div>
                    </div>
                  </div>
                ) : null}
              </li>
            );
          })}
        </ul>
      )}
    </section>
  );
}
