'use server';

import { z } from 'zod';
import { db } from '@chat-next/database/client';
import { roomsTable } from '@chat-next/database/schema';
import { redirect } from 'next/navigation';

const FormSchema = z.object({
  name: z.string().nonempty().max(255),
  slug: z
    .string()
    .nonempty()
    .max(255)
    .regex(/^[a-z0-9-]*$/),
});

export type CreateRoomState = {
  name: { value: string; errors?: string[] };
  slug: { value: string; errors?: string[] };
  errors?: string[];
};

export async function createRoom(
  _prevState: CreateRoomState,
  formData: FormData,
): Promise<CreateRoomState> {
  const entries = Object.fromEntries(formData);
  const submitted = {
    name: typeof entries.name === 'string' ? entries.name : '',
    slug: typeof entries.slug === 'string' ? entries.slug : '',
  };
  const parseResult = FormSchema.safeParse(entries);
  if (!parseResult.success) {
    const flattenError = z.flattenError(parseResult.error);
    return {
      name: {
        value: submitted.name,
        errors: flattenError.fieldErrors.name,
      },
      slug: {
        value: submitted.slug,
        errors: flattenError.fieldErrors.slug,
      },
      errors: flattenError.formErrors,
    };
  }

  const [result] = await db
    .insert(roomsTable)
    .values({
      name: submitted.name,
      slug: submitted.slug,
    })
    .onConflictDoNothing()
    .returning();
  if (!result) {
    return {
      name: { value: submitted.name },
      slug: { value: submitted.slug },
      errors: ['Room with this slug already exists'],
    };
  }
  console.log('Room created', result);
  redirect('/rooms/' + result.slug);
}
