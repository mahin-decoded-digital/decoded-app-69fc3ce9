import { Router } from 'express';
import { db } from '../lib/db.js';

type WithMongoId = { _id: string; [key: string]: unknown };
function project<T extends WithMongoId>(doc: T): Omit<T, '_id'> & { id: string } {
  const { _id, ...rest } = doc;
  return { id: _id, ...rest } as Omit<T, '_id'> & { id: string };
}

const router = Router();

interface EmailtemplateBody {
  name?: string;
  category?: 'welcome' | 'requirement-blast' | 'dd-request' | 'status-update' | 'post-settlement' | 'referrer-thanks' | 'other';
  subject?: string;
  body?: string;
  isActive?: boolean;
}

// list
router.get('/', async (req, res) => {
  const items = await db.collection('emailtemplates').find();
  res.json(items.map(project));
});

// create
router.post('/', async (req, res) => {
  const body = req.body as EmailtemplateBody;
  if (!body || !body.name) {
    res.status(400).json({ error: 'name is required' });
    return;
  }
  const now = new Date().toISOString();
  const doc: Record<string, unknown> = {
    ...body,
    createdAt: now,
    updatedAt: now,
  };
  delete (doc as { id?: unknown }).id;
  const id = await db.collection('emailtemplates').insertOne(doc);
  const created = await db.collection('emailtemplates').findById(id);
  if (!created) {
    res.status(500).json({ error: 'failed to create' });
    return;
  }
  res.status(201).json(project(created));
});

// update
router.put('/:id', async (req, res) => {
  const body = req.body as EmailtemplateBody;
  const now = new Date().toISOString();
  const updated_fields: Record<string, unknown> = {
    ...body,
    updatedAt: now,
  };
  delete (updated_fields as { id?: unknown }).id;
  const found = await db.collection('emailtemplates').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('emailtemplates').updateOne(req.params.id, updated_fields);
  const updated = await db.collection('emailtemplates').findById(req.params.id);
  if (!updated) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  res.json(project(updated));
});

// delete
router.delete('/:id', async (req, res) => {
  const found = await db.collection('emailtemplates').findById(req.params.id);
  if (!found) {
    res.status(404).json({ error: 'Not found' });
    return;
  }
  await db.collection('emailtemplates').deleteOne(req.params.id);
  res.json({ success: true });
});

export default router;
