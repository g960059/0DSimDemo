import { BlockNoteSchema, defaultBlockSpecs } from '@blocknote/core';
const schema = BlockNoteSchema.create({ blockSpecs: { ...defaultBlockSpecs } });
console.log('Schema created');
