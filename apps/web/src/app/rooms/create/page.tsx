'use client';
import { createRoom } from '@/actions/createRoom';
import type { CreateRoomState } from '@/actions/createRoom';
import { useActionState, useMemo } from 'react';

export default function CreateRoomPage() {
  const initialState = useMemo<CreateRoomState>(
    () => ({ name: { value: '' }, slug: { value: '' } }),
    [],
  );
  const [state, dispatchCreateRoom] = useActionState(createRoom, initialState);
  console.log(state);
  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Create New Room</h1>
      <form action={dispatchCreateRoom} className="max-w-md">
        <div className="mb-4">
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Room Name
          </label>
          <input
            type="text"
            id="name"
            name="name"
            className="w-full px-3 py-2 border rounded-md"
            defaultValue={state.name.value}
            aria-describedby="name-error"
          />
          <div id="name-error" aria-live="polite" aria-atomic="true">
            {state.name.errors?.map((e, i) => (
              <div className="text-red-500 text-sm" key={i}>
                {e}
              </div>
            ))}
          </div>
        </div>
        <div className="mb-4">
          <label htmlFor="slug" className="block text-sm font-medium mb-1">
            Room Slug
          </label>
          <input
            type="text"
            id="slug"
            name="slug"
            className="w-full px-3 py-2 border rounded-md"
            defaultValue={state.slug.value}
            pattern="[a-z0-9-]+"
            aria-describedby="slug-error"
          />
          <div id="slug-error" aria-live="polite" aria-atomic="true">
            {state.slug.errors?.map((e, i) => (
              <div className="text-red-500 text-sm" key={i}>
                {e}
              </div>
            ))}
          </div>
        </div>
        <div id="form-error" aria-live="polite" aria-atomic="true">
          {state.errors?.map((e, i) => (
            <div className="text-red-500 text-sm" key={i}>
              {e}
            </div>
          ))}
        </div>
        <button
          type="submit"
          className="bg-blue-500 text-white px-4 py-2 rounded-md hover:bg-blue-600"
        >
          Create Room
        </button>
      </form>
    </div>
  );
}
