import { z } from 'zod';
import { bilingual, TextSchema } from './common';

export const DigitalMaterialsPayloadSchema = bilingual(
  z.strictObject({
    eyebrow: TextSchema,
    title: TextSchema,
    status: TextSchema,
    body: TextSchema,
    backLabel: TextSchema,
  }).readonly(),
);

export const EditableDigitalMaterialsPayloadSchema = DigitalMaterialsPayloadSchema;
